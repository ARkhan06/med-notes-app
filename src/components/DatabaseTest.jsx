import { useState, useEffect } from 'react'
import { supabase } from '../database/supabase'

export default function DatabaseTest() {
  const [user, setUser] = useState(null)
  const [diseases, setDiseases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchDiseases()
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchDiseases()
      } else {
        setDiseases([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchDiseases = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('diseases')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching diseases:', error)
    } else {
      setDiseases(data || [])
    }
    setLoading(false)
  }

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('diseases').select('count')
      if (error) throw error
      alert('✅ Database connection successful!')
    } catch (error) {
      alert('❌ Database connection failed: ' + error.message)
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Database Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Database Connection
        </button>

        <div>
          <h3 className="text-lg font-semibold">User Status:</h3>
          <p className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? `✅ Logged in as: ${user.email}` : '❌ Not logged in'}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Diseases Count:</h3>
          <p className="text-gray-700">{diseases.length} diseases found</p>
        </div>
        
<button
  onClick={() => supabase.auth.signUp({ email: 'test@example.com', password: 'password123' })}
  className="px-4 py-2 bg-green-500 text-white rounded"
>
  Quick Signup
</button>
      </div>
      
    </div>
  )
}