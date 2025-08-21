// src/components/QuickPeek.jsx
import { useEffect, useState, useRef } from 'react'
import { X, Activity, Stethoscope, FlaskConical, Camera, Target, Star } from 'lucide-react'
import { useQuickPeek } from '../Backend/useApi'

export default function QuickPeek({ diseaseId, position, onClose, trigger = 'hover' }) {
  const [visible, setVisible] = useState(false)
  const [loadStartTime, setLoadStartTime] = useState(null)
  const [renderTime, setRenderTime] = useState(null)
  const peekRef = useRef(null)
  
  const { peekData, loading, error, showPeek, hidePeek } = useQuickPeek()

  // Load data when component mounts
  useEffect(() => {
    if (diseaseId) {
      setLoadStartTime(performance.now())
      showPeek(diseaseId)
      setVisible(true)
    }
    
    return () => {
      hidePeek()
      setVisible(false)
    }
  }, [diseaseId, showPeek, hidePeek])

  // Track render performance
  useEffect(() => {
    if (peekData && loadStartTime) {
      const endTime = performance.now()
      const duration = endTime - loadStartTime
      setRenderTime(duration)
      
      // Log performance for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Quick Peek rendered in ${duration.toFixed(2)}ms`)
      }
    }
  }, [peekData, loadStartTime])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        e.preventDefault()
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onClose])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (peekRef.current && !peekRef.current.contains(e.target)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  // Don't render if not visible
  if (!visible || !diseaseId) return null

  // Calculate position to avoid viewport edges
  const getAdjustedPosition = () => {
    const padding = 16
    const peekWidth = 320
    const peekHeight = 280
    
    let x = position.x - (peekWidth / 2)
    let y = position.y - peekHeight - 10
    
    // Adjust horizontal position
    if (x < padding) {
      x = padding
    } else if (x + peekWidth > window.innerWidth - padding) {
      x = window.innerWidth - peekWidth - padding
    }
    
    // Adjust vertical position
    if (y < padding) {
      y = position.y + 10 // Show below instead
    }
    
    return { x, y }
  }

  const adjustedPosition = getAdjustedPosition()

  // Feature type icons
  const getFeatureIcon = (type) => {
    switch (type) {
      case 'symptom': return <Activity className="w-4 h-4 text-blue-500" />
      case 'sign': return <Stethoscope className="w-4 h-4 text-green-500" />
      case 'lab': return <FlaskConical className="w-4 h-4 text-purple-500" />
      case 'imaging': return <Camera className="w-4 h-4 text-orange-500" />
      case 'criterion': return <Target className="w-4 h-4 text-red-500" />
      default: return <Star className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" />
      
      {/* Quick Peek Card */}
      <div
        ref={peekRef}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-h-72 overflow-hidden"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          animation: 'quickPeekFadeIn 150ms ease-out'
        }}
        role="dialog"
        aria-label="Disease Quick Peek"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {peekData?.disease_name || 'Loading...'}
            </h3>
            {peekData && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {peekData.system}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {peekData.subsystem}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close quick peek"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-48">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Loading...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm">
                Failed to load disease data
              </div>
            </div>
          )}

          {peekData && !loading && (
            <div className="space-y-3">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-blue-900">
                    {peekData.total_features}
                  </div>
                  <div className="text-xs text-blue-700">Total Features</div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-purple-900">
                    {peekData.pathognomonic_features}
                  </div>
                  <div className="text-xs text-purple-700">Pathognomonic</div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-amber-900">
                    {peekData.high_weight_features}
                  </div>
                  <div className="text-xs text-amber-700">High Weight</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-green-900">
                    {peekData.common_features}
                  </div>
                  <div className="text-xs text-green-700">Common</div>
                </div>
              </div>

              {/* Feature Type Breakdown */}
              {peekData.feature_breakdown && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Feature Types</h4>
                  <div className="space-y-1">
                    {Object.entries(peekData.feature_breakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getFeatureIcon(type)}
                          <span className="capitalize text-gray-700">{type}</span>
                        </div>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Performance indicator (dev only) */}
        {process.env.NODE_ENV === 'development' && renderTime && (
          <div className={`text-xs px-2 py-1 border-t ${
            renderTime <= 250 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            Rendered in {renderTime.toFixed(1)}ms
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes quickPeekFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  )
}

// Higher-order component for adding quick peek to any element
export function withQuickPeek(WrappedComponent) {
  return function QuickPeekWrapper({ diseaseId, children, ...props }) {
    const [showPeek, setShowPeek] = useState(false)
    const [peekPosition, setPeekPosition] = useState({ x: 0, y: 0 })
    const timeoutRef = useRef(null)

    const handleMouseEnter = (event) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      const rect = event.target.getBoundingClientRect()
      setPeekPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
      
      // Small delay to prevent accidental triggers
      timeoutRef.current = setTimeout(() => {
        setShowPeek(true)
      }, 100)
    }

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Small delay before hiding to allow mouse to move to peek
      timeoutRef.current = setTimeout(() => {
        setShowPeek(false)
      }, 200)
    }

    const handleFocus = (event) => {
      const rect = event.target.getBoundingClientRect()
      setPeekPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      })
      setShowPeek(true)
    }

    const handleBlur = () => {
      setShowPeek(false)
    }

    return (
      <>
        <WrappedComponent
          {...props}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={0}
        >
          {children}
        </WrappedComponent>
        
        {showPeek && diseaseId && (
          <QuickPeek
            diseaseId={diseaseId}
            position={peekPosition}
            onClose={() => setShowPeek(false)}
          />
        )}
      </>
    )
  }
}