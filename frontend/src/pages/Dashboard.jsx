import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: 'Ventas de Hoy', value: '$1,240.00', icon: <DollarSign size={24} color="#10b981" />, trend: '+12.5%' },
    { title: 'Cuentas por Cobrar', value: '$850.00', icon: <ShoppingCart size={24} color="#f59e0b" />, trend: 'Pendiente' },
    { title: 'Productos Activos', value: '1,245', icon: <Package size={24} color="#6366f1" />, trend: 'Stock ok' },
    { title: 'Nuevos Clientes', value: '48', icon: <Users size={24} color="#ec4899" />, trend: '+5.2%' },
  ];

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Resumen General</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Bienvenido de nuevo al panel de control.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
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
                color: stat.trend.includes('+') ? 'var(--success)' : 'var(--text-secondary)',
                backgroundColor: stat.trend.includes('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)'
              }}>
                {stat.trend}
              </span>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.value}</h3>
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
