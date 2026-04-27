const { db, admin } = require('../config/firebase');

exports.crearVenta = async (req, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.usuario;
    const { cliente_id, productos, subtotal, impuestos, descuento, total, tipo_pago } = req.body;

    const numero_referencia = `VTA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const estado_compra = tipo_pago === 'CONTADO' ? 'PAGADA' : 'PENDIENTE';
    const fecha_compra = new Date().toISOString();

    const compraRef = db.collection('compras').doc();

    await db.runTransaction(async (transaction) => {
      // 0. Obtener nombre del cliente
      const clienteRef = db.collection('clientes').doc(cliente_id);
      const clienteDoc = await transaction.get(clienteRef);
      if (!clienteDoc.exists) throw new Error("Cliente no encontrado");
      const cliente_nombre = clienteDoc.data().nombre_completo;

      // Validar stock primero
      const productDocs = [];
      for (const item of productos) {
        const prodRef = db.collection('productos').doc(item.producto_id);
        const prodDoc = await transaction.get(prodRef);
        if (!prodDoc.exists) throw new Error(`Producto ${item.producto_id} no encontrado`);
        
        const currentStock = prodDoc.data().stock_actual;
        if (currentStock < item.cantidad) {
          throw new Error(`Stock insuficiente para el producto: ${prodDoc.data().nombre}`);
        }
        productDocs.push({ ref: prodRef, doc: prodDoc, item });
      }

      // 1. Guardar la compra
      const nuevaCompra = {
        empresa_id, cliente_id, cliente_nombre, usuario_id, numero_referencia,
        subtotal, impuestos, descuento, total, tipo_pago, estado: estado_compra,
        fecha_compra
      };
      transaction.set(compraRef, nuevaCompra);

      // 2. Procesar productos y stock
      const detallesList = [];
      for (const { ref, doc, item } of productDocs) {
        const itemSubtotal = item.cantidad * item.precio_unitario;
        const currentStock = doc.data().stock_actual;

        // Descontar inventario
        transaction.update(ref, { stock_actual: currentStock - item.cantidad });

        // Guardar detalle compra
        const detalleRef = compraRef.collection('detalles').doc();
        const detalleData = {
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: itemSubtotal,
          nombre: doc.data().nombre
        };
        transaction.set(detalleRef, detalleData);
        detallesList.push(detalleData);

        // Registrar movimiento
        const movRef = db.collection('movimientos_inventario').doc();
        transaction.set(movRef, {
          empresa_id,
          producto_id: item.producto_id,
          usuario_id,
          tipo_movimiento: 'SALIDA',
          cantidad: item.cantidad,
          motivo: `Venta Ref: ${numero_referencia}`,
          fecha_hora: fecha_compra
        });
      }

      // 3. Pago contado
      if (tipo_pago === 'CONTADO') {
        const pagoRef = compraRef.collection('pagos').doc();
        transaction.set(pagoRef, {
          empresa_id,
          usuario_id,
          monto: total,
          metodo_pago: 'EFECTIVO',
          fecha_pago: fecha_compra
        });
      }
    });

    res.status(201).json({ message: 'Venta registrada exitosamente', compra: { id: compraRef.id, numero_referencia } });
  } catch (error) {
    console.error('Error al crear la venta Firebase:', error);
    res.status(500).json({ message: error.message || 'Error al registrar la venta' });
  }
};

exports.obtenerVentas = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    // Traer ventas ordenadas por fecha descendente (sin index compuesto de Firebase)
    const snapshot = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .get();
    
    const ventas = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Traer detalles (subcoleccion)
      const detallesSnapshot = await doc.ref.collection('detalles').get();
      const detalles = detallesSnapshot.docs.map(d => d.data());
      
      ventas.push({ id: doc.id, ...data, detalles });
    }
    
    // Sort en memoria de más reciente a más antigua
    ventas.sort((a, b) => new Date(b.fecha_compra) - new Date(a.fecha_compra));
    
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
