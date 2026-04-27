const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// ─── PROVEEDORES ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snap = await db.collection('proveedores').where('empresa_id', '==', empresa_id).get();
    const proveedores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    proveedores.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
});

router.post('/', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const { nombre, nit, telefono, email, direccion } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre obligatorio' });
    const ref = await db.collection('proveedores').add({
      empresa_id, nombre, nit: nit || '', telefono: telefono || '',
      email: email || '', direccion: direccion || '',
      fecha_creacion: new Date().toISOString()
    });
    res.status(201).json({ id: ref.id, nombre });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear proveedor' });
  }
});

router.delete('/:id', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), async (req, res) => {
  try {
    await db.collection('proveedores').doc(req.params.id).delete();
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar proveedor' });
  }
});

// ─── ÓRDENES DE COMPRA ───────────────────────────────────────────────────────
router.get('/ordenes', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snap = await db.collection('ordenes_compra').where('empresa_id', '==', empresa_id).get();
    const ordenes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    ordenes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(ordenes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

router.post('/ordenes', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), async (req, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.usuario;
    const { proveedor_id, proveedor_nombre, items, total, notas } = req.body;
    if (!proveedor_id || !items || items.length === 0)
      return res.status(400).json({ message: 'Datos incompletos' });

    const numero = `OC-${Date.now()}`;

    await db.runTransaction(async (tx) => {
      // ─── 1. TODAS LAS LECTURAS PRIMERO ──────────────────────────────
      const prodRefs = items.map(item => db.collection('productos').doc(item.producto_id));
      const prodDocs = await Promise.all(prodRefs.map(ref => tx.get(ref)));

      // ─── 2. TODAS LAS ESCRITURAS DESPUÉS ────────────────────────────
      const ordenRef = db.collection('ordenes_compra').doc();
      tx.set(ordenRef, {
        empresa_id, usuario_id, proveedor_id, proveedor_nombre,
        numero, items, total: Number(total), notas: notas || '',
        estado: 'RECIBIDA', fecha: new Date().toISOString()
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const prodDoc = prodDocs[i];
        if (prodDoc.exists) {
          const stockActual = Number(prodDoc.data().stock_actual) || 0;
          tx.update(prodRefs[i], { stock_actual: stockActual + Number(item.cantidad) });
          const movRef = db.collection('movimientos_inventario').doc();
          tx.set(movRef, {
            empresa_id, producto_id: item.producto_id, usuario_id,
            tipo_movimiento: 'ENTRADA', cantidad: Number(item.cantidad),
            motivo: `Orden de Compra: ${numero}`, fecha_hora: new Date().toISOString()
          });
        }
      }
    });

    res.status(201).json({ message: 'Orden de compra registrada', numero });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar orden de compra' });
  }
});

module.exports = router;
