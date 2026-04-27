const { db, admin } = require('../config/firebase');

exports.obtenerCuentasPendientes = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    // Sin filtro 'in' compuesto — traer todas las de la empresa y filtrar en memoria
    const snapshot = await db.collection('compras')
                             .where('empresa_id', '==', empresa_id)
                             .get();

    const cuentas = [];
    for (const doc of snapshot.docs) {
      const cuentaData = doc.data();
      // Solo pendientes o abonadas
      if (!['PENDIENTE', 'ABONADA'].includes(cuentaData.estado)) continue;
      
      const clienteDoc = await db.collection('clientes').doc(cuentaData.cliente_id).get();
      const clienteData = clienteDoc.exists ? clienteDoc.data() : {};

      const pagosSnapshot = await doc.ref.collection('pagos').get();
      let total_pagado = 0;
      pagosSnapshot.forEach(p => total_pagado += Number(p.data().monto));

      const detallesSnapshot = await doc.ref.collection('detalles').get();
      const detalles = detallesSnapshot.docs.map(d => d.data());

      cuentas.push({
        id: doc.id,
        numero_referencia: cuentaData.numero_referencia,
        total: cuentaData.total,
        estado: cuentaData.estado,
        fecha_compra: cuentaData.fecha_compra,
        cliente_id: cuentaData.cliente_id,
        cliente_nombre: clienteData.nombre_completo || 'Desconocido',
        cliente_telefono: clienteData.telefono || '',
        total_pagado,
        saldo_pendiente: Number(cuentaData.total) - total_pagado,
        detalles
      });
    }

    cuentas.sort((a, b) => new Date(a.fecha_compra) - new Date(b.fecha_compra));
    res.json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas pendientes Firebase:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.registrarAbono = async (req, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.usuario;
    const { compra_id } = req.params;
    const { monto, metodo_pago, comprobante_url } = req.body;

    if (!monto || Number(monto) <= 0) return res.status(400).json({ message: 'Monto inválido' });

    const compraRef = db.collection('compras').doc(compra_id);

    await db.runTransaction(async (transaction) => {
      // ─── 1. LECTURAS PRIMERO ───────────────────────────────────────────────
      const compraDoc = await transaction.get(compraRef);
      if (!compraDoc.exists) throw new Error('Compra no encontrada');
      const pagosSnapshot = await transaction.get(compraRef.collection('pagos'));

      // ─── 2. CALCULAR ESTADO ────────────────────────────────────────────────
      const totalCompra = Number(compraDoc.data().total);
      let totalPagado = Number(monto);
      pagosSnapshot.forEach(p => { totalPagado += Number(p.data().monto); });
      const nuevoEstado = totalPagado >= totalCompra ? 'PAGADA' : 'ABONADA';

      // ─── 3. ESCRITURAS ────────────────────────────────────────────────────
      const pagoRef = compraRef.collection('pagos').doc();
      transaction.set(pagoRef, {
        empresa_id, usuario_id, monto: Number(monto),
        metodo_pago: metodo_pago || 'EFECTIVO',
        comprobante_url: comprobante_url || '',
        fecha_pago: new Date().toISOString()
      });
      transaction.update(compraRef, { estado: nuevoEstado });
    });

    res.json({ message: 'Abono registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar abono Firebase:', error);
    res.status(500).json({ message: 'Error al registrar abono' });
  }
};

exports.registrarAbonoGlobal = async (req, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.usuario;
    const { cliente_id, monto, metodo_pago } = req.body;
    let montoRestante = Number(monto);

    if (!cliente_id || montoRestante <= 0) return res.status(400).json({ message: 'Datos inválidos' });

    // Traer fuera de transacción para evitar índice compuesto
    const snapshot = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .where('cliente_id', '==', cliente_id)
      .get();

    const comprasPendientes = snapshot.docs.filter(d => ['PENDIENTE', 'ABONADA'].includes(d.data().estado));
    if (comprasPendientes.length === 0) return res.status(404).json({ message: 'El cliente no tiene deudas pendientes' });

    // Calcular pagado por cada compra fuera de transacción
    const comprasConPagos = await Promise.all(comprasPendientes.map(async (doc) => {
      const pagosSnap = await doc.ref.collection('pagos').get();
      let pagado = 0;
      pagosSnap.forEach(p => pagado += Number(p.data().monto));
      return { ref: doc.ref, data: doc.data(), pagado };
    }));

    comprasConPagos.sort((a, b) => new Date(a.data.fecha_compra) - new Date(b.data.fecha_compra));

    // Aplicar pagos secuencialmente (una transacción por compra para mantener reads-before-writes)
    for (const compra of comprasConPagos) {
      if (montoRestante <= 0) break;
      const saldoPendiente = Number(compra.data.total) - compra.pagado;
      if (saldoPendiente <= 0) continue;

      const montoAAplicar = Math.min(saldoPendiente, montoRestante);

      await db.runTransaction(async (transaction) => {
        // Lectura
        const compraDoc = await transaction.get(compra.ref);
        const pagosSnap = await transaction.get(compra.ref.collection('pagos'));
        
        let totalPagadoActual = 0;
        pagosSnap.forEach(p => totalPagadoActual += Number(p.data().monto));
        const totalCompra = Number(compraDoc.data().total);
        const nuevoTotalPagado = totalPagadoActual + montoAAplicar;
        const nuevoEstado = nuevoTotalPagado >= totalCompra ? 'PAGADA' : 'ABONADA';

        // Escritura
        const pagoRef = compra.ref.collection('pagos').doc();
        transaction.set(pagoRef, {
          empresa_id, usuario_id,
          monto: montoAAplicar,
          metodo_pago: metodo_pago || 'TRANSFERENCIA',
          comprobante_url: '',
          fecha_pago: new Date().toISOString()
        });
        transaction.update(compra.ref, { estado: nuevoEstado });
      });

      montoRestante -= montoAAplicar;
    }

    res.json({ message: 'Abono global registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar abono global Firebase:', error);
    res.status(500).json({ message: error.message || 'Error al registrar abono global' });
  }
};

exports.crearCuentaCobro = async (req, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.usuario;
    const { cliente_id, monto, concepto } = req.body;
    
    if (!cliente_id || !monto || monto <= 0) {
      return res.status(400).json({ message: 'Datos incompletos o monto inválido' });
    }

    // Leer cliente FUERA de la transacción
    const clienteRef = db.collection('clientes').doc(cliente_id);
    const clienteDoc = await clienteRef.get();
    if (!clienteDoc.exists) return res.status(404).json({ message: 'Cliente no encontrado' });
    
    const cliente_nombre = clienteDoc.data().nombre_completo;
    const numero_referencia = `CXC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const compraRef = db.collection('compras').doc();

    // Transacción solo con escrituras (no hay reads necesarios aquí)
    await db.runTransaction(async (transaction) => {
      transaction.set(compraRef, {
        empresa_id, cliente_id, cliente_nombre, usuario_id, numero_referencia,
        subtotal: Number(monto), impuestos: 0, descuento: 0, total: Number(monto), 
        tipo_pago: 'CREDITO', estado: 'PENDIENTE',
        fecha_compra: new Date().toISOString()
      });

      const detalleRef = compraRef.collection('detalles').doc();
      transaction.set(detalleRef, {
        producto_id: 'GENERICO', cantidad: 1,
        precio_unitario: Number(monto), subtotal: Number(monto),
        nombre: concepto || 'Cuenta de Cobro Manual'
      });
    });

    res.status(201).json({ message: 'Cuenta de cobro creada exitosamente', id: compraRef.id });
  } catch (error) {
    console.error('Error al crear cuenta de cobro:', error);
    res.status(500).json({ message: 'Error interno al crear cuenta' });
  }
};
