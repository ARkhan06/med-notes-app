// src/components/DiseaseManagement.jsx
import { useState } from 'react'
import { Plus, Edit3, Search, X, Save } from 'lucide-react'
import { useDiseases } from '../Backend/useApi'
import { createDisease } from '../Backend/api'
import toast from 'react-hot-toast'

export default function DiseaseManagement() {
  const [selectedDisease, setSelectedDisease] = useState(null)
  const [showAddDisease, setShowAddDisease] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { diseases, loading: diseasesLoading, refetch: refetchDiseases } = useDiseases()

  // Filter diseases based on search
  const filteredDiseases = diseases.filter(disease =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.system?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.subsystem?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Disease Management</h2>
        <button
          onClick={() => setShowAddDisease(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Disease
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search diseases..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diseases List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Diseases ({filteredDiseases.length})
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {diseasesLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredDiseases.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'No diseases match your search' : 'No diseases yet'}
                  {!searchTerm && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowAddDisease(true)}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        Add your first disease
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDiseases.map(disease => (
                    <div
                      key={disease.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedDisease?.id === disease.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedDisease(disease)}
                    >
                      <div className="space-y-1">
                        <h4 className="font-medium text-gray-900">{disease.name}</h4>
                        <div className="flex items-center gap-2">
                          {disease.system && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {disease.system}
                            </span>
                          )}
                          {disease.subsystem && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {disease.subsystem}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disease Details */}
        <div className="lg:col-span-2">
          {selectedDisease ? (
            <div className="space-y-6">
              {/* Disease Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedDisease.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedDisease.system} • {selectedDisease.subsystem}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">0</div>
                    <div className="text-sm text-blue-700">Total Features</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">0</div>
                    <div className="text-sm text-green-700">Pathognomonic</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">0</div>
                    <div className="text-sm text-purple-700">High Weight</div>
                  </div>
                </div>
              </div>

              {/* Features Management */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Features for {selectedDisease.name}
                </h4>
                <div className="text-center py-8 text-gray-500">
                  <p>Feature management coming soon...</p>
                  <p className="text-sm mt-2">
                    Go to "Compare Diseases" to see existing features
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Edit3 className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a disease to manage
              </h3>
              <p className="text-gray-600">
                Choose a disease from the list to view and edit its features
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Disease Modal */}
      {showAddDisease && (
        <AddDiseaseModal
          onClose={() => setShowAddDisease(false)}
          onSuccess={() => {
            setShowAddDisease(false)
            refetchDiseases()
            toast.success('Disease created successfully!')
          }}
        />
      )}
    </div>
  )
}

// Add Disease Modal Component
function AddDiseaseModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    system: '',
    subsystem: ''
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Disease name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSaving(true)
    
    try {
      const { data, error } = await createDisease({
        name: formData.name.trim(),
        system: formData.system.trim() || null,
        subsystem: formData.subsystem.trim() || null
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      onSuccess()
    } catch (error) {
      toast.error('Error creating disease: ' + error.message)
      console.error('Create disease error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Disease
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disease Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Iron Deficiency Anemia"
                disabled={saving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System
              </label>
              <input
                type="text"
                value={formData.system}
                onChange={(e) => handleInputChange('system', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Hematology"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subsystem
              </label>
              <input
                type="text"
                value={formData.subsystem}
                onChange={(e) => handleInputChange('subsystem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Anemia"
                disabled={saving}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formData.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Disease
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}