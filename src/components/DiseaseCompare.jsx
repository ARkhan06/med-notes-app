// src/components/DiseaseCompare.jsx
import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, Filter, Download, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react'
import { useDiseases, useDiseaseComparison, useExport } from '../Backend/useApi'
import QuickPeek from './QuickPeek'
import toast from 'react-hot-toast'

export default function DiseaseCompare() {
  const [selectedDiseases, setSelectedDiseases] = useState([])
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false)
  const [showHighYieldOnly, setShowHighYieldOnly] = useState(false)
  const [quickPeekTarget, setQuickPeekTarget] = useState(null)
  const [quickPeekPosition, setQuickPeekPosition] = useState({ x: 0, y: 0 })

  const { diseases, loading: diseasesLoading } = useDiseases()
  const { comparisonData, loading: comparing, compareSelectedDiseases } = useDiseaseComparison()
  const { exportData, exporting } = useExport()

  // Trigger comparison when diseases are selected
  useEffect(() => {
    if (selectedDiseases.length >= 2) {
      compareSelectedDiseases(selectedDiseases)
    }
  }, [selectedDiseases, compareSelectedDiseases])

  // Filter comparison data based on toggles
  const filteredData = useMemo(() => {
    if (!comparisonData) return []

    let filtered = [...comparisonData]

    if (showDifferencesOnly) {
      filtered = filtered.filter(item => !item.is_shared)
    }

    if (showHighYieldOnly) {
      filtered = filtered.filter(item => item.max_weight >= 2)
    }

    return filtered
  }, [comparisonData, showDifferencesOnly, showHighYieldOnly])

  // Group data into sections
  const groupedData = useMemo(() => {
    const shared = filteredData.filter(item => item.is_shared)
    const conflicts = filteredData.filter(item => item.has_conflicts && !item.is_shared)
    const differences = filteredData.filter(item => !item.is_shared && !item.has_conflicts)

    return { shared, conflicts, differences }
  }, [filteredData])

  // Handle disease selection
  const handleDiseaseSelect = (diseaseId) => {
    if (selectedDiseases.includes(diseaseId)) {
      setSelectedDiseases(prev => prev.filter(id => id !== diseaseId))
    } else if (selectedDiseases.length < 3) {
      setSelectedDiseases(prev => [...prev, diseaseId])
    } else {
      toast.error('Maximum 3 diseases can be compared')
    }
  }

  // Handle export
// Updated handleExport function for DiseaseCompare.jsx
const handleExport = async () => {
  try {
    console.log('Starting export with diseases:', selectedDiseases)
    const result = await exportData(selectedDiseases)
    console.log('Export result:', result)
    
    // Handle mock export vs real export
    if (result.is_mock) {
      toast.success(
        `Mock export completed!\n📊 ${result.exported_features} features\n🏥 ${result.exported_diseases} diseases`, 
        {
          duration: 5000,
          icon: '📝',
          style: {
            background: '#f0f9ff',
            border: '1px solid #0ea5e9',
            color: '#0c4a6e'
          }
        }
      )
      
      // Show mock URL in console for development
      console.log('🔗 Mock Sheet URL:', result.sheet_url)
      console.log('📋 You can copy this URL for testing:', result.sheet_url)
      
      // Optionally show an alert with the mock URL
      if (confirm('Mock export completed! Would you like to see the mock URL in a new tab?')) {
        window.open(result.sheet_url, '_blank')
      }
      
    } else {
      // Real export
      toast.success(
        `Exported to Google Sheets!\n📊 ${result.exported_features} features\n🏥 ${result.exported_diseases} diseases`, 
        {
          duration: 4000,
          icon: '✅'
        }
      )
      window.open(result.sheet_url, '_blank')
    }
  } catch (error) {
    console.error('Export error:', error)
    toast.error(`Export failed: ${error.message}`, {
      duration: 6000,
      icon: '❌'
    })
  }
}

  // Handle quick peek
  const handleMouseEnter = (event, diseaseId) => {
    const rect = event.target.getBoundingClientRect()
    setQuickPeekPosition({ 
      x: rect.left + rect.width / 2, 
      y: rect.top - 10 
    })
    setQuickPeekTarget(diseaseId)
  }

  const handleMouseLeave = () => {
    setQuickPeekTarget(null)
  }

  // Render feature value cell
  const FeatureCell = ({ diseaseData, featureName }) => {
    if (!diseaseData) {
      return <td className="px-3 py-2 text-center text-gray-400">-</td>
    }

    const getPresenceIcon = () => {
      if (!diseaseData.is_present) return <EyeOff className="w-4 h-4 text-red-500" />
      return <Check className="w-4 h-4 text-green-500" />
    }

    const getWeightColor = () => {
      switch (diseaseData.weight) {
        case 3: return 'bg-red-100 text-red-800'
        case 2: return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    const getTypicalityColor = () => {
      switch (diseaseData.typicality) {
        case 'common': return 'border-l-4 border-green-400'
        case 'occasional': return 'border-l-4 border-yellow-400'
        case 'rare': return 'border-l-4 border-red-400'
        default: return ''
      }
    }

    return (
      <td className={`px-3 py-2 ${getTypicalityColor()}`}>
        <div className="flex items-center gap-2">
          {getPresenceIcon()}
          <div className="flex-1">
            {diseaseData.value_text && (
              <span className="font-medium text-gray-900">
                {diseaseData.value_text}
              </span>
            )}
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${getWeightColor()}`}>
                {diseaseData.weight}
              </span>
              <span className="text-xs text-gray-500">
                {diseaseData.typicality}
              </span>
              {diseaseData.is_pathognomonic && (
                <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                  Path
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
    )
  }

  // Render comparison section
  const ComparisonSection = ({ title, data, icon, bgColor }) => (
    <div className="mb-8">
      <div className={`${bgColor} px-4 py-2 rounded-t-lg border-b`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-gray-600">({data.length})</span>
        </div>
      </div>
      
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border border-t-0 rounded-b-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Feature</th>
                <th className="px-3 py-3 text-center font-medium text-gray-700">Type</th>
                {selectedDiseases.map(diseaseId => {
                  const disease = diseases.find(d => d.id === diseaseId)
                  return (
                    <th 
                      key={diseaseId}
                      className="px-3 py-3 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                      onMouseEnter={(e) => handleMouseEnter(e, diseaseId)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {disease?.name}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((feature, index) => {
                const diseaseMap = new Map()
                feature.disease_data.forEach(dd => {
                  diseaseMap.set(dd.disease_id, dd)
                })

                return (
                  <tr key={feature.feature_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feature.feature_name}</span>
                        {feature.has_conflicts && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" title="Conflicting values" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {feature.feature_type}
                      </span>
                    </td>
                    {selectedDiseases.map(diseaseId => (
                      <FeatureCell
                        key={diseaseId}
                        diseaseData={diseaseMap.get(diseaseId)}
                        featureName={feature.feature_name}
                      />
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 border border-t-0 rounded-b-lg">
          No features in this category
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Disease Comparison</h2>
        {selectedDiseases.length >= 2 && comparisonData && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export to Sheets'}
          </button>
        )}
      </div>

      {/* Disease Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Select Diseases to Compare (up to 3)</h3>
        
        {diseasesLoading ? (
          <div className="animate-pulse space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {diseases.map(disease => (
              <button
                key={disease.id}
                onClick={() => handleDiseaseSelect(disease.id)}
                className={`p-3 border-2 rounded-lg text-left transition-all ${
                  selectedDiseases.includes(disease.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{disease.name}</div>
                <div className="text-sm text-gray-600">
                  {disease.system} • {disease.subsystem}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Controls */}
      {selectedDiseases.length >= 2 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDifferencesOnly}
                onChange={(e) => setShowDifferencesOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Differences only</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHighYieldOnly}
                onChange={(e) => setShowHighYieldOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">High-yield only (weight ≥2)</span>
            </label>

            <div className="ml-auto text-sm text-gray-600">
              {filteredData.length} features shown
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {comparing && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Comparing diseases...</span>
          </div>
        </div>
      )}

      {comparisonData && !comparing && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="sticky top-0 bg-white border-b px-6 py-4">
            <h3 className="text-lg font-semibold">Comparison Results</h3>
          </div>
          
          <div className="p-6">
            {/* Shared Features */}
            <ComparisonSection
              title="Shared Features"
              data={groupedData.shared}
              icon={<Check className="w-5 h-5 text-green-600" />}
              bgColor="bg-green-50"
            />

            {/* Conflicts */}
            <ComparisonSection
              title="Conflicting Features"
              data={groupedData.conflicts}
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              bgColor="bg-amber-50"
            />

            {/* Differences */}
            <ComparisonSection
              title="Unique Features"
              data={groupedData.differences}
              icon={<Eye className="w-5 h-5 text-blue-600" />}
              bgColor="bg-blue-50"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedDiseases.length < 2 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <ChevronDown className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select at least 2 diseases to compare
          </h3>
          <p className="text-gray-600">
            Choose diseases from the list above to see their similarities and differences
          </p>
        </div>
      )}

      {/* Quick Peek */}
      {quickPeekTarget && (
        <QuickPeek
          diseaseId={quickPeekTarget}
          position={quickPeekPosition}
          onClose={() => setQuickPeekTarget(null)}
        />
      )}
    </div>
  )
}