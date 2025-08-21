// src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  searchFeatures,
  canonicalizeFeature,
  parseMedicalTokens,
  compareDiseases,
  getUserDiseases,
  getDiseaseStats,
  exportToSheets,
  createFeature,
  addFeatureToDisease,
  createDebouncedSearch,
  getCachedDiseaseStats
} from '../Backend/api'

// =====================================================
// FEATURE SEARCH HOOK
// =====================================================

export const useFeatureSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Create debounced search function
  const debouncedSearch = useRef(
    createDebouncedSearch(searchFeatures, 300)
  ).current

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const performSearch = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data, error } = await debouncedSearch(query, 10)
        if (error) throw error
        setResults(data || [])
      } catch (err) {
        setError(err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [query, debouncedSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch
  }
}

// =====================================================
// TOKEN PARSING HOOK
// =====================================================

export const useTokenParser = () => {
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState(null)

  const parseTokens = useCallback(async (tokenString) => {
    if (!tokenString.trim()) return []

    setParsing(true)
    setError(null)

    try {
      const { data, error } = await parseMedicalTokens(tokenString)
      if (error) throw error
      return data || []
    } catch (err) {
      setError(err)
      return []
    } finally {
      setParsing(false)
    }
  }, [])

  return {
    parseTokens,
    parsing,
    error
  }
}

// =====================================================
// DISEASE COMPARISON HOOK
// =====================================================

export const useDiseaseComparison = () => {
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const compareSelectedDiseases = useCallback(async (diseaseIds) => {
    if (!diseaseIds || diseaseIds.length === 0) {
      setComparisonData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await compareDiseases(diseaseIds)
      if (error) throw error
      setComparisonData(data)
    } catch (err) {
      setError(err)
      setComparisonData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearComparison = useCallback(() => {
    setComparisonData(null)
    setError(null)
  }, [])

  return {
    comparisonData,
    loading,
    error,
    compareSelectedDiseases,
    clearComparison
  }
}

// =====================================================
// DISEASES LIST HOOK
// =====================================================

export const useDiseases = () => {
  const [diseases, setDiseases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDiseases = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getUserDiseases()
      if (error) throw error
      setDiseases(data || [])
    } catch (err) {
      setError(err)
      setDiseases([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDiseases()
  }, [fetchDiseases])

  return {
    diseases,
    loading,
    error,
    refetch: fetchDiseases
  }
}

// =====================================================
// QUICK PEEK HOOK
// =====================================================

export const useQuickPeek = () => {
  const [peekData, setPeekData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  const showPeek = useCallback(async (diseaseId) => {
    if (!diseaseId) return

    setLoading(true)
    setError(null)
    setVisible(true)

    try {
      const { data, error } = await getCachedDiseaseStats(diseaseId)
      if (error) throw error
      setPeekData(data)
    } catch (err) {
      setError(err)
      setPeekData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const hidePeek = useCallback(() => {
    setVisible(false)
    setPeekData(null)
    setError(null)
  }, [])

  return {
    peekData,
    loading,
    error,
    visible,
    showPeek,
    hidePeek
  }
}

// =====================================================
// EXPORT HOOK
// =====================================================

export const useExport = () => {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [lastExport, setLastExport] = useState(null)

  const exportData = useCallback(async (diseaseIds, sheetName = null) => {
    if (!diseaseIds || diseaseIds.length === 0) {
      throw new Error('No diseases selected for export')
    }

    setExporting(true)
    setError(null)

    try {
      const { data, error } = await exportToSheets(diseaseIds, sheetName)
      if (error) throw error
      
      setLastExport({
        ...data,
        timestamp: new Date(),
        diseaseCount: diseaseIds.length
      })
      
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    exportData,
    exporting,
    error,
    lastExport
  }
}

// =====================================================
// FEATURE CREATION HOOK
// =====================================================

export const useFeatureCreation = () => {
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const createNewFeature = useCallback(async (featureData) => {
    setCreating(true)
    setError(null)

    try {
      const { data, error } = await createFeature(featureData)
      if (error) throw error
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setCreating(false)
    }
  }, [])

  const addFeatureToExistingDisease = useCallback(async (diseaseId, featureId, featureDetails) => {
    setCreating(true)
    setError(null)

    try {
      const { data, error } = await addFeatureToDisease(diseaseId, featureId, featureDetails)
      if (error) throw error
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setCreating(false)
    }
  }, [])

  return {
    createNewFeature,
    addFeatureToExistingDisease,
    creating,
    error
  }
}

// =====================================================
// FEATURE CANONICALIZATION HOOK
// =====================================================

export const useFeatureCanonicalization = () => {
  const [canonicalizing, setCanonicalizing] = useState(false)
  const [error, setError] = useState(null)

  const canonicalize = useCallback(async (inputText) => {
    if (!inputText.trim()) return null

    setCanonicalizing(true)
    setError(null)

    try {
      const { data, error } = await canonicalizeFeature(inputText)
      if (error) throw error
      return data
    } catch (err) {
      setError(err)
      return null
    } finally {
      setCanonicalizing(false)
    }
  }, [])

  return {
    canonicalize,
    canonicalizing,
    error
  }
}

// =====================================================
// COMPLEX WORKFLOW HOOKS
// =====================================================

// Hook for the token input workflow (parse → canonicalize → add to disease)
export const useTokenInputWorkflow = (diseaseId) => {
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  const processTokenInput = useCallback(async (tokenString) => {
    if (!tokenString.trim() || !diseaseId) return

    setProcessing(true)
    setError(null)

    try {
      // Parse tokens
      const { data: parsedTokens, error: parseError } = await parseMedicalTokens(tokenString)
      if (parseError) throw parseError

      // Process each token
      const processedTokens = []
      for (const token of parsedTokens || []) {
        if (token.canonical_feature_id) {
          // Feature exists, add to disease
          const featureDetails = {
            value_text: token.value_modifier || null,
            is_present: token.is_present,
            typicality: 'common', // Default, can be adjusted later
            weight: 1 // Default, can be adjusted later
          }

          const { data: addResult, error: addError } = await addFeatureToDisease(
            diseaseId,
            token.canonical_feature_id,
            featureDetails
          )

          if (addError) {
            console.error('Error adding feature to disease:', addError)
          }

          processedTokens.push({
            ...token,
            added: !addError,
            addError: addError?.message
          })
        } else {
          // Feature not found, mark for manual handling
          processedTokens.push({
            ...token,
            added: false,
            needsManualCreation: true
          })
        }
      }

      setResults(processedTokens)
    } catch (err) {
      setError(err)
      setResults([])
    } finally {
      setProcessing(false)
    }
  }, [diseaseId])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    processTokenInput,
    processing,
    results,
    error,
    clearResults
  }
}