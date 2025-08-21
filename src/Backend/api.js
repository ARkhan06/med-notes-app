// src/lib/api.js
import { supabase } from '../database/supabase'

// =====================================================
// FEATURE SEARCH & AUTOCOMPLETE
// =====================================================

export const searchFeatures = async (searchTerm, limit = 10) => {
  try {
    const { data, error } = await supabase.rpc('search_features_advanced', {
      search_term: searchTerm,
      limit_count: limit
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error searching features:', error)
    return { data: null, error }
  }
}

// =====================================================
// FEATURE CANONICALIZATION
// =====================================================

export const canonicalizeFeature = async (inputText) => {
  try {
    const { data, error } = await supabase.rpc('canonicalize_feature', {
      input_text: inputText
    })

    if (error) throw error
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error canonicalizing feature:', error)
    return { data: null, error }
  }
}

// =====================================================
// TOKEN PARSING
// =====================================================

export const parseMedicalTokens = async (tokenString) => {
  try {
    const { data, error } = await supabase.rpc('parse_medical_tokens', {
      token_string: tokenString
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error parsing tokens:', error)
    return { data: null, error }
  }
}

// Client-side token parsing utility (faster for simple cases)
export const parseTokensClient = (inputString) => {
  const tokens = inputString.trim().split(/\s+/)
  const parsed = []

  for (const token of tokens) {
    if (!token) continue

    let isPresent = true
    let cleanToken = token
    let valueModifier = null
    let numericValue = null

    // Check for +/- prefix
    if (token.startsWith('+')) {
      cleanToken = token.slice(1)
    } else if (token.startsWith('-')) {
      isPresent = false
      cleanToken = token.slice(1)
    }

    // Check for directional indicators
    if (cleanToken.endsWith('↑')) {
      valueModifier = '↑'
      cleanToken = cleanToken.slice(0, -1)
    } else if (cleanToken.endsWith('↓')) {
      valueModifier = '↓'
      cleanToken = cleanToken.slice(0, -1)
    }

    // Check for comparison operators
    const comparisonMatch = cleanToken.match(/^(.+?)([<>]=?)(\d+)$/)
    if (comparisonMatch) {
      cleanToken = comparisonMatch[1]
      valueModifier = comparisonMatch[2]
      numericValue = comparisonMatch[3]
    }

    parsed.push({
      original: token,
      cleanToken,
      isPresent,
      valueModifier,
      numericValue
    })
  }

  return parsed
}

// =====================================================
// DISEASE COMPARISON
// =====================================================

export const compareDiseases = async (diseaseIds) => {
  try {
    const { data, error } = await supabase.rpc('compare_diseases', {
      disease_ids: diseaseIds
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error comparing diseases:', error)
    return { data: null, error }
  }
}

// Get diseases for comparison dropdown
export const getUserDiseases = async () => {
  try {
    const { data, error } = await supabase
      .from('diseases')
      .select('id, name, system, subsystem')
      .order('name')

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching diseases:', error)
    return { data: null, error }
  }
}

// =====================================================
// DISEASE STATISTICS (for Quick Peek)
// =====================================================

export const getDiseaseStats = async (diseaseId) => {
  try {
    const { data, error } = await supabase.rpc('get_disease_stats', {
      disease_id: diseaseId
    })

    if (error) throw error
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error getting disease stats:', error)
    return { data: null, error }
  }
}

// =====================================================
// GOOGLE SHEETS EXPORT (CORRECTED)
// =====================================================

// Add this to your src/lib/api.js - Replace the exportToSheets function

export const exportToSheets = async (diseaseIds, sheetName = null) => {
  try {
    console.log('🚀 Starting Google Sheets export...')
    
    // TEMPORARY: Force mock export for debugging
    const forceMock = true // Change this to false when you want real export
    const useMockFromEnv = import.meta.env.VITE_USE_MOCK_EXPORT === 'true'
    
    console.log('Force mock:', forceMock)
    console.log('Env mock setting:', useMockFromEnv)
    console.log('VITE_USE_MOCK_EXPORT value:', import.meta.env.VITE_USE_MOCK_EXPORT)
    
    // Check if we should use mock export
    if (forceMock || useMockFromEnv) {
      console.log('📝 Using mock export')
      return await mockExportToSheets(diseaseIds, sheetName)
    }
    
    console.log('🔄 Using REAL export')
    
    // ... rest of your real export code
    const { data: comparisonData } = await compareDiseases(diseaseIds)
    const { data: diseases } = await getUserDiseases()
    const selectedDiseases = diseases.filter(d => diseaseIds.includes(d.id))
    
    if (!comparisonData || comparisonData.length === 0) {
      throw new Error('No comparison data to export')
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const diseaseNames = selectedDiseases.map(d => d.name.replace(/\s+/g, '_')).join('_')
    const finalSheetName = sheetName || `Compare_${diseaseNames}_${timestamp}`
    
    const result = await createRealGoogleSheet(comparisonData, selectedDiseases, finalSheetName)
    
    return {
      data: {
        success: true,
        sheet_url: result.spreadsheetUrl,
        sheet_id: result.spreadsheetId,
        sheet_name: finalSheetName,
        exported_features: comparisonData.length,
        exported_diseases: selectedDiseases.length
      },
      error: null
    }
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error)
    return { data: null, error }
  }
}

// Mock export function
async function mockExportToSheets(diseaseIds, sheetName) {
  console.log('📝 Starting mock export...')
  
  // Get comparison data for realistic simulation
  const { data: comparisonData } = await compareDiseases(diseaseIds)
  const { data: diseases } = await getUserDiseases()
  const selectedDiseases = diseases.filter(d => diseaseIds.includes(d.id))
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Generate realistic mock data
  const timestamp = new Date().toISOString().split('T')[0]
  const diseaseNames = selectedDiseases.map(d => d.name.replace(/\s+/g, '_')).join('_')
  const finalSheetName = sheetName || `Compare_${diseaseNames}_${timestamp}`
  const mockSheetId = 'mock_' + Date.now()
  const mockUrl = `https://docs.google.com/spreadsheets/d/${mockSheetId}/edit#gid=0`
  
  console.log('✅ Mock export completed!')
  console.log('📊 Sheet Name:', finalSheetName)
  console.log('🔗 Mock URL:', mockUrl)
  console.log('📈 Features:', comparisonData?.length || 0)
  console.log('🏥 Diseases:', selectedDiseases.length)
  
  return {
    data: {
      success: true,
      sheet_url: mockUrl,
      sheet_id: mockSheetId,
      sheet_name: finalSheetName,
      exported_features: comparisonData?.length || 0,
      exported_diseases: selectedDiseases.length,
      is_mock: true
    },
    error: null
  }
}
// Get Google OAuth access token
async function getGoogleAccessToken(credentials) {
  try {
    const jwt = await createGoogleJWT(credentials)
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to get access token: ${errorData.error_description || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error getting Google access token:', error)
    throw error
  }
}

// Create Google JWT for authentication
async function createGoogleJWT(credentials) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/[+\/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m]))
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+\/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m]))
  
  const message = `${encodedHeader}.${encodedPayload}`
  
  // Import the private key and sign
  const privateKey = await importPrivateKey(credentials.private_key)
  const signature = await sign(message, privateKey)
  
  return `${message}.${signature}`
}

// Import private key for signing
async function importPrivateKey(pemKey) {
  const pemContents = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
}

// Sign the JWT
async function sign(message, privateKey) {
  const encoder = new TextEncoder()
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(message)
  )
  
  const signatureArray = new Uint8Array(signature)
  return btoa(String.fromCharCode(...signatureArray)).replace(/[+\/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m]))
}

// Format comparison data for Google Sheets
function formatDataForSheets(comparisonData, diseases) {
  // Create headers
  const headers = ['Feature', 'Type', 'Category', ...diseases.map(d => d.name)]
  const rows = [headers]
  
  // Add data rows
  comparisonData.forEach(feature => {
    const row = [
      feature.feature_name,
      feature.feature_type,
      feature.is_shared ? 'Shared' : feature.has_conflicts ? 'Conflict' : 'Difference'
    ]

    // Create disease data map
    const diseaseMap = new Map()
    feature.disease_data.forEach(dd => {
      diseaseMap.set(dd.disease_id, dd)
    })

    // Add disease-specific data
    diseases.forEach(disease => {
      const diseaseData = diseaseMap.get(disease.id)
      if (diseaseData) {
        let cellValue = diseaseData.is_present ? '+' : '-'
        if (diseaseData.value_text) {
          cellValue += diseaseData.value_text
        }
        cellValue += ` (${diseaseData.typicality}, wt:${diseaseData.weight})`
        if (diseaseData.is_pathognomonic) {
          cellValue += ' [PATHOGNOMONIC]'
        }
        row.push(cellValue)
      } else {
        row.push('-')
      }
    })

    rows.push(row)
  })

  return rows
}

// Format the Google Sheet (make it look professional)
async function formatGoogleSheet(spreadsheetId, accessToken, diseaseCount) {
  const requests = [
    // Make header row bold
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            },
            backgroundColor: {
              red: 0.9,
              green: 0.9,
              blue: 0.9
            }
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)'
      }
    },
    // Add borders
    {
      updateBorders: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 100, // Enough rows
          startColumnIndex: 0,
          endColumnIndex: 3 + diseaseCount
        },
        top: { style: 'SOLID' },
        bottom: { style: 'SOLID' },
        left: { style: 'SOLID' },
        right: { style: 'SOLID' },
        innerHorizontal: { style: 'SOLID' },
        innerVertical: { style: 'SOLID' }
      }
    },
    // Auto-resize columns
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 3 + diseaseCount
        }
      }
    }
  ]

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests })
  })
}

// =====================================================
// DISEASE & FEATURE MANAGEMENT
// =====================================================

export const createDisease = async (diseaseData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('diseases')
      .insert({
        ...diseaseData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating disease:', error)
    return { data: null, error }
  }
}

export const createFeature = async (featureData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('features')
      .insert({
        ...featureData,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating feature:', error)
    return { data: null, error }
  }
}

export const addFeatureToDisease = async (diseaseId, featureId, featureDetails) => {
  try {
    const { data, error } = await supabase
      .from('disease_feature')
      .upsert({
        disease_id: diseaseId,
        feature_id: featureId,
        ...featureDetails
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding feature to disease:', error)
    return { data: null, error }
  }
}

// Batch add multiple features to a disease
export const batchAddFeaturesToDisease = async (diseaseId, features) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/batch-operations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'bulk_update_disease_features',
        data: {
          updates: features.map(f => ({
            disease_id: diseaseId,
            feature_id: f.feature_id,
            value_text: f.value_text,
            typicality: f.typicality || 'common',
            weight: f.weight || 1,
            is_present: f.is_present ?? true,
            is_pathognomonic: f.is_pathognomonic || false
          }))
        }
      })
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Batch operation failed')
    }

    return { data: result.result, error: null }
  } catch (error) {
    console.error('Error batch adding features:', error)
    return { data: null, error }
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export const subscribeToDiseaseChanges = (callback) => {
  return supabase
    .channel('diseases')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'diseases' }, 
      callback
    )
    .subscribe()
}

export const subscribeToFeatureChanges = (callback) => {
  return supabase
    .channel('features')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'features' }, 
      callback
    )
    .subscribe()
}

// =====================================================
// PERFORMANCE UTILITIES
// =====================================================

// Debounced search for autocomplete
export const createDebouncedSearch = (searchFunction, delay = 300) => {
  let timeoutId
  
  return (...args) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(async () => {
        try {
          const result = await searchFunction(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

// Cache for Quick Peek data
const quickPeekCache = new Map()

export const getCachedDiseaseStats = async (diseaseId) => {
  if (quickPeekCache.has(diseaseId)) {
    return quickPeekCache.get(diseaseId)
  }

  const result = await getDiseaseStats(diseaseId)
  if (result.data) {
    quickPeekCache.set(diseaseId, result)
  }

  return result
}


// Clear cache when data changes
export const clearQuickPeekCache = () => {
  quickPeekCache.clear()
}