// Componente para proteger rutas de administrador
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      // Verificar si hay usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('🔍 AdminRoute - Usuario actual:', user?.email, user?.id)
      
      if (!user) {
        console.log('❌ AdminRoute - No hay usuario autenticado')
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Verificar si es administrador
      const { data: adminData, error } = await supabase
        .from('administradores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('🔍 AdminRoute - Resultado de consulta administradores:', {
        adminData,
        error: error?.message,
        errorCode: error?.code
      })

      if (error || !adminData) {
        console.log('❌ AdminRoute - Usuario NO es administrador')
        setIsAdmin(false)
      } else {
        console.log('✅ AdminRoute - Usuario ES administrador:', adminData)
        setIsAdmin(true)
      }
    } catch (err) {
      console.error('❌ AdminRoute - Error al verificar admin:', err)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#6b7280'
      }}>
        Verificando permisos...
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
