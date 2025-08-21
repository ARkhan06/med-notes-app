// src/components/TokenInput.jsx
import { useState, useRef, useEffect } from 'react'
import { Search, X, Plus, Minus, ArrowUp, ArrowDown, Check, AlertCircle } from 'lucide-react'
import { useFeatureSearch, useTokenParser, useFeatureCanonicalization } from '../Backend/useApi'
import { parseTokensClient } from '../Backend/api'
import toast from 'react-hot-toast'

export default function TokenInput({ diseaseId, onTokensAdded, placeholder = "Enter features: +Dyspnea -Murmur Ferritin↓ MCV<80" }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [processedTokens, setProcessedTokens] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  
  // Get the current word being typed for autocomplete
  const getCurrentWord = () => {
    const cursorPos = inputRef.current?.selectionStart || 0
    const words = input.split(/\s+/)
    let currentPos = 0
    
    for (let i = 0; i < words.length; i++) {
      const wordEnd = currentPos + words[i].length
      if (cursorPos <= wordEnd) {
        return {
          word: words[i].replace(/^[+-]/, ''), // Remove +/- prefix for search
          index: i,
          startPos: currentPos,
          endPos: wordEnd
        }
      }
      currentPos = wordEnd + 1 // +1 for space
    }
    
    return { word: '', index: words.length, startPos: input.length, endPos: input.length }
  }

  const currentWord = getCurrentWord()
  const { results: suggestions, loading: searching } = useFeatureSearch(
    currentWord.word.length >= 2 ? currentWord.word : ''
  )
  const { parseTokens } = useTokenParser()

  // Show suggestions when typing
  useEffect(() => {
    setShowSuggestions(
      currentWord.word.length >= 2 && 
      suggestions.length > 0 && 
      document.activeElement === inputRef.current
    )
    setSelectedIndex(0)
  }, [currentWord.word, suggestions.length])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSubmit()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        selectSuggestion(suggestions[selectedIndex])
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Insert selected suggestion
  const selectSuggestion = (suggestion) => {
    if (!suggestion) return

    const words = input.split(/\s+/)
    const prefix = words[currentWord.index]?.match(/^[+-]?/)?.[0] || ''
    
    // Replace current word with suggestion
    words[currentWord.index] = prefix + suggestion.name
    
    const newInput = words.join(' ') + ' '
    setInput(newInput)
    setShowSuggestions(false)
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(newInput.length, newInput.length)
    }, 0)
  }

  // Process and submit tokens
  const handleSubmit = async () => {
    if (!input.trim() || !diseaseId) return

    setIsProcessing(true)
    
    try {
      // Parse tokens using backend
      const { data: tokens, error } = await parseTokens(input.trim())
      
      if (error) {
        toast.error('Error parsing tokens: ' + error.message)
        return
      }

      setProcessedTokens(tokens || [])
      
      // If all tokens were successfully parsed, add them
      const successfulTokens = tokens?.filter(t => t.canonical_feature_id) || []
      if (successfulTokens.length > 0 && onTokensAdded) {
        onTokensAdded(successfulTokens)
        setInput('') // Clear input after successful submission
        setProcessedTokens([])
        toast.success(`Added ${successfulTokens.length} features`)
      }
    } catch (error) {
      console.error('Error processing tokens:', error)
      toast.error('Error processing input')
    } finally {
      setIsProcessing(false)
    }
  }

  // Render individual token chip
  const TokenChip = ({ token, onRemove }) => {
    const getTokenIcon = () => {
      if (!token.is_present) return <Minus className="w-3 h-3 text-red-500" />
      if (token.value_modifier === '↑') return <ArrowUp className="w-3 h-3 text-green-500" />
      if (token.value_modifier === '↓') return <ArrowDown className="w-3 h-3 text-red-500" />
      return <Plus className="w-3 h-3 text-green-500" />
    }

    const getTokenColor = () => {
      if (!token.canonical_feature_id) return 'bg-red-100 text-red-800 border-red-200'
      if (!token.is_present) return 'bg-red-50 text-red-700 border-red-200'
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-sm ${getTokenColor()}`}>
        {getTokenIcon()}
        <span className="font-medium">
          {token.canonical_name || token.original_token}
        </span>
        {token.value_modifier && (
          <span className="text-xs opacity-75">{token.value_modifier}</span>
        )}
        {token.numeric_value && (
          <span className="text-xs opacity-75">{token.numeric_value}</span>
        )}
        {!token.canonical_feature_id && (
          <AlertCircle className="w-3 h-3 text-red-500" />
        )}
        <button
          onClick={() => onRemove(token)}
          className="hover:bg-black/10 rounded-full p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(currentWord.word.length >= 2 && suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow clicking suggestions
            placeholder={placeholder}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {searching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                  index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{suggestion.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({suggestion.type})</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {suggestion.match_type === 'alias' ? `via "${suggestion.matched_text}"` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Processed Tokens Preview */}
      {processedTokens.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Processed Tokens:</h4>
          <div className="flex flex-wrap gap-2">
            {processedTokens.map((token, index) => (
              <TokenChip
                key={index}
                token={token}
                onRemove={() => setProcessedTokens(prev => prev.filter((_, i) => i !== index))}
              />
            ))}
          </div>
          
          {/* Summary */}
          <div className="text-sm text-gray-600">
            <span className="text-green-600">
              {processedTokens.filter(t => t.canonical_feature_id).length} recognized
            </span>
            {processedTokens.filter(t => !t.canonical_feature_id).length > 0 && (
              <>
                {' • '}
                <span className="text-red-600">
                  {processedTokens.filter(t => !t.canonical_feature_id).length} need manual creation
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p><strong>Examples:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li><code>+Dyspnea -Murmur</code> - Present/absent features</li>
          <li><code>Ferritin↓ TIBC↑</code> - Directional changes</li>
          <li><code>MCV&lt;80 Hemoglobin&gt;12</code> - Numeric values</li>
          <li><code>SOB Spoon Nails</code> - Use aliases, autocomplete helps</li>
        </ul>
      </div>
    </div>
  )
}