import { useState, useEffect } from 'react';
import { Send, CheckCircle, Search, AlertCircle, DollarSign, Plus, X } from 'lucide-react';
import api from '../api/axios';

export default function Cobros() {
  const [cuentas, setCuentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [abonosInput, setAbonosInput] = useState({}); 
  const [clientes, setClientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState({ cliente_id: '', monto: '', concepto: '' });

  useEffect(() => {
    cargarCuentas();
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  const crearCuentaManual = async (e) => {
    e.preventDefault();
    if (!nuevaCuenta.cliente_id || !nuevaCuenta.monto || Number(nuevaCuenta.monto) <= 0) {
      alert('Completa los campos obligatorios y usa un monto válido.');
      return;
    }
    try {
      await api.post('/cobros/manual', nuevaCuenta);
      alert('Cuenta de cobro creada exitosamente');
      setShowModal(false);
      setNuevaCuenta({ cliente_id: '', monto: '', concepto: '' });
      cargarCuentas();
    } catch (err) {
      console.error(err);
      alert('Hubo un error al crear la cuenta.');
    }
  };

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

  const enviarWhatsAppGrupo = (grupo) => {
    const cuentaConTelefono = grupo.cuentas.find(c => c.cliente_telefono);
    let numero = cuentaConTelefono ? cuentaConTelefono.cliente_telefono : '';
    
    if (numero && !numero.startsWith('+') && numero.length === 10) numero = '57' + numero; 
    
    let mensaje = `Hola ${grupo.nombre},%0A%0ATe saludamos de InvSys.%0AQueremos recordarte que tienes *${grupo.cuentas.length} factura(s) pendiente(s)* con nosotros, sumando una deuda total de *$${grupo.totalDeuda.toFixed(2)}*.%0A%0A*Detalle de cuenta:*%0A`;
    
    grupo.cuentas.forEach(cuenta => {
        mensaje += `- Ref: ${cuenta.numero_referencia} | Saldo: $${cuenta.saldo_pendiente.toFixed(2)}%0A`;
    });
    
    mensaje += `%0APuedes realizar el pago mediante transferencia bancaria. ¡Quedamos atentos a cualquier duda!`;
    
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
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Cartera de Clientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gestiona los saldos pendientes agrupados por cliente.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nueva Cuenta de Cobro
        </button>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'right', flexWrap: 'wrap' }}>
                  <button className="btn" style={{ backgroundColor: '#25D366', color: 'white', padding: '0.6rem 1rem' }} onClick={() => enviarWhatsAppGrupo(grupo)} title="Enviar resumen por WhatsApp">
                    <Send size={18} /> Enviar Resumen
                  </button>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deuda Total</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                      ${grupo.totalDeuda.toFixed(2)}
                    </p>
                  </div>
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
                      <button className="btn btn-secondary" onClick={() => registrarAbono(cuenta.id, cuenta.saldo_pendiente)} style={{ padding: '0.4rem 0.8rem', fontWeight: 'bold', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }} title="Registrar abono">
                        Abonar
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

      {/* Modal Nueva Cuenta de Cobro */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontFamily: "'Outfit', sans-serif" }}>Nueva Cuenta de Cobro</h2>
            
            <form onSubmit={crearCuentaManual}>
              <div className="input-group">
                <label>Cliente *</label>
                <select 
                  className="input-field" 
                  value={nuevaCuenta.cliente_id} 
                  onChange={e => setNuevaCuenta({...nuevaCuenta, cliente_id: e.target.value})}
                  required
                >
                  <option value="">Selecciona un cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre_completo} - {c.documento_identidad}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Monto de la Deuda ($) *</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={nuevaCuenta.monto} 
                  onChange={e => setNuevaCuenta({...nuevaCuenta, monto: e.target.value})}
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label>Concepto (Opcional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: Saldo anterior, Servicio, etc."
                  value={nuevaCuenta.concepto} 
                  onChange={e => setNuevaCuenta({...nuevaCuenta, concepto: e.target.value})}
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.8rem', fontSize: '1.05rem' }}>
                Crear y Sumar a la Deuda
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
