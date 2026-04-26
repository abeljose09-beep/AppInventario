import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Package, Users, ShoppingCart, LayoutDashboard, LogOut, Receipt } from 'lucide-react';

export default function MainLayout({ isAuthenticated, setAuth }) {
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" />;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Inventario', path: '/inventario', icon: <Package size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Ventas (POS)', path: '/ventas', icon: <ShoppingCart size={20} /> },
    { name: 'Cobros', path: '/cobros', icon: <Receipt size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{
        width: '260px', 
        borderLeft: 'none', borderTop: 'none', borderBottom: 'none', 
        borderRadius: 0,
        display: 'flex', flexDirection: 'column', padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <Package color="var(--accent-primary)" size={28} />
          <h2 style={{ fontSize: '1.25rem' }}>Inv<span style={{color: 'var(--accent-primary)'}}>Sys</span></h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={index} to={item.path} className="btn" style={{
                justifyContent: 'flex-start',
                padding: '0.75rem 1rem',
                backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 14px 0 var(--accent-glow)' : 'none',
                width: '100%'
              }}>
                {item.icon} {item.name}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout} 
          className="btn" 
          style={{
            justifyContent: 'flex-start', color: 'var(--danger)', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', marginTop: 'auto'
          }}
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
