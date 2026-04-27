import { useState, useEffect } from 'react';
import { Lock, Unlock, DollarSign, Clock, AlertTriangle, CheckCircle, X, TrendingUp } from 'lucide-react';
import api from '../api/axios';

export default function ControlCaja() {
  const [estado, setEstado] = useState(null); // null = cargando
  const [historial, setHistorial] = useState([]);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [montoDeclarado, setMontoDeclarado] = useState('');
  const [resumenCierre, setResumenCierre] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const [estadoRes, histRes] = await Promise.all([
        api.get('/caja/estado'),
        api.get('/caja/historial')
      ]);
      setEstado(estadoRes.data);
      setHistorial(histRes.data);
    } catch (err) { console.error(err); }
  };

  const abrirCaja = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/caja/abrir', { monto_inicial: Number(montoInicial) || 0 });
      setShowAbrirModal(false);
      setMontoInicial('');
      cargar();
    } catch (err) { alert('Error al abrir caja'); } finally { setLoading(false); }
  };

  const cerrarCaja = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/caja/cerrar', { monto_declarado: Number(montoDeclarado) });
      setResumenCierre(res.data);
      setShowCerrarModal(false);
      setMontoDeclarado('');
      cargar();
    } catch (err) { alert('Error al cerrar caja'); } finally { setLoading(false); }
  };

  const cajaAbierta = estado?.abierto;
  const turno = estado?.turno;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Control de Caja</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Apertura y cierre de turnos con conciliación automática.</p>
      </header>

      {/* Estado actual */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: `4px solid ${cajaAbierta ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: cajaAbierta ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
              {cajaAbierta ? <Unlock size={28} color="var(--success)" /> : <Lock size={28} color="var(--danger)" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                {cajaAbierta ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
              </h2>
              {cajaAbierta && turno && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Apertura: {new Date(turno.fecha_apertura).toLocaleString()} · Fondo inicial: ${Number(turno.monto_inicial).toFixed(2)}
                </p>
              )}
              {!cajaAbierta && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Abre la caja para comenzar a registrar ventas</p>}
            </div>
          </div>
          <div>
            {!cajaAbierta ? (
              <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', backgroundColor: 'var(--success)', fontSize: '1rem' }}
                onClick={() => setShowAbrirModal(true)}>
                <Unlock size={20} /> Abrir Caja
              </button>
            ) : (
              <button className="btn" style={{ padding: '0.8rem 1.5rem', backgroundColor: 'var(--danger)', color: 'white', fontSize: '1rem' }}
                onClick={() => setShowCerrarModal(true)}>
                <Lock size={20} /> Cerrar Caja
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumen del cierre anterior */}
      {resumenCierre && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: `4px solid ${resumenCierre.diferencia >= 0 ? 'var(--success)' : 'var(--warning)'}` }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>✅ Resumen del Último Cierre</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Ventas del Turno', value: `$${resumenCierre.total_ventas_turno?.toFixed(2)}`, color: 'var(--success)' },
              { label: 'Monto Esperado', value: `$${resumenCierre.monto_esperado?.toFixed(2)}`, color: 'var(--accent-primary)' },
              { label: 'Monto Declarado', value: `$${Number(resumenCierre.monto_declarado || 0).toFixed(2)}`, color: 'var(--text-primary)' },
              { label: 'Diferencia', value: `$${resumenCierre.diferencia?.toFixed(2)}`, color: resumenCierre.diferencia >= 0 ? 'var(--success)' : 'var(--danger)' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setResumenCierre(null)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
            Cerrar resumen
          </button>
        </div>
      )}

      {/* Historial de Turnos */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Historial de Turnos</h3>
        {historial.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>No hay turnos cerrados aún.</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historial.map(t => (
            <div key={t.id} style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{t.usuario_nombre || 'Usuario'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {new Date(t.fecha_apertura).toLocaleString()} → {t.fecha_cierre ? new Date(t.fecha_cierre).toLocaleString() : 'Abierto'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ventas</p>
                  <p style={{ fontWeight: 'bold', color: 'var(--success)' }}>${Number(t.total_ventas_turno || 0).toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Diferencia</p>
                  <p style={{ fontWeight: 'bold', color: Number(t.diferencia) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {Number(t.diferencia) >= 0 ? '+' : ''}${Number(t.diferencia || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL ABRIR */}
      {showAbrirModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', borderTop: '4px solid var(--success)' }}>
            <button onClick={() => setShowAbrirModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Abrir Caja</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Ingresa el dinero en efectivo con que inicias el turno.</p>
            <form onSubmit={abrirCaja}>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Monto Inicial en Caja ($)</label>
                <input type="number" className="input-field" value={montoInicial} onChange={e => setMontoInicial(e.target.value)} min="0" step="0.01" placeholder="0.00" autoFocus />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.8rem', backgroundColor: 'var(--success)' }} disabled={loading}>
                <Unlock size={18} /> {loading ? 'Abriendo...' : 'Abrir Turno'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CERRAR */}
      {showCerrarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative', borderTop: '4px solid var(--danger)' }}>
            <button onClick={() => setShowCerrarModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>Cerrar Caja</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Cuenta el dinero físico y declara el total que hay en caja.</p>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>El sistema calculará la diferencia entre lo esperado (ventas + fondo) y lo que declares.</p>
            </div>
            <form onSubmit={cerrarCaja}>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Total Declarado en Caja ($) *</label>
                <input type="number" className="input-field" value={montoDeclarado} onChange={e => setMontoDeclarado(e.target.value)} min="0" step="0.01" required autoFocus />
              </div>
              <button type="submit" className="btn w-full" style={{ padding: '0.8rem', backgroundColor: 'var(--danger)', color: 'white' }} disabled={loading}>
                <Lock size={18} /> {loading ? 'Cerrando...' : 'Cerrar Turno y Ver Resumen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
