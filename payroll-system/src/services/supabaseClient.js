// Cliente de Supabase - Configuración principal
import { createClient } from '@supabase/supabase-js'

// Reemplaza estos valores con tus credenciales de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://scmokcpmukmyenlnvdub.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbW9rY3BtdWtteWVubG52ZHViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODE4MTgsImV4cCI6MjA5MDQ1NzgxOH0.t_OqN0EUbyw5KqjfY4wK51qpDbNzyVptt0Ik_xVDG5M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  }
})