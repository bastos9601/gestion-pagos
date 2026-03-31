// App principal - Configuración de rutas
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MantenimientoCheck } from './components/MantenimientoCheck'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { AdminLayout } from './components/AdminLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Empleados } from './pages/Empleados'
import { Pagos } from './pages/Pagos'
import { Historial } from './pages/Historial'
import { Asistencias } from './pages/Asistencias'
import { Configuracion } from './pages/Configuracion'
import { PagoYape } from './pages/PagoYape'
import { PagoPendiente } from './pages/PagoPendiente'
import { AdminPagos } from './pages/AdminPagos'
import { AdminUsuarios } from './pages/AdminUsuarios'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminConfiguracion } from './pages/AdminConfiguracion'
import { AdminLogin } from './pages/AdminLogin'
import { AdminRoute } from './components/AdminRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MantenimientoCheck>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pago-yape" element={<PagoYape />} />
          <Route path="/pago-pendiente" element={<PagoPendiente />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/pagos"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminPagos />
                </AdminLayout>
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminUsuarios />
                </AdminLayout>
              </AdminRoute>
            }
          />
          
          <Route
            path="/admin/configuracion"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminConfiguracion />
                </AdminLayout>
              </AdminRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/empleados"
            element={
              <ProtectedRoute>
                <Layout>
                  <Empleados />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/pagos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Pagos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <Layout>
                  <Historial />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/asistencias"
            element={
              <ProtectedRoute>
                <Layout>
                  <Asistencias />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <Layout>
                  <Configuracion />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </MantenimientoCheck>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
