// Layout principal con sidebar de navegación
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmpresaConfig } from '../hooks/useEmpresaConfig'
import '../styles/Layout.css'

export const Layout = ({ children }) => {
  const { signOut, user } = useAuth()
  const { config } = useEmpresaConfig()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="layout">
      {/* Botón hamburguesa para móviles */}
      <button className="menu-toggle" onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay para cerrar el sidebar en móviles */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>💼 {config.nombre || 'Gestión pago'}</h2>
          <p className="user-email">{user?.email}</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={closeSidebar}>
            📊 Dashboard
          </Link>
          <Link to="/empleados" className={isActive('/empleados') ? 'active' : ''} onClick={closeSidebar}>
            👥 Empleados
          </Link>
          <Link to="/pagos" className={isActive('/pagos') ? 'active' : ''} onClick={closeSidebar}>
            💰 Pagos
          </Link>
          <Link to="/historial" className={isActive('/historial') ? 'active' : ''} onClick={closeSidebar}>
            📋 Historial
          </Link>
          <Link to="/configuracion" className={isActive('/configuracion') ? 'active' : ''} onClick={closeSidebar}>
            ⚙️ Configuración
          </Link>
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          🚪 Cerrar Sesión
        </button>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
