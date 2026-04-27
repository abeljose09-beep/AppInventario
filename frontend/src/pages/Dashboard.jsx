import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, DollarSign, Loader2, TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';
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
      value: loading ? '...' : `$${(statsData?.ventasHoy || 0).toFixed(2)}`, 
      icon: <DollarSign size={24} color="#10b981" />, 
      trend: '+ Real',
      color: 'var(--success)'
    },
    { 
      title: 'Ganancia Bruta (Hoy)', 
      value: loading ? '...' : `$${(statsData?.gananciaBrutaHoy || 0).toFixed(2)}`, 
      icon: <TrendingUp size={24} color="#6366f1" />, 
      trend: 'Utilidad',
      color: '#6366f1'
    },
    { 
      title: 'Cuentas por Cobrar', 
      value: loading ? '...' : `$${(statsData?.cuentasCobrar || 0).toFixed(2)}`, 
      icon: <ShoppingCart size={24} color="#f59e0b" />, 
      trend: 'Pendiente',
      color: 'var(--warning)'
    },
    { 
      title: 'Gastos del Mes', 
      value: loading ? '...' : `$${(statsData?.gastosMes || 0).toFixed(2)}`, 
      icon: <TrendingDown size={24} color="#ef4444" />, 
      trend: 'Egresos',
      color: 'var(--danger)'
    },
    { 
      title: 'Productos Activos', 
      value: loading ? '...' : (statsData?.productosActivos || '0'), 
      icon: <Package size={24} color="#6366f1" />, 
      trend: 'Stock',
      color: '#6366f1'
    },
    { 
      title: 'Total Clientes', 
      value: loading ? '...' : (statsData?.totalClientes || '0'), 
      icon: <Users size={24} color="#ec4899" />, 
      trend: 'Base',
      color: '#ec4899'
    },
  ];

  const margen = statsData && statsData.ventasHoy > 0 
    ? ((statsData.gananciaBrutaHoy / statsData.ventasHoy) * 100).toFixed(1) 
    : 0;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Resumen General</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Tus números reales de hoy — ingresos, costos y rentabilidad.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', animationDelay: `${idx * 0.07}s`, borderLeft: `3px solid ${stat.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)' }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                {stat.trend}
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: stat.color }}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : stat.value}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Rentabilidad del día */}
      {!loading && statsData && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={20} color="var(--accent-primary)" /> Rentabilidad de Hoy
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Ingresos</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success)' }}>${(statsData.ventasHoy || 0).toFixed(2)}</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Costo de Ventas</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--danger)' }}>${(statsData.costoVentasHoy || 0).toFixed(2)}</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Ganancia Bruta</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#6366f1' }}>${(statsData.gananciaBrutaHoy || 0).toFixed(2)}</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Margen (%)</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--warning)' }}>{margen}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico ventas 7 días */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} color="var(--accent-primary)" /> Ventas Últimos 7 Días
        </h3>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
             <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
          </div>
        ) : statsData?.chartData && statsData.chartData.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', paddingTop: '20px' }}>
            {statsData.chartData.map((day, idx) => {
              const maxVentas = Math.max(...statsData.chartData.map(d => d.ventas), 1);
              const heightPercent = (day.ventas / maxVentas) * 100;
              const isToday = idx === statsData.chartData.length - 1;
              
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }} title={`$${day.ventas}`}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 'bold', opacity: day.ventas > 0 ? 1 : 0 }}>
                    ${day.ventas.toFixed(0)}
                  </div>
                  <div style={{ 
                    width: '60%', maxWidth: '45px', minWidth: '20px', height: '180px', 
                    display: 'flex', alignItems: 'flex-end',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: '100%', height: `${heightPercent}%`, 
                      background: isToday 
                        ? 'linear-gradient(to top, #10b981, #34d399)'
                        : 'linear-gradient(to top, var(--accent-primary), #a855f7)',
                      transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                      boxShadow: isToday ? '0 -4px 15px rgba(16,185,129,0.4)' : '0 -4px 15px var(--accent-glow)'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: isToday ? 'var(--success)' : 'var(--text-secondary)', fontWeight: isToday ? 'bold' : 'normal' }}>
                    {day.name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-muted)' }}>
             Registra tu primera venta para ver la gráfica.
          </div>
        )}
      </div>
    </div>
  );
}
