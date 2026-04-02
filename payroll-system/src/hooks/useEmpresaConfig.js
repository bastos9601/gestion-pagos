// Hook para obtener la configuración de la empresa
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useEmpresaConfig = (publicMode = false) => {
  const { user } = useAuth()
  const [config, setConfig] = useState({
    nombre: 'MI EMPRESA S.A.C.',
    ruc: '20XXXXXXXXX',
    direccion: 'Av. Principal 123, Lima - Perú',
    telefono: '',
    email: '',
    firma_url: '',
    horas_por_dia: 8,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (publicMode) {
      // Modo público: cargar cualquier configuración (para login)
      fetchPublicConfig()
    } else if (user) {
      // Modo privado: cargar configuración del usuario autenticado
      fetchConfig()
    }
  }, [user, publicMode])

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_empresa')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setConfig({
          nombre: data.nombre_empresa,
          ruc: data.ruc,
          direccion: data.direccion,
          telefono: data.telefono || '',
          email: data.email || '',
          firma_url: data.firma_url || '',
          horas_por_dia: data.horas_por_dia || 8,
        })
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_empresa')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setConfig({
          nombre: data.nombre_empresa,
          ruc: data.ruc,
          direccion: data.direccion,
          telefono: data.telefono || '',
          email: data.email || '',
          firma_url: data.firma_url || '',
          horas_por_dia: data.horas_por_dia || 8,
        })
      }
    } catch (error) {
      console.error('Error al cargar configuración pública:', error)
    } finally {
      setLoading(false)
    }
  }

  return { config, loading, refetch: publicMode ? fetchPublicConfig : fetchConfig }
}
