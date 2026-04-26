import { useState, useEffect } from 'react';
import { Search, Calendar, User, DollarSign, Package, ExternalLink } from 'lucide-react';
import api from '../api/axios';

export default function Historial() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await api.get('/ventas');
      setVentas(response.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = ventas.filter(v => 
    v.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    v.numero_referencia?.includes(busqueda)
  );

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Historial de Ventas</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Consulta el registro completo de todas tus operaciones comerciales.</p>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por cliente o número de factura..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtradas.map(venta => (
            <div key={venta.id} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', borderLeft: `4px solid ${venta.tipo_pago === 'CONTADO' ? 'var(--success)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{venta.cliente_nombre || 'Consumidor Final'}</h3>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)',
                      backgroundColor: venta.tipo_pago === 'CONTADO' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: venta.tipo_pago === 'CONTADO' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {venta.tipo_pago}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> {new Date(venta.fecha_compra).toLocaleDateString()} {new Date(venta.fecha_compra).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Package size={14} /> Ref: {venta.numero_referencia}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monto Total</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>${venta.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Detalle de productos expandible/lista */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem 0' }}>Producto</th>
                      <th style={{ padding: '0.5rem 0', textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Unitario</th>
                      <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venta.detalles?.map((det, i) => (
                      <tr key={i}>
                        <td style={{ padding: '0.5rem 0' }}>{det.nombre}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'center' }}>{det.cantidad}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>${det.precio_unitario.toFixed(2)}</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>${det.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filtradas.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <p>No se encontraron registros de ventas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
