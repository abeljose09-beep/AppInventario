import { useState, useEffect } from 'react';
import { TrendingDown, Plus, X, Trash2, AlertCircle, Coffee, Zap, Home, Users, Package, MoreHorizontal } from 'lucide-react';
import api from '../api/axios';

const CATEGORIAS = [
  { key: 'ARRIENDO', label: 'Arriendo', icon: Home },
  { key: 'SERVICIOS', label: 'Servicios (Luz/Agua/Internet)', icon: Zap },
  { key: 'NOMINA', label: 'Nómina', icon: Users },
  { key: 'INSUMOS', label: 'Insumos', icon: Package },
  { key: 'ALIMENTACION', label: 'Alimentación', icon: Coffee },
  { key: 'GENERAL', label: 'General', icon: MoreHorizontal },
];

const METODOS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'];

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [form, setForm] = useState({ concepto: '', categoria: 'GENERAL', monto: '', metodo_pago: 'EFECTIVO', notas: '' });

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await api.get('/gastos');
      setGastos(res.data);
    } catch (err) { console.error(err); }
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gastos', form);
      setShowModal(false);
      setForm({ concepto: '', categoria: 'GENERAL', monto: '', metodo_pago: 'EFECTIVO', notas: '' });
      cargar();
    } catch (err) { alert('Error al registrar gasto'); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await api.delete(`/gastos/${id}`);
    cargar();
  };

  const filtrados = filtroCategoria ? gastos.filter(g => g.categoria === filtroCategoria) : gastos;
  const totalFiltrado = filtrados.reduce((s, g) => s + Number(g.monto), 0);
  
  const totalPorCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.key).reduce((s, g) => s + Number(g.monto), 0)
  }));

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Gastos Operativos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Registra y controla todos los egresos del negocio.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Registrar Gasto
        </button>
      </header>

      {/* Resumen por categoría */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {totalPorCategoria.map(cat => (
          <button key={cat.key} onClick={() => setFiltroCategoria(filtroCategoria === cat.key ? '' : cat.key)}
            className="glass-panel"
            style={{ padding: '1rem', cursor: 'pointer', border: filtroCategoria === cat.key ? '2px solid var(--danger)' : '1px solid var(--glass-border)', textAlign: 'left', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>
              <cat.icon size={20} color={cat.total > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{cat.label}</p>
            <p style={{ fontWeight: 'bold', color: cat.total > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>${cat.total.toFixed(2)}</p>
          </button>
        ))}
      </div>

      {/* Lista de gastos */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem' }}>{filtroCategoria ? `Gastos: ${filtroCategoria}` : 'Todos los Gastos'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {filtroCategoria && (
              <button className="btn btn-secondary" onClick={() => setFiltroCategoria('')} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                Ver todos <X size={14} />
              </button>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--danger)' }}>${totalFiltrado.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p>No hay gastos registrados.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtrados.map(g => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>{g.concepto}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {g.categoria} · {g.metodo_pago} · {new Date(g.fecha).toLocaleDateString()}
                </p>
                {g.notas && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.2rem' }}>{g.notas}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--danger)', whiteSpace: 'nowrap' }}>- ${Number(g.monto).toFixed(2)}</p>
                <button onClick={() => eliminar(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL NUEVO GASTO */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative', borderTop: '4px solid var(--danger)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Registrar Gasto</h2>
            <form onSubmit={guardar}>
              <div className="input-group">
                <label>Concepto *</label>
                <input type="text" className="input-field" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})} placeholder="Ej: Pago de luz de abril" required />
              </div>
              <div className="input-group">
                <label>Categoría</label>
                <select className="input-field" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                  {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Monto ($) *</label>
                <input type="number" className="input-field" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} min="1" step="0.01" required />
              </div>
              <div className="input-group">
                <label>Método de Pago</label>
                <select className="input-field" value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Notas (Opcional)</label>
                <input type="text" className="input-field" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Nota adicional..." />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.8rem', backgroundColor: 'var(--danger)' }}>
                <TrendingDown size={18} /> Registrar Gasto
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
