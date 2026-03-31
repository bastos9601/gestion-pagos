// Layout para panel administrativo
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/AdminLayout.css'

export const AdminLayout = ({ children }) => {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const isActive = (path) => location.pathname === path

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="admin-layout">
      {/* Botón hamburguesa para móviles */}
      <button className="menu-toggle" onClick={toggleSidebar}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay para cerrar el sidebar en móviles */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="logo-icon">🛡️</span>
            <h2>Panel Admin</h2>
          </div>
          <p className="user-email">{user?.email}</p>
          <span className="admin-badge">Administrador</span>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/admin/dashboard" 
            className={isActive('/admin/dashboard') ? 'active' : ''} 
            onClick={closeSidebar}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/admin/usuarios" 
            className={isActive('/admin/usuarios') ? 'active' : ''} 
            onClick={closeSidebar}
          >
            👥 Gestión de Usuarios
          </Link>
          <Link 
            to="/admin/pagos" 
            className={isActive('/admin/pagos') ? 'active' : ''} 
            onClick={closeSidebar}
          >
            💳 Aprobar Pagos
          </Link>
          <Link 
            to="/admin/configuracion" 
            className={isActive('/admin/configuracion') ? 'active' : ''} 
            onClick={closeSidebar}
          >
            ⚙️ Configuración
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="admin-main-content">
        {children}
      </main>
    </div>
  )
}
