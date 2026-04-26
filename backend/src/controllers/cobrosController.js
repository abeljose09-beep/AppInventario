const { db, admin } = require('../config/firebase');

exports.obtenerCuentasPendientes = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snapshot = await db.collection('compras')
                             .where('empresa_id', '==', empresa_id)
                             .where('estado', 'in', ['PENDIENTE', 'ABONADA'])
                             .get();

    const cuentas = [];
    for (const doc of snapshot.docs) {
      const cuentaData = doc.data();
      
      const clienteDoc = await db.collection('clientes').doc(cuentaData.cliente_id).get();
      const clienteData = clienteDoc.exists ? clienteDoc.data() : {};

      const pagosSnapshot = await doc.ref.collection('pagos').get();
      let total_pagado = 0;
      pagosSnapshot.forEach(p => total_pagado += p.data().monto);

      const detallesSnapshot = await doc.ref.collection('detalles').get();
      const detalles = detallesSnapshot.docs.map(d => d.data());

      cuentas.push({
        id: doc.id,
        numero_referencia: cuentaData.numero_referencia,
        total: cuentaData.total,
        estado: cuentaData.estado,
        fecha_compra: cuentaData.fecha_compra,
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

    const compraRef = db.collection('compras').doc(compra_id);

    await db.runTransaction(async (transaction) => {
      const compraDoc = await transaction.get(compraRef);
      if (!compraDoc.exists) throw new Error('Compra no encontrada');
      
      const totalCompra = Number(compraDoc.data().total);

      const pagoRef = compraRef.collection('pagos').doc();
      transaction.set(pagoRef, {
        empresa_id,
        usuario_id,
        monto: Number(monto),
        metodo_pago,
        comprobante_url: comprobante_url || '',
        fecha_pago: new Date().toISOString()
      });

      const pagosSnapshot = await transaction.get(compraRef.collection('pagos'));
      let totalPagado = Number(monto);
      pagosSnapshot.forEach(p => { totalPagado += Number(p.data().monto); });

      let nuevoEstado = 'ABONADA';
      if (totalPagado >= totalCompra) {
        nuevoEstado = 'PAGADA';
      }

      transaction.update(compraRef, { estado: nuevoEstado });
    });

    res.json({ message: 'Abono registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar abono Firebase:', error);
    res.status(500).json({ message: 'Error al registrar abono' });
  }
};
