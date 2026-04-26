import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, DollarSign, Loader2 } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStatsData(response.data);
    } catch (error) {
      console.error('Error cargando stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      title: 'Ventas de Hoy', 
      value: loading ? '...' : `$${statsData?.ventasHoy?.toFixed(2) || '0.00'}`, 
      icon: <DollarSign size={24} color="#10b981" />, 
      trend: '+ Real' 
    },
    { 
      title: 'Cuentas por Cobrar', 
      value: loading ? '...' : `$${statsData?.cuentasCobrar?.toFixed(2) || '0.00'}`, 
      icon: <ShoppingCart size={24} color="#f59e0b" />, 
      trend: 'Pendiente' 
    },
    { 
      title: 'Productos Activos', 
      value: loading ? '...' : (statsData?.productosActivos || '0'), 
      icon: <Package size={24} color="#6366f1" />, 
      trend: 'Stock' 
    },
    { 
      title: 'Total Clientes', 
      value: loading ? '...' : (statsData?.totalClientes || '0'), 
      icon: <Users size={24} color="#ec4899" />, 
      trend: 'Base' 
    },
  ];

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Resumen General</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Aquí tienes los números reales de tu negocio hoy.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', animationDelay: `${idx * 0.1}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: 'var(--radius-md)' 
              }}>
                {stat.icon}
              </div>
              <span style={{ 
                fontSize: '0.85rem', fontWeight: '500', 
                color: 'var(--text-secondary)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)'
              }}>
                {stat.trend}
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : stat.value}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for charts/tables */}
      <div className="glass-panel" style={{ padding: '2rem', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Gráfico de Ventas Mensuales (Próximamente)</p>
      </div>
    </div>
  );
}
