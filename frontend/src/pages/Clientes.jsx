import { useState, useEffect } from 'react';
import { Users, Search, Plus, UserPlus, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import api from '../api/axios'; // Conexión a la base de datos

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({
    nombre_completo: '', documento_identidad: '', telefono: '', 
    correo: '', direccion_entrega: '', tipo_cliente: 'REGULAR', cupo_credito: 0
  });

  // Cargar clientes desde la Base de Datos al entrar a la vista
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo || !formData.telefono) {
      alert("El nombre y teléfono son obligatorios");
      return;
    }
    
    try {
      // Petición real para guardar en SQLite
      const response = await api.post('/clientes', {
        ...formData,
        cupo_credito: parseFloat(formData.cupo_credito) || 0
      });

      // Agregar el nuevo cliente a la lista visual sin recargar la página
      setClientes([response.data, ...clientes]);
      setFormData({ nombre_completo: '', documento_identidad: '', telefono: '', correo: '', direccion_entrega: '', tipo_cliente: 'REGULAR', cupo_credito: 0 });
      alert("Cliente guardado exitosamente en la base de datos");
    } catch (error) {
      console.error("Error guardando cliente:", error);
      alert(error.response?.data?.message || "Ocurrió un error guardando el cliente.");
    }
  };

  const filtrados = clientes.filter(c => c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || c.documento_identidad.includes(busqueda));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>
      
      {/* Panel Izquierdo: Lista de Clientes */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Directorio de Clientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra la información y el crédito de tus compradores.</p>
        </header>

        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar por nombre o documento..." 
            style={{ paddingLeft: '2.5rem' }}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtrados.map(cliente => (
            <div key={cliente.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '45px', height: '45px', borderRadius: '50%', 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                  {cliente.nombre_completo.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {cliente.nombre_completo}
                    <span style={{ 
                      fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)',
                      backgroundColor: cliente.tipo_cliente === 'CREDITO' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: cliente.tipo_cliente === 'CREDITO' ? 'var(--warning)' : 'var(--text-secondary)'
                    }}>
                      {cliente.tipo_cliente}
                    </span>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>CC/NIT: {cliente.documento_identidad || 'N/A'}</p>
                </div>
              </div>
              
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                  <Phone size={14} /> {cliente.telefono}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                  <Mail size={14} /> {cliente.correo || 'Sin correo'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Derecho: Formulario de Nuevo Cliente */}
      <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', minWidth: '340px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          <UserPlus size={20} color="var(--accent-primary)" /> Registrar Nuevo Cliente
        </h2>

        <form onSubmit={handleCrearCliente} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Nombres y Apellidos *</label>
            <input type="text" name="nombre_completo" className="input-field" required value={formData.nombre_completo} onChange={handleInputChange} placeholder="Ej. Carlos Mendoza" />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Doc. Identidad</label>
              <input type="text" name="documento_identidad" className="input-field" value={formData.documento_identidad} onChange={handleInputChange} placeholder="CC / NIT" />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Teléfono (WhatsApp) *</label>
              <input type="tel" name="telefono" className="input-field" required value={formData.telefono} onChange={handleInputChange} placeholder="57300..." />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Correo Electrónico</label>
            <input type="email" name="correo" className="input-field" value={formData.correo} onChange={handleInputChange} placeholder="cliente@correo.com" />
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Dirección de Entrega</label>
            <input type="text" name="direccion_entrega" className="input-field" value={formData.direccion_entrega} onChange={handleInputChange} placeholder="Calle 123 #45-67" />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Tipo de Cliente</label>
              <select name="tipo_cliente" className="input-field" value={formData.tipo_cliente} onChange={handleInputChange} style={{ appearance: 'auto' }}>
                <option value="REGULAR">Regular</option>
                <option value="CREDITO">Crédito</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            {formData.tipo_cliente === 'CREDITO' && (
              <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                <label>Cupo de Crédito</label>
                <input type="number" name="cupo_credito" className="input-field" value={formData.cupo_credito} onChange={handleInputChange} min="0" placeholder="0.00" />
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.8rem' }}>
            <Plus size={18} /> Guardar Cliente
          </button>
        </form>
      </div>

    </div>
  );
}
