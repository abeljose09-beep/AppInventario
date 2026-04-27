import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Package, Users, ShoppingCart, LayoutDashboard, LogOut, Receipt, Menu, X, Clock, Truck, TrendingDown, Landmark } from 'lucide-react';

export default function MainLayout({ isAuthenticated, setAuth }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { name: 'Historial', path: '/historial', icon: <Clock size={20} /> },
    { name: 'Proveedores', path: '/proveedores', icon: <Truck size={20} /> },
    { name: 'Gastos', path: '/gastos', icon: <TrendingDown size={20} /> },
    { name: 'Control de Caja', path: '/caja', icon: <Landmark size={20} /> },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Mobile Header */}
      <header className="glass-panel mobile-only" style={{
        display: 'none', // Se activará por CSS/media query en realidad, pero aquí usamos lógica inline para simplicidad del demo
        padding: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 0,
        borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package color="var(--accent-primary)" size={24} />
          <h2 style={{ fontSize: '1.1rem' }}>InvSys</h2>
        </div>
        <button onClick={toggleMobileMenu} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{
          width: '260px', 
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex', flexDirection: 'column', padding: '1.5rem',
          transition: 'transform var(--transition-normal)',
          zIndex: 90
        }}>
          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <Package color="var(--accent-primary)" size={28} />
            <h2 style={{ fontSize: '1.25rem' }}>Inv<span style={{color: 'var(--accent-primary)'}}>Sys</span></h2>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={index} 
                  to={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn" 
                  style={{
                    justifyContent: 'flex-start',
                    padding: '0.75rem 1rem',
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 4px 14px 0 var(--accent-glow)' : 'none',
                    width: '100%'
                  }}
                >
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
        <main className="main-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* CSS Overrides for Mobile Sidebar */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-only { display: flex !important; }
          .desktop-only { display: none !important; }
          .sidebar {
            position: fixed;
            left: 0; top: 60px; bottom: 0;
            transform: translateX(-100%);
            width: 280px !important;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .main-content {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}

