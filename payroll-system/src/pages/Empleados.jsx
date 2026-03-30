// Página de gestión de empleados - CRUD completo
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/Empleados.css'

export const Empleados = () => {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    cargo: '',
    sueldo_base: '',
  })

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const fetchEmpleados = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmpleados(data || [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
      alert('Error al cargar empleados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        // Actualizar empleado
        const { error } = await supabase
          .from('empleados')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        alert('Empleado actualizado exitosamente')
      } else {
        // Crear nuevo empleado
        const { error } = await supabase
          .from('empleados')
          .insert([formData])

        if (error) throw error
        alert('Empleado creado exitosamente')
      }

      resetForm()
      fetchEmpleados()
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleEdit = (empleado) => {
    setFormData({
      nombre: empleado.nombre,
      dni: empleado.dni,
      telefono: empleado.telefono,
      cargo: empleado.cargo,
      sueldo_base: empleado.sueldo_base,
    })
    setEditingId(empleado.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return

    try {
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Empleado eliminado')
      fetchEmpleados()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      cargo: '',
      sueldo_base: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="empleados-page">
      <div className="page-header">
        <h1>👥 Empleados</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo Empleado'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>DNI *</label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Cargo *</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sueldo Base *</label>
              <input
                type="number"
                step="0.01"
                value={formData.sueldo_base}
                onChange={(e) => setFormData({ ...formData, sueldo_base: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="empleados-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Cargo</th>
              <th>Sueldo Base</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No hay empleados registrados
                </td>
              </tr>
            ) : (
              empleados.map((empleado) => (
                <tr key={empleado.id}>
                  <td>{empleado.nombre}</td>
                  <td>{empleado.dni}</td>
                  <td>{empleado.telefono || '-'}</td>
                  <td>{empleado.cargo}</td>
                  <td>S/.{empleado.sueldo_base.toLocaleString()}</td>
                  <td>
                    <button onClick={() => handleEdit(empleado)} className="btn-edit">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(empleado.id)} className="btn-delete">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
