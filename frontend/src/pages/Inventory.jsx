import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, X, AlertTriangle, Bell } from 'lucide-react';
import api from '../api/axios';

export default function Inventory() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [formData, setFormData] = useState({
    codigo_barras: '', nombre: '', descripcion: '', categoria: '',
    precio_costo: '', precio_venta: '', stock_actual: '', stock_minimo: 5
  });

  const [errorCarga, setErrorCarga] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setErrorCarga(null);
      const response = await api.get('/inventario/productos');
      console.log("Productos recibidos:", response.data);
      setProductos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      setErrorCarga(error.response?.data?.message || error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        precio_costo: parseFloat(formData.precio_costo),
        precio_venta: parseFloat(formData.precio_venta),
        stock_actual: parseInt(formData.stock_actual) || 0,
        stock_minimo: parseInt(formData.stock_minimo) || 5
      };

      const response = await api.post('/inventario/productos', payload);
      setProductos([response.data, ...productos]);
      setMostrarModal(false);
      setFormData({ codigo_barras: '', nombre: '', descripcion: '', categoria: '', precio_costo: '', precio_venta: '', stock_actual: '', stock_minimo: 5 });
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      alert(error.response?.data?.message || 'Error al guardar el producto.');
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.delete(`/inventario/${id}`);
      setProductos(productos.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto.');
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.codigo_barras && p.codigo_barras.includes(busqueda))
  );

  const productosConStockBajo = productos.filter(p => 
    p.estado === 'ACTIVO' && Number(p.stock_actual) <= Number(p.stock_minimo || 5)
  );

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Inventario</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona tus productos y controla el stock en tiempo real.</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </header>

      {errorCarga && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
          <strong>Error al cargar datos:</strong> {errorCarga}
          <button onClick={cargarProductos} style={{ marginLeft: '1rem', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Reintentar</button>
        </div>
      )}

      {/* Alertas de Stock Bajo */}
      {productosConStockBajo.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Bell size={20} color="var(--warning)" />
            <p style={{ fontWeight: '600', color: 'var(--warning)' }}>⚠️ {productosConStockBajo.length} producto(s) con stock bajo o agotado</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {productosConStockBajo.map(p => (
              <span key={p.id} style={{ padding: '0.25rem 0.75rem', backgroundColor: p.stock_actual === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: p.stock_actual === 0 ? 'var(--danger)' : 'var(--warning)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '500' }}>
                {p.nombre}: {p.stock_actual === 0 ? '⛔ AGOTADO' : `${p.stock_actual} / mín.${p.stock_minimo}`}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por código o nombre..." 
              style={{ paddingLeft: '2.5rem' }}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>Código</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>Producto</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>Precio Venta</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>Stock</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>Estado</th>
                <th style={{ padding: '1rem 0.5rem', fontWeight: '500', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(prod => (
                <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem 0.5rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{prod.codigo_barras || 'N/A'}</td>
                  <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{prod.nombre}</td>
                  <td style={{ padding: '1rem 0.5rem', color: 'var(--accent-primary)' }}>${prod.precio_venta?.toFixed(2)}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span style={{ color: prod.stock_actual === 0 ? 'var(--danger)' : prod.stock_actual <= prod.stock_minimo ? 'var(--warning)' : 'inherit' }}>
                      {prod.stock_actual} un.
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '600',
                      backgroundColor: prod.estado === 'ACTIVO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: prod.estado === 'ACTIVO' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {prod.estado}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                    <button onClick={() => eliminarProducto(prod.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay productos en el inventario. Haz clic en "Nuevo Producto" para empezar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Producto */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Registrar Producto</h2>
              <button onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleCrearProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Nombre del Producto *</label>
                  <input type="text" name="nombre" className="input-field" required value={formData.nombre} onChange={handleInputChange} />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Código de Barras</label>
                  <input type="text" name="codigo_barras" className="input-field" value={formData.codigo_barras} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Precio de Costo *</label>
                  <input type="number" step="0.01" name="precio_costo" className="input-field" required value={formData.precio_costo} onChange={handleInputChange} />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Precio de Venta *</label>
                  <input type="number" step="0.01" name="precio_venta" className="input-field" required value={formData.precio_venta} onChange={handleInputChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Stock Inicial</label>
                  <input type="number" name="stock_actual" className="input-field" value={formData.stock_actual} onChange={handleInputChange} />
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Categoría</label>
                  <input type="text" name="categoria" className="input-field" value={formData.categoria} onChange={handleInputChange} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Descripción</label>
                <textarea name="descripcion" className="input-field" rows="3" value={formData.descripcion} onChange={handleInputChange}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
