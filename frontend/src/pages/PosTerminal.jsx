import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, User, Package } from 'lucide-react';
import api from '../api/axios';

const getGradient = (id) => {
  const gradients = [
    'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  ];
  return gradients[id % gradients.length];
};

export default function PosTerminal() {
  const [productos, setProductos] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busquedaProd, setBusquedaProd] = useState('');
  
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
  const [tipoPago, setTipoPago] = useState('CONTADO');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    cargarDatosBasicos();
  }, []);

  const cargarDatosBasicos = async () => {
    try {
      const [resProd, resCli] = await Promise.all([
        api.get('/inventario/productos'),
        api.get('/clientes')
      ]);
      setProductos(resProd.data.filter(p => p.stock_actual > 0 && p.estado === 'ACTIVO'));
      setClientesBase(resCli.data);
    } catch (error) {
      console.error('Error cargando datos para POS:', error);
    }
  };

  const clientesFiltrados = clientesBase.filter(c => 
    c.nombre_completo.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
    (c.documento_identidad && c.documento_identidad.includes(busquedaCliente))
  );

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.nombre_completo);
    setMostrarResultadosCliente(false);
  };

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === prod.id);
      if (existe) {
        if (existe.cantidad >= prod.stock_actual) {
          alert('No hay suficiente stock disponible');
          return prev;
        }
        return prev.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...prod, cantidad: 1 }];
    });
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidad + delta;
        if (nuevaCant > item.stock_actual) {
          alert('Supera el stock actual disponible');
          return item;
        }
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  const impuestos = 0; // Sin impuestos
  const total = subtotal;

  const procesarVenta = async () => {
    if (!clienteSeleccionado) {
      alert("Por favor selecciona un cliente para registrar la venta.");
      return;
    }
    
    try {
      const payload = {
        cliente_id: clienteSeleccionado.id,
        productos: carrito.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_venta
        })),
        subtotal, impuestos, descuento: 0, total, tipo_pago: tipoPago
      };
      
      await api.post('/ventas', payload);
      alert(`Venta procesada con éxito a nombre de ${clienteSeleccionado.nombre_completo} por $${total.toFixed(2)}`);
      
      setCarrito([]);
      setClienteSeleccionado(null);
      setBusquedaCliente('');
      setIsCartOpen(false);
      cargarDatosBasicos(); // Recargar stock real
    } catch (error) {
      console.error('Error procesando venta:', error);
      alert(error.response?.data?.message || 'Error al procesar la venta');
    }
  };

  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()));

  return (
    <div className="pos-container animate-fade-in" style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 100px)' }}>
      {/* Panel Izquierdo: Catálogo y Búsqueda */}
      <div className="pos-catalog" style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
        <header>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Punto de Venta (POS)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Haz clic en un producto para agregarlo al carrito.</p>
        </header>

        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar producto por nombre..." 
            style={{ paddingLeft: '3rem', fontSize: '1rem' }}
            value={busquedaProd}
            onChange={(e) => setBusquedaProd(e.target.value)}
          />
        </div>

        <div className="pos-products-grid" style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
          gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', alignContent: 'start'
        }}>
          {productosFiltrados.map(prod => (
            <div 
              key={prod.id} 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden'
              }}
              onClick={() => agregarAlCarrito(prod)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--glass-shadow)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: getGradient(prod.id) }}></div>
              <div style={{ height: '70px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-0.25rem -0.25rem 0' }}>
                <Package size={32} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }} title={prod.nombre}>
                  {prod.nombre}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--success)', fontWeight: '700', fontSize: '1.15rem' }}>
                    ${prod.precio_venta?.toFixed(2)}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: '600', 
                    padding: '0.2rem 0.6rem', borderRadius: '1rem', 
                    backgroundColor: prod.stock_actual > 10 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: prod.stock_actual > 10 ? 'var(--success)' : 'var(--warning)'
                  }}>
                    Stock: {prod.stock_actual}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {productosFiltrados.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No hay productos con stock activo. Ve a Inventario a crear algunos.
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para el carrito en móvil */}
      <div className="mobile-cart-toggle" onClick={() => setIsCartOpen(true)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={22} />
            {carrito.length > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                {carrito.length}
              </span>
            )}
          </div>
          <span>Ver Carrito</span>
        </div>
        <span>${total.toFixed(2)}</span>
      </div>

      {/* Panel Derecho: Carrito de Compras y Cliente */}
      <div className={`glass-panel pos-cart ${isCartOpen ? 'open' : ''}`} style={{ flex: 1.2, display: 'flex', flexDirection: 'column', padding: '1.5rem', minWidth: '380px', height: '100%' }}>
        
        {/* Header solo visible en móvil para cerrar el carrito */}
        <div className="mobile-cart-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Tu Carrito</h2>
          <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* CSS Overrides para POS Movil */}
        <style>{`
          @media (max-width: 1024px) {
            .pos-container {
              flex-direction: column !important;
              height: auto !important;
              gap: 0 !important;
            }
            .pos-catalog {
              padding-bottom: 90px !important; /* Espacio para el botón flotante */
            }
            .pos-products-grid {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
            }
            .mobile-cart-toggle {
              display: flex !important;
              position: fixed;
              bottom: 1.5rem;
              left: 1.5rem;
              right: 1.5rem;
              z-index: 90;
              background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
              color: white;
              padding: 1rem 1.5rem;
              border-radius: var(--radius-full);
              box-shadow: 0 10px 25px -5px var(--accent-glow);
              align-items: center;
              justify-content: space-between;
              font-weight: 600;
              font-size: 1.1rem;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .mobile-cart-toggle:active {
              transform: scale(0.98);
            }
            .pos-cart {
              position: fixed !important;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 100;
              background: var(--bg-primary) !important;
              border-radius: 0 !important;
              transform: translateY(100%);
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              min-width: 100% !important;
              padding: 1rem !important;
            }
            .pos-cart.open {
              transform: translateY(0);
            }
            .mobile-cart-header {
              display: flex !important;
            }
          }
          @media (min-width: 1025px) {
            .mobile-cart-toggle {
              display: none !important;
            }
          }
        `}</style>
        {/* Sección Cliente */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <User size={18} /> Datos del Cliente
          </h2>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar cliente (Nombre o Documento)..." 
              value={busquedaCliente}
              onChange={(e) => {
                setBusquedaCliente(e.target.value);
                setMostrarResultadosCliente(true);
                if (clienteSeleccionado && e.target.value !== clienteSeleccionado.nombre_completo) {
                  setClienteSeleccionado(null);
                }
              }}
              onFocus={() => setMostrarResultadosCliente(true)}
              style={{ borderColor: !clienteSeleccionado && carrito.length > 0 ? 'var(--warning)' : '' }}
            />
            {mostrarResultadosCliente && busquedaCliente && !clienteSeleccionado && (
              <div style={{ 
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, 
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', marginTop: '0.25rem', maxHeight: '150px', overflowY: 'auto',
                boxShadow: 'var(--glass-shadow)'
              }}>
                {clientesFiltrados.length > 0 ? clientesFiltrados.map(c => (
                  <div 
                    key={c.id} 
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => seleccionarCliente(c)}
                  >
                    <div style={{ fontWeight: '500' }}>{c.nombre_completo}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CC: {c.documento_identidad || 'N/A'}</div>
                  </div>
                )) : (
                  <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se encontraron clientes. 
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sección Carrito */}
        <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShoppingCart size={18} /> Carrito Actual
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto 0' }}>
              <p>El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid transparent`, backgroundImage: `linear-gradient(rgba(26, 29, 36, 1), rgba(26, 29, 36, 1)), ${getGradient(item.id)}`, backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: '0.95rem', marginBottom: '0.2rem', fontWeight: '600' }}>{item.nombre}</h5>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>${item.precio_venta?.toFixed(2)} x {item.cantidad}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: 'var(--radius-full)' }}>
                  <button onClick={() => modificarCantidad(item.id, -1)} style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}><Minus size={14} /></button>
                  <span style={{ width: '24px', textAlign: 'center', fontSize: '0.95rem', fontWeight: '600' }}>{item.cantidad}</span>
                  <button onClick={() => modificarCantidad(item.id, 1)} style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}><Plus size={14} /></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '1rem', minWidth: '70px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '1.05rem' }}>${(item.precio_venta * item.cantidad).toFixed(2)}</span>
                  <button onClick={() => eliminarDelCarrito(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginTop: '0.35rem', padding: '0.2rem', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7} title="Eliminar"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sección de Totales y Pago */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
             <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Tipo de Pago</label>
                <select className="input-field" value={tipoPago} onChange={(e) => setTipoPago(e.target.value)} style={{ padding: '0.5rem' }}>
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito</option>
                </select>
             </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Total a Pagar</span>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-primary)', textShadow: '0 2px 10px var(--accent-glow)' }}>${total.toFixed(2)}</span>
          </div>

          <button 
            className="btn btn-primary w-full" 
            style={{ padding: '1rem', fontSize: '1.1rem' }} 
            disabled={carrito.length === 0}
            onClick={procesarVenta}
          >
            <CreditCard size={20} /> Procesar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
