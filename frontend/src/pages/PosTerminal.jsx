import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, User } from 'lucide-react';
import api from '../api/axios';

export default function PosTerminal() {
  const [productos, setProductos] = useState([]);
  const [clientesBase, setClientesBase] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busquedaProd, setBusquedaProd] = useState('');
  
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
  const [tipoPago, setTipoPago] = useState('CONTADO');

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

        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', alignContent: 'start'
        }}>
          {productosFiltrados.map(prod => (
            <div 
              key={prod.id} 
              className="glass-panel" 
              style={{ padding: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => agregarAlCarrito(prod)}
            >
              <div style={{ height: '80px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📦</span>
              </div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.nombre}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${prod.precio_venta?.toFixed(2)}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Stock: {prod.stock_actual}</span>
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

      {/* Panel Derecho: Carrito de Compras y Cliente */}
      <div className="glass-panel pos-cart" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', padding: '1.5rem', minWidth: '380px', height: '100%' }}>
        
        {/* CSS Overrides para POS Movil */}
        <style>{`
          @media (max-width: 1024px) {
            .pos-container {
              flex-direction: column !important;
              height: auto !important;
              gap: 2rem !important;
            }
            .pos-cart {
              min-width: 100% !important;
              height: auto !important;
              position: sticky;
              bottom: 0;
              z-index: 10;
              border-bottom: none;
              border-left: none;
              border-right: none;
              border-radius: var(--radius-lg) var(--radius-lg) 0 0;
              box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
            }
            .pos-catalog {
              padding-bottom: 20px;
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
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>{item.nombre}</h5>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: '600', fontSize: '0.85rem' }}>${item.precio_venta?.toFixed(2)}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => modificarCantidad(item.id, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.2rem' }}><Minus size={16} /></button>
                  <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.cantidad}</span>
                  <button onClick={() => modificarCantidad(item.id, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.2rem' }}><Plus size={16} /></button>
                  <button onClick={() => eliminarDelCarrito(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '0.5rem', padding: '0.2rem' }}><Trash2 size={16} /></button>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <span>Total a Pagar</span>
            <span style={{ color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
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
