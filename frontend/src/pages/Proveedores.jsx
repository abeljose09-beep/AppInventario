import { useState, useEffect } from 'react';
import { Truck, Plus, X, Package, ShoppingBag, ChevronDown, ChevronUp, Trash2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [tab, setTab] = useState('proveedores'); // 'proveedores' | 'ordenes'
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalOrden, setShowModalOrden] = useState(false);
  const [expandedOrden, setExpandedOrden] = useState(null);
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', nit: '', telefono: '', email: '', direccion: '' });
  const [ordenForm, setOrdenForm] = useState({ proveedor_id: '', items: [] });
  const [itemTemp, setItemTemp] = useState({ producto_id: '', cantidad: 1, precio_costo: 0 });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const [p, pr, o] = await Promise.all([
        api.get('/proveedores'),
        api.get('/inventario/productos'),
        api.get('/proveedores/ordenes')
      ]);
      setProveedores(p.data);
      setProductos(pr.data);
      setOrdenes(o.data);
    } catch (err) { console.error(err); }
  };

  const crearProveedor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/proveedores', nuevoProveedor);
      setShowModalProveedor(false);
      setNuevoProveedor({ nombre: '', nit: '', telefono: '', email: '', direccion: '' });
      cargar();
    } catch (err) { alert('Error al crear proveedor'); }
  };

  const eliminarProveedor = async (id) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    await api.delete(`/proveedores/${id}`);
    cargar();
  };

  const addItem = () => {
    if (!itemTemp.producto_id || itemTemp.cantidad <= 0) return alert('Selecciona producto y cantidad');
    const prod = productos.find(p => p.id === itemTemp.producto_id);
    setOrdenForm(prev => ({
      ...prev,
      items: [...prev.items, { ...itemTemp, nombre: prod?.nombre || '', subtotal: itemTemp.cantidad * itemTemp.precio_costo }]
    }));
    setItemTemp({ producto_id: '', cantidad: 1, precio_costo: 0 });
  };

  const crearOrden = async (e) => {
    e.preventDefault();
    if (!ordenForm.proveedor_id || ordenForm.items.length === 0) return alert('Faltan datos');
    const prov = proveedores.find(p => p.id === ordenForm.proveedor_id);
    const total = ordenForm.items.reduce((s, i) => s + i.subtotal, 0);
    try {
      await api.post('/proveedores/ordenes', {
        proveedor_id: ordenForm.proveedor_id,
        proveedor_nombre: prov?.nombre || '',
        items: ordenForm.items,
        total
      });
      alert('Orden de compra creada y stock actualizado');
      setShowModalOrden(false);
      setOrdenForm({ proveedor_id: '', items: [] });
      cargar();
    } catch (err) { alert('Error al crear orden'); }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Proveedores</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona proveedores y órdenes de compra de inventario.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowModalProveedor(true)}>
            <Truck size={18} /> Nuevo Proveedor
          </button>
          <button className="btn btn-primary" onClick={() => setShowModalOrden(true)} disabled={proveedores.length === 0}>
            <ShoppingBag size={18} /> Nueva Orden de Compra
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['proveedores', 'Proveedores'], ['ordenes', 'Órdenes de Compra']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="btn"
            style={{ backgroundColor: tab === key ? 'var(--accent-primary)' : 'transparent', color: tab === key ? 'white' : 'var(--text-secondary)', boxShadow: tab === key ? '0 4px 14px var(--accent-glow)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* PROVEEDORES LIST */}
      {tab === 'proveedores' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {proveedores.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Truck size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No hay proveedores registrados aún.</p>
            </div>
          )}
          {proveedores.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{p.nombre}</h3>
                  {p.nit && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NIT: {p.nit}</p>}
                </div>
                <button onClick={() => eliminarProveedor(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {p.telefono && <span>📞 {p.telefono}</span>}
                {p.email && <span>✉️ {p.email}</span>}
                {p.direccion && <span>📍 {p.direccion}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ÓRDENES LIST */}
      {tab === 'ordenes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ordenes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No hay órdenes de compra aún.</p>
            </div>
          )}
          {ordenes.map(o => (
            <div key={o.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedOrden(expandedOrden === o.id ? null : o.id)}>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>{o.numero}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{o.proveedor_nombre} · {new Date(o.fecha).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>${o.total?.toFixed(2)}</span>
                  {expandedOrden === o.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              {expandedOrden === o.id && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Producto</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cant.</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Costo Unit.</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.items?.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.5rem' }}>{item.nombre}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>{item.cantidad}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem' }}>${Number(item.precio_costo).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--success)' }}>${Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVO PROVEEDOR */}
      {showModalProveedor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowModalProveedor(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Nuevo Proveedor</h2>
            <form onSubmit={crearProveedor}>
              {[['nombre','Nombre *','text',true],['nit','NIT / Documento','text',false],['telefono','Teléfono','tel',false],['email','Email','email',false],['direccion','Dirección','text',false]].map(([field, label, type, req]) => (
                <div key={field} className="input-group">
                  <label>{label}</label>
                  <input type={type} className="input-field" value={nuevoProveedor[field]} onChange={e => setNuevoProveedor({...nuevoProveedor,[field]:e.target.value})} required={req} />
                </div>
              ))}
              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem', padding: '0.8rem' }}>Guardar Proveedor</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ORDEN DE COMPRA */}
      {showModalOrden && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative', margin: 'auto' }}>
            <button onClick={() => setShowModalOrden(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Nueva Orden de Compra</h2>
            <form onSubmit={crearOrden}>
              <div className="input-group">
                <label>Proveedor *</label>
                <select className="input-field" value={ordenForm.proveedor_id} onChange={e => setOrdenForm({...ordenForm, proveedor_id: e.target.value})} required>
                  <option value="">Seleccionar...</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>AGREGAR PRODUCTO</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'end' }}>
                  <div>
                    <select className="input-field" value={itemTemp.producto_id} onChange={e => setItemTemp({...itemTemp, producto_id: e.target.value})}>
                      <option value="">Producto...</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <input type="number" className="input-field" placeholder="Cant." value={itemTemp.cantidad} onChange={e => setItemTemp({...itemTemp, cantidad: Number(e.target.value)})} style={{ width: '70px' }} min="1" />
                  <input type="number" className="input-field" placeholder="Costo $" value={itemTemp.precio_costo} onChange={e => setItemTemp({...itemTemp, precio_costo: Number(e.target.value)})} style={{ width: '90px' }} min="0" step="0.01" />
                </div>
                <button type="button" className="btn btn-secondary" onClick={addItem} style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Agregar
                </button>
              </div>

              {ordenForm.items.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {ordenForm.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                      <span>{item.nombre} x{item.cantidad}</span>
                      <span style={{ color: 'var(--success)' }}>${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--success)' }}>${ordenForm.items.reduce((s,i) => s + i.subtotal, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.8rem' }} disabled={ordenForm.items.length === 0}>
                Confirmar Orden y Actualizar Stock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
