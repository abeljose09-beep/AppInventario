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

      {/* Chart Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Ventas Últimos 7 Días</h3>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
             <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
          </div>
        ) : statsData?.chartData && statsData.chartData.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', paddingTop: '20px' }}>
            {statsData.chartData.map((day, idx) => {
              const maxVentas = Math.max(...statsData.chartData.map(d => d.ventas), 1);
              const heightPercent = (day.ventas / maxVentas) * 100;
              
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem', group: 'true' }} title={`$${day.ventas}`}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', opacity: day.ventas > 0 ? 1 : 0, transition: 'opacity 0.2s' }}>
                    ${day.ventas}
                  </div>
                  <div style={{ 
                    width: '40%', 
                    maxWidth: '40px',
                    minWidth: '20px',
                    height: '180px', 
                    display: 'flex', 
                    alignItems: 'flex-end',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '100%', 
                      height: `${heightPercent}%`, 
                      background: 'linear-gradient(to top, var(--accent-primary), #a855f7)',
                      transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      boxShadow: '0 -4px 15px var(--accent-glow)'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{day.name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
             No hay datos suficientes para el gráfico.
          </div>
        )}
      </div>
    </div>
  );
}
