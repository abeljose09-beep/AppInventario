import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import PosTerminal from './pages/PosTerminal';
import Inventory from './pages/Inventory';
import Cobros from './pages/Cobros';
import Clientes from './pages/Clientes';
import Historial from './pages/Historial';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificación simple de token al cargar (se conectará con el backend real luego)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />} 
        />
        
        <Route element={<MainLayout isAuthenticated={isAuthenticated} setAuth={setIsAuthenticated} />}>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/ventas" element={<PosTerminal />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/historial" element={<Historial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
