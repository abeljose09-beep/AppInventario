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

  // Agrupar cobros por cliente
  const cobrosAgrupados = filtradas.reduce((acc, current) => {
    const cliente = current.cliente_nombre || 'Cliente Desconocido';
    if (!acc[cliente]) {
      acc[cliente] = {
        nombre: cliente,
        totalDeuda: 0,
        cuentas: []
      };
    }
    acc[cliente].cuentas.push(current);
    acc[cliente].totalDeuda += current.saldo_pendiente;
    return acc;
  }, {});

  const clientesConDeuda = Object.values(cobrosAgrupados);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Cartera de Clientes</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestiona los saldos pendientes agrupados por cliente.</p>
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

        <div style={{ display: 'grid', gap: '2rem' }}>
          {clientesConDeuda.map((grupo, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
              <div className="cobro-header-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>{grupo.nombre}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{grupo.cuentas.length} facturas pendientes</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deuda Total</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                    ${grupo.totalDeuda.toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {grupo.cuentas.map(cuenta => (
                  <div key={cuenta.id} className="cobro-card">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>Ref: {cuenta.numero_referencia}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total factura: ${cuenta.total.toFixed(2)}</p>
                      
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Items:</strong> {cuenta.detalles?.map(d => `${d.cantidad}x ${d.nombre}`).join(', ')}
                      </div>
                    </div>

                    <div className="cobro-saldo" style={{ textAlign: 'center', minWidth: '100px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo Pendiente</p>
                      <p style={{ fontWeight: 'bold', color: 'var(--warning)' }}>${cuenta.saldo_pendiente.toFixed(2)}</p>
                    </div>

                    <div className="cobro-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="Monto"
                        value={abonosInput[cuenta.id] || ''}
                        onChange={(e) => handleMontoChange(cuenta.id, e.target.value)}
                        style={{ width: '90px', padding: '0.4rem', fontSize: '0.85rem' }}
                      />
                      <button className="btn btn-secondary" onClick={() => registrarAbono(cuenta.id, cuenta.saldo_pendiente)} style={{ padding: '0.4rem 0.8rem' }} title="Registrar abono">
                        <CheckCircle size={16} color="var(--success)" />
                      </button>
                      <button className="btn" style={{ backgroundColor: '#25D366', color: 'white', padding: '0.4rem 0.8rem' }} onClick={() => enviarWhatsApp(cuenta)} title="Enviar a WhatsApp">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {clientesConDeuda.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No hay saldos pendientes por mostrar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
