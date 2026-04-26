import { useState, useEffect } from 'react';
import { Send, CheckCircle, Search, AlertCircle, DollarSign } from 'lucide-react';
import api from '../api/axios';

export default function Cobros() {
  const [cuentas, setCuentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [abonosInput, setAbonosInput] = useState({}); 

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      const response = await api.get('/cobros/pendientes');
      setCuentas(response.data);
    } catch (error) {
      console.error('Error cargando cuentas por cobrar:', error);
    }
  };

  const handleMontoChange = (id, valor) => {
    setAbonosInput(prev => ({ ...prev, [id]: valor }));
  };

  const enviarWhatsApp = (cuenta) => {
    const mensaje = `Hola ${cuenta.cliente_nombre},%0A%0ATe saludamos de InvSys.%0AQueremos recordarte que tienes un saldo pendiente en tu cuenta de cobro N° *${cuenta.numero_referencia}*.%0A%0A*Resumen de la cuenta:*%0ATotal de la compra: $${cuenta.total.toFixed(2)}%0AValor abonado: $${cuenta.total_pagado.toFixed(2)}%0A*Saldo a pagar: $${cuenta.saldo_pendiente.toFixed(2)}*%0A%0APuedes realizar el pago mediante transferencia bancaria. ¡Quedamos atentos a cualquier duda!`;
    let numero = cuenta.cliente_telefono || '';
    if (numero && !numero.startsWith('+') && numero.length === 10) numero = '57' + numero; 
    const url = `https://wa.me/${numero.replace('+', '')}?text=${mensaje}`;
    window.open(url, '_blank');
  };

  const registrarAbono = async (id, montoDefecto) => {
    const montoText = abonosInput[id];
    let montoAbono = montoText ? parseFloat(montoText) : montoDefecto;
    
    if (isNaN(montoAbono) || montoAbono <= 0) {
      alert("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    try {
      await api.post(`/cobros/${id}/abono`, {
        monto: montoAbono,
        metodo_pago: 'TRANSFERENCIA'
      });
      
      // Limpiar input y recargar
      setAbonosInput(prev => ({ ...prev, [id]: '' }));
      alert(`Abono parcial de $${montoAbono.toFixed(2)} registrado con éxito.`);
      cargarCuentas();
    } catch (error) {
      console.error('Error registrando abono:', error);
      alert('Hubo un error al registrar el abono.');
    }
  };

  const filtradas = cuentas.filter(c => 
    (c.cliente_nombre && c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())) || 
    (c.numero_referencia && c.numero_referencia.includes(busqueda))
  );

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Cuentas de Cobro</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestiona tu cartera, registra abonos parciales y envía notificaciones.</p>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por cliente o referencia..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtradas.map(cuenta => {
             if (cuenta.estado === 'PAGADA') return null;

             return (
              <div key={cuenta.id} className="cobro-card" style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', gap: '1.5rem'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{cuenta.cliente_nombre}</h3>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', 
                      backgroundColor: cuenta.estado === 'PENDIENTE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      color: cuenta.estado === 'PENDIENTE' ? 'var(--warning)' : 'var(--accent-primary)'
                    }}>
                      {cuenta.estado}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Ref: {cuenta.numero_referencia}</p>
                  
                  {/* Detalle de Productos Comprados */}
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Productos:
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem' }}>
                      {cuenta.detalles && cuenta.detalles.map((prod, idx) => (
                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span>{prod.cantidad}x {prod.nombre}</span>
                          <span style={{ color: 'var(--text-muted)' }}>${(prod.cantidad * prod.precio_unitario).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="cobro-stats" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total: ${cuenta.total.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                    Saldo: ${cuenta.saldo_pendiente.toFixed(2)}
                  </p>
                </div>

                <div className="cobro-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <div style={{ position: 'relative', width: '100px' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder={cuenta.saldo_pendiente.toString()}
                      value={abonosInput[cuenta.id] !== undefined ? abonosInput[cuenta.id] : ''}
                      onChange={(e) => handleMontoChange(cuenta.id, e.target.value)}
                      style={{ paddingLeft: '1rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  
                  <button className="btn btn-secondary" onClick={() => registrarAbono(cuenta.id, cuenta.saldo_pendiente)}>
                    <CheckCircle size={18} color="var(--success)" /> Abonar
                  </button>

                  <button className="btn" style={{ backgroundColor: '#25D366', color: 'white' }} onClick={() => enviarWhatsApp(cuenta)}>
                    <Send size={18} /> WA
                  </button>
                </div>

                <style>{`
                  @media (max-width: 768px) {
                    .cobro-card { flex-direction: column !important; align-items: stretch !important; }
                    .cobro-stats { text-align: left !important; order: -1; }
                    .cobro-actions { justify-content: space-between !important; }
                  }
                `}</style>
              </div>
            );
          })}

          {filtradas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No hay cuentas pendientes por cobrar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
