// src/lib/backendConfig.js
import { supabase } from '../database/supabase'

/**
 * Backend Service Configuration for Med Notes
 * 
 * This file centralizes all backend operations and provides
 * a clean interface for the frontend components.
 */

// =====================================================
// CONFIGURATION CONSTANTS
// =====================================================

export const BACKEND_CONFIG = {
  // RPC Function Names
  RPC_FUNCTIONS: {
    SEARCH_FEATURES: 'search_features_advanced',
    CANONICALIZE_FEATURE: 'canonicalize_feature',
    COMPARE_DISEASES: 'compare_diseases',
    PARSE_TOKENS: 'parse_medical_tokens',
    GET_DISEASE_STATS: 'get_disease_stats',
    LOAD_SEED_DATA: 'load_my_seed_data'
  },

  // Edge Function URLs
  EDGE_FUNCTIONS: {
    EXPORT_SHEETS: '/functions/v1/export-to-sheets',
    BATCH_OPERATIONS: '/functions/v1/batch-operations'
  },

  // Performance settings
  PERFORMANCE: {
    SEARCH_DEBOUNCE_MS: 300,
    QUICK_PEEK_TIMEOUT_MS: 250,
    CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
    MAX_SEARCH_RESULTS: 10
  },

  // Feature types
  FEATURE_TYPES: ['symptom', 'sign', 'lab', 'imaging', 'criterion', 'pathognomonic'],
  
  // Typicality options
  TYPICALITY_OPTIONS: ['common', 'occasional', 'rare'],
  
  // Weight options (1-3)
  WEIGHT_OPTIONS: [1, 2, 3]
}

// =====================================================
// BACKEND SERVICE CLASS
// =====================================================

class BackendService {
  constructor() {
    this.cache = new Map()
    this.subscribers = new Map()
  }

  // =====================================================
  // CORE API METHODS
  // =====================================================

  async searchFeatures(query, limit = BACKEND_CONFIG.PERFORMANCE.MAX_SEARCH_RESULTS) {
    const cacheKey = `search:${query}:${limit}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data, error } = await supabase.rpc(
        BACKEND_CONFIG.RPC_FUNCTIONS.SEARCH_FEATURES,
        { search_term: query, limit_count: limit }
      )

      if (error) throw error

      const result = { data, error: null }
      this.cache.set(cacheKey, result)
      
      // Clear cache after TTL
      setTimeout(() => {
        this.cache.delete(cacheKey)
      }, BACKEND_CONFIG.PERFORMANCE.CACHE_TTL_MS)

      return result
    } catch (error) {
      return { data: null, error }
    }
  }

  async canonicalizeFeature(inputText) {
    try {
      const { data, error } = await supabase.rpc(
        BACKEND_CONFIG.RPC_FUNCTIONS.CANONICALIZE_FEATURE,
        { input_text: inputText }
      )

      if (error) throw error
      return { data: data?.[0] || null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async compareDiseases(diseaseIds) {
    try {
      const { data, error } = await supabase.rpc(
        BACKEND_CONFIG.RPC_FUNCTIONS.COMPARE_DISEASES,
        { disease_ids: diseaseIds }
      )

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async parseTokens(tokenString) {
    try {
      const { data, error } = await supabase.rpc(
        BACKEND_CONFIG.RPC_FUNCTIONS.PARSE_TOKENS,
        { token_string: tokenString }
      )

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getDiseaseStats(diseaseId) {
    const cacheKey = `stats:${diseaseId}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      const { data, error } = await supabase.rpc(
        BACKEND_CONFIG.RPC_FUNCTIONS.GET_DISEASE_STATS,
        { disease_id: diseaseId }
      )

      if (error) throw error

      const result = { data: data?.[0] || null, error: null }
      this.cache.set(cacheKey, result)

      return result
    } catch (error) {
      return { data: null, error }
    }
  }

  // =====================================================
  // EDGE FUNCTION CALLS
  // =====================================================

  async exportToSheets(diseaseIds, sheetName = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${supabase.supabaseUrl}${BACKEND_CONFIG.EDGE_FUNCTIONS.EXPORT_SHEETS}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            disease_ids: diseaseIds,
            sheet_name: sheetName
          })
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Export failed')
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async batchOperation(operation, data) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(
        `${supabase.supabaseUrl}${BACKEND_CONFIG.EDGE_FUNCTIONS.BATCH_OPERATIONS}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operation, data })
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Batch operation failed')
      }

      return { data: result.result, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  clearCache() {
    this.cache.clear()
  }

  clearCacheByPrefix(prefix) {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  // Performance monitoring
  async timedOperation(operation, ...args) {
    const startTime = performance.now()
    
    try {
      const result = await operation(...args)
      const duration = performance.now() - startTime
      
      console.log(`Operation completed in ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`Operation failed after ${duration.toFixed(2)}ms:`, error)
      throw error
    }
  }

  // =====================================================
  // REAL-TIME SUBSCRIPTIONS
  // =====================================================

  subscribeToChanges(table, callback) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        (payload) => {
          // Clear relevant cache entries
          this.clearCacheByPrefix(table)
          callback(payload)
        }
      )
      .subscribe()

    this.subscribers.set(table, channel)
    return channel
  }

  unsubscribeFromChanges(table) {
    const channel = this.subscribers.get(table)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscribers.delete(table)
    }
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

 async healthCheck() {
  const checks = {
    database: false,
    rpcFunctions: false,
    edgeFunctions: true, // Always true for mock
    authentication: false
  }

  try {
    // Test database connection
    const { error: dbError } = await supabase.from('diseases').select('count')
    checks.database = !dbError

    // Test RPC functions
    const { error: rpcError } = await supabase.rpc(
      'search_features_advanced',
      { search_term: 'test', limit_count: 1 }
    )
    checks.rpcFunctions = !rpcError

    // Test authentication
    const { data: { user } } = await supabase.auth.getUser()
    checks.authentication = !!user

    // Skip edge function test for now (use mock)
    checks.edgeFunctions = import.meta.env.VITE_USE_MOCK_EXPORT === 'true'

  } catch (error) {
    console.error('Health check failed:', error)
  }

  return checks
}
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const backendService = new BackendService()

// =====================================================
// CONVENIENCE EXPORTS
// =====================================================

export const {
  searchFeatures,
  canonicalizeFeature,
  compareDiseases,
  parseTokens,
  getDiseaseStats,
  exportToSheets,
  batchOperation,
  clearCache,
  timedOperation,
  subscribeToChanges,
  unsubscribeFromChanges,
  healthCheck
} = backendService

// =====================================================
// INITIALIZATION
// =====================================================

// Auto-clear cache on auth state changes
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    backendService.clearCache()
  }
})