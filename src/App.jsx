// src/App.jsx
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { 
  Database, 
  Plus, 
  BarChart3, 
  Upload, 
  User, 
  LogOut, 
  Menu, 
  X,
  Stethoscope,
  Activity
} from 'lucide-react'
import { supabase } from './database/supabase'
import { backendService } from './Backend/backendConfig'

// Components
import Auth from './components/Auth'
import DatabaseTest from './components/DatabaseTest'
import DiseaseManagement from './components/DiseaseManagement'
import DiseaseCompare from './components/DiseaseCompare'
import QuickPeek from './components/QuickPeek'

// In App.jsx, around line 25, add this:

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [backendHealth, setBackendHealth] = useState(null)

  useEffect(() => {
  if (user) {
    console.log('🔑 YOUR USER ID:', user.id)
    console.log('📧 YOUR EMAIL:', user.email)
  }
}, [user])
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Clear backend cache on auth changes
        if (event === 'SIGNED_OUT') {
          backendService.clearCache()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Check backend health on load
  useEffect(() => {
    if (user) {
      checkBackendHealth()
    }
  }, [user])

  const checkBackendHealth = async () => {
    try {
      const health = await backendService.healthCheck()
      setBackendHealth(health)
    } catch (error) {
      console.error('Backend health check failed:', error)
      setBackendHealth(null)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <Database className="w-5 h-5" />,
      description: 'Database status and seed data'
    },
    {
      id: 'manage',
      name: 'Manage Diseases',
      icon: <Plus className="w-5 h-5" />,
      description: 'Add and edit diseases and features'
    },
    {
      id: 'compare',
      name: 'Compare Diseases',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Side-by-side disease comparison'
    }
  ]

  // Backend health indicator
  const BackendHealthIndicator = () => {
    if (!backendHealth) return null

    const allHealthy = Object.values(backendHealth).every(Boolean)
    
    return (
      <div className={`px-3 py-1 rounded-full text-xs ${
        allHealthy 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        Backend: {allHealthy ? 'Healthy' : 'Partial'}
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Med Notes...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <>
        <Auth />
        <Toaster position="top-right" />
      </>
    )
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="flex flex-col w-64 bg-white shadow-lg h-screen">
          {/* Logo/Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Med Notes</h1>
                <p className="text-xs text-gray-600">Clinical Decision Support</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <BackendHealthIndicator />
            
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="flex-1 truncate">{user.email}</span>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900">Med Notes</span>
            </div>
            
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600">
                      Monitor your data and system status
                    </p>
                  </div>
                  <button
                    onClick={checkBackendHealth}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Refresh Status
                  </button>
                </div>
                
                
                
                {/* Backend Health Details */}
                {backendHealth && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Backend Health Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(backendHealth).map(([service, healthy]) => (
                        <div
                          key={service}
                          className={`p-3 rounded-lg border ${
                            healthy 
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-red-50 border-red-200 text-red-800'
                          }`}
                        >
                          <div className="font-medium capitalize">
                            {service.replace(/([A-Z])/g, ' $1')}
                          </div>
                          <div className="text-sm">
                            {healthy ? '✅ Working' : '❌ Failed'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Data Ready</h3>
                        <p className="text-sm text-gray-600">
                          Database configured and functional
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Compare Ready</h3>
                        <p className="text-sm text-gray-600">
                          Disease comparison functional
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Upload className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Export Ready</h3>
                        <p className="text-sm text-gray-600">
                          Google Sheets integration available
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentView === 'manage' && <DiseaseManagement />}
            {currentView === 'compare' && <DiseaseCompare />}
          </div>
        </main>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Global Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default App