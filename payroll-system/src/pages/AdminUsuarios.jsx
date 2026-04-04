// Panel de administración para gestionar usuarios
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/AdminUsuarios.css'

export const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_empresa: '',
    duracion_dias: 30
  })
  const [editFormData, setEditFormData] = useState({
    password: '',
    monto: ''
  })
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      // Obtener usuarios desde la vista que incluye emails
      const { data: usuarios, error } = await supabase
        .from('vista_usuarios_admin')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsuarios(usuarios || [])
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
      alert('Error al cargar usuarios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreando(true)

    try {
      // Llamar a la función de Supabase para crear usuario
      const { data, error } = await supabase.rpc('crear_usuario_admin', {
        p_email: formData.email,
        p_password: formData.password,
        p_nombre_empresa: formData.nombre_empresa || 'MI EMPRESA S.A.C.',
        p_duracion_dias: parseInt(formData.duracion_dias)
      })

      if (error) {
        console.error('Error al llamar función:', error)
        throw error
      }

      // Verificar respuesta de la función
      if (!data.success) {
        throw new Error(data.error || 'Error al crear usuario')
      }

      alert('✅ Usuario creado exitosamente con suscripción activa')
      setShowModal(false)
      setFormData({
        email: '',
        password: '',
        nombre_empresa: '',
        duracion_dias: 30
      })
      loadUsuarios()
    } catch (err) {
      console.error('Error al crear usuario:', err)
      alert('❌ Error al crear usuario: ' + err.message)
    } finally {
      setCreando(false)
    }
  }

  const handleExtenderSuscripcion = async (userId, dias) => {
    const diasExtension = prompt(`¿Cuántos días quieres extender la suscripción?`, dias || '30')
    if (!diasExtension) return

    try {
      const { data: subActual, error: getError } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (getError) throw getError

      const fechaBase = subActual.fecha_vencimiento > new Date().toISOString().split('T')[0]
        ? new Date(subActual.fecha_vencimiento + 'T00:00:00')
        : new Date()

      const nuevaFecha = new Date(fechaBase)
      nuevaFecha.setDate(nuevaFecha.getDate() + parseInt(diasExtension))

      const { error: updateError } = await supabase
        .from('suscripciones')
        .update({
          fecha_vencimiento: nuevaFecha.toISOString().split('T')[0],
          estado: 'activa'
        })
        .eq('id', subActual.id)

      if (updateError) throw updateError

      alert(`✅ Suscripción extendida por ${diasExtension} días`)
      loadUsuarios()
    } catch (err) {
      console.error('Error al extender suscripción:', err)
      alert('❌ Error: ' + err.message)
    }
  }

  const handleCancelarSuscripcion = async (userId) => {
    if (!confirm('¿Estás seguro de cancelar esta suscripción? El usuario no podrá acceder al sistema.')) return

    try {
      const { error } = await supabase
        .from('suscripciones')
        .update({ estado: 'cancelada' })
        .eq('user_id', userId)

      if (error) throw error

      alert('✅ Suscripción cancelada. El usuario no podrá iniciar sesión.')
      loadUsuarios()
    } catch (err) {
      console.error('Error al cancelar:', err)
      alert('❌ Error: ' + err.message)
    }
  }

  const handleActivarSuscripcion = async (userId) => {
    const diasExtension = prompt('¿Por cuántos días quieres activar la suscripción?', '30')
    if (!diasExtension) return

    try {
      const { data: subActual, error: getError } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (getError) throw getError

      const hoy = new Date()
      const nuevaFechaVencimiento = new Date(hoy)
      nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + parseInt(diasExtension))

      const { error: updateError } = await supabase
        .from('suscripciones')
        .update({
          estado: 'activa',
          fecha_inicio: hoy.toISOString().split('T')[0],
          fecha_vencimiento: nuevaFechaVencimiento.toISOString().split('T')[0]
        })
        .eq('id', subActual.id)

      if (updateError) throw updateError

      alert(`✅ Suscripción activada por ${diasExtension} días. El usuario ya puede acceder.`)
      loadUsuarios()
    } catch (err) {
      console.error('Error al activar suscripción:', err)
      alert('❌ Error: ' + err.message)
    }
  }

  const handleEditarUsuario = (usuario) => {
    setEditingUsuario(usuario)
    setEditFormData({
      password: '',
      monto: usuario.monto || ''
    })
    setShowEditModal(true)
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    setEditando(true)

    try {
      // Validar que al menos uno de los campos tenga valor
      const tienePassword = editFormData.password && editFormData.password.trim() !== ''
      const tieneMonto = editFormData.monto && editFormData.monto !== ''

      if (!tienePassword && !tieneMonto) {
        alert('⚠️ Debes ingresar al menos un campo para actualizar')
        setEditando(false)
        return
      }

      // Llamar a la función de Supabase para actualizar
      const { data, error } = await supabase.rpc('actualizar_usuario_admin', {
        p_user_id: editingUsuario.user_id,
        p_nueva_password: tienePassword ? editFormData.password : null,
        p_nuevo_monto: tieneMonto ? parseFloat(editFormData.monto) : null
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar usuario')
      }

      alert('✅ Usuario actualizado exitosamente')
      setShowEditModal(false)
      setEditingUsuario(null)
      setEditFormData({ password: '', monto: '' })
      loadUsuarios()
    } catch (err) {
      console.error('Error al editar usuario:', err)
      alert('❌ Error al editar usuario: ' + err.message)
    } finally {
      setEditando(false)
    }
  }

  const handleEliminarUsuario = async (usuario) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.email}? Esta acción no se puede deshacer.`)) return

    try {
      // Llamar a la función de Supabase para eliminar
      const { data, error } = await supabase.rpc('eliminar_usuario_admin', {
        p_user_id: usuario.user_id
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Error al eliminar usuario')
      }

      alert('✅ Usuario eliminado exitosamente')
      loadUsuarios()
    } catch (err) {
      console.error('Error al eliminar usuario:', err)
      alert('❌ Error al eliminar usuario: ' + err.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento + 'T00:00:00')
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="admin-usuarios-page">
      <div className="page-header">
        <div>
          <h1>👥 Gestión de Usuarios</h1>
          <p>Crea y administra usuarios del sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-nuevo-usuario">
          ➕ Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay usuarios registrados</p>
          <button onClick={() => setShowModal(true)} className="btn-crear-primero">
            Crear primer usuario
          </button>
        </div>
      ) : (
        <div className="usuarios-grid">
          {usuarios.map((usuario) => {
            const diasRestantes = getDiasRestantes(usuario.fecha_vencimiento)
            const estaActiva = usuario.estado === 'activa' && diasRestantes > 0

            return (
              <div key={usuario.id} className={`usuario-card ${usuario.estado}`}>
                <div className="usuario-header">
                  <div className="usuario-info">
                    <h3>{usuario.email}</h3>
                    {usuario.nombre_empresa && (
                      <p className="empresa-nombre">🏢 {usuario.nombre_empresa}</p>
                    )}
                    <span className={`estado-badge ${usuario.estado}`}>
                      {usuario.estado === 'activa' && estaActiva && '✅ Activa'}
                      {usuario.estado === 'activa' && !estaActiva && '⏰ Vencida'}
                      {usuario.estado === 'pendiente' && '⏳ Pendiente'}
                      {usuario.estado === 'cancelada' && '❌ Cancelada'}
                    </span>
                  </div>
                </div>

                <div className="usuario-body">
                  <div className="info-row">
                    <span className="label">Inicio:</span>
                    <span className="value">{formatDate(usuario.fecha_inicio)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Vencimiento:</span>
                    <span className="value">{formatDate(usuario.fecha_vencimiento)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Días restantes:</span>
                    <span className={`value ${diasRestantes <= 5 ? 'alerta' : ''}`}>
                      {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencida'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Monto:</span>
                    <span className="value">S/ {parseFloat(usuario.monto).toFixed(2)}</span>
                  </div>
                </div>

                <div className="usuario-actions">
                  {usuario.estado === 'cancelada' ? (
                    <button
                      onClick={() => handleActivarSuscripcion(usuario.user_id)}
                      className="btn-activar"
                    >
                      ✅ Activar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleExtenderSuscripcion(usuario.user_id, 30)}
                        className="btn-extender"
                      >
                        ⏰ Extender
                      </button>
                      <button
                        onClick={() => handleCancelarSuscripcion(usuario.user_id)}
                        className="btn-cancelar"
                      >
                        ❌ Cancelar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEditarUsuario(usuario)}
                    className="btn-editar"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminarUsuario(usuario)}
                    className="btn-eliminar"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para crear usuario */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Crear Nuevo Usuario</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label>Contraseña *</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
                <small>El usuario podrá cambiarla después</small>
              </div>

              <div className="form-group">
                <label>Nombre de Empresa</label>
                <input
                  type="text"
                  value={formData.nombre_empresa}
                  onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
                  placeholder="MI EMPRESA S.A.C."
                />
                <small>Opcional - El usuario puede cambiarlo después</small>
              </div>

              <div className="form-group">
                <label>Duración de Suscripción (días) *</label>
                <input
                  type="number"
                  value={formData.duracion_dias}
                  onChange={(e) => setFormData({ ...formData, duracion_dias: e.target.value })}
                  required
                  min="1"
                  placeholder="30"
                />
                <small>Por defecto: 30 días (1 mes)</small>
              </div>

              <div className="info-box">
                <span className="icono-info">ℹ️</span>
                <p>
                  El usuario será creado con suscripción activa inmediatamente.
                  Podrá iniciar sesión con el email y contraseña proporcionados.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancelar-modal"
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-crear-modal"
                  disabled={creando}
                >
                  {creando ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {showEditModal && editingUsuario && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Usuario</h2>
              <button onClick={() => setShowEditModal(false)} className="btn-close">✕</button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="info-box" style={{ marginBottom: '1.5rem' }}>
                <span className="icono-info">👤</span>
                <p><strong>Usuario:</strong> {editingUsuario.email}</p>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="text"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  minLength={6}
                  placeholder="Dejar vacío para no cambiar"
                />
                <small>Mínimo 6 caracteres. Dejar vacío si no deseas cambiarla.</small>
              </div>

              <div className="form-group">
                <label>Monto de Suscripción (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.monto}
                  onChange={(e) => setEditFormData({ ...editFormData, monto: e.target.value })}
                  placeholder="50.00"
                />
                <small>Monto actual: S/ {parseFloat(editingUsuario.monto).toFixed(2)}</small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-cancelar-modal"
                  disabled={editando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-crear-modal"
                  disabled={editando}
                >
                  {editando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
