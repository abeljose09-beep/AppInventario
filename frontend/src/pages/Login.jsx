import { useState } from 'react';
import { PackageSearch, LogIn } from 'lucide-react';
import api from '../api/axios'; // Importamos la conexión real

export default function Login({ setAuth }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // Llamada real al backend en el puerto 5000
      const response = await api.post('/auth/login', { correo, password });
      
      const { token, usuario } = response.data;
      
      // Guardar token real y datos del usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      setAuth(true);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setErrorMsg(error.response?.data?.message || 'Error de conexión con el servidor. ¿Está encendido?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      minHeight: '100vh', padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
          <PackageSearch size={48} strokeWidth={1.5} />
        </div>
        
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Bienvenido</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Ingresa tus credenciales para continuar
        </p>

        {errorMsg && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input 
              type="email" 
              id="correo" 
              className="input-field" 
              placeholder="admin@empresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required 
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando...' : (
              <>
                <LogIn size={18} /> Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
