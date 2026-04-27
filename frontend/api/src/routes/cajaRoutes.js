const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);
router.use(verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']));

// Obtener estado de caja actual
router.get('/estado', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snap = await db.collection('turnos_caja')
      .where('empresa_id', '==', empresa_id)
      .where('estado', '==', 'ABIERTO')
      .get();
    if (snap.empty) return res.json({ abierto: false });
    const turno = { id: snap.docs[0].id, ...snap.docs[0].data() };
    res.json({ abierto: true, turno });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener estado de caja' });
  }
});

// Abrir caja
router.post('/abrir', async (req, res) => {
  try {
    const { empresa_id, id: usuario_id, nombre } = req.usuario;
    const { monto_inicial } = req.body;
    const ref = await db.collection('turnos_caja').add({
      empresa_id, usuario_id, usuario_nombre: nombre || 'Admin',
      monto_inicial: Number(monto_inicial) || 0,
      estado: 'ABIERTO',
      fecha_apertura: new Date().toISOString(),
      fecha_cierre: null,
      monto_final_declarado: null,
      diferencia: null
    });
    res.status(201).json({ id: ref.id, message: 'Caja abierta' });
  } catch (err) {
    res.status(500).json({ message: 'Error al abrir caja' });
  }
});

// Cerrar caja
router.post('/cerrar', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const { turno_id, monto_declarado } = req.body;

    const snap = await db.collection('turnos_caja')
      .where('empresa_id', '==', empresa_id)
      .where('estado', '==', 'ABIERTO')
      .get();
    if (snap.empty) return res.status(404).json({ message: 'No hay caja abierta' });

    const turnoRef = snap.docs[0].ref;
    const turnoData = snap.docs[0].data();

    // Traer todas las compras de la empresa y filtrar en memoria (evita índice compuesto)
    const ventasSnap = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .get();
    let totalVentas = 0;
    ventasSnap.forEach(d => {
      const data = d.data();
      if (data.fecha_compra >= turnoData.fecha_apertura) {
        totalVentas += Number(data.total) || 0;
      }
    });

    const esperado = (turnoData.monto_inicial || 0) + totalVentas;
    const diferencia = Number(monto_declarado) - esperado;

    await turnoRef.update({
      estado: 'CERRADO',
      fecha_cierre: new Date().toISOString(),
      monto_final_declarado: Number(monto_declarado),
      total_ventas_turno: totalVentas,
      monto_esperado: esperado,
      diferencia
    });

    res.json({ message: 'Caja cerrada', diferencia, total_ventas_turno: totalVentas, monto_esperado: esperado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al cerrar caja' });
  }
});

// Historial de turnos
router.get('/historial', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snap = await db.collection('turnos_caja')
      .where('empresa_id', '==', empresa_id)
      .where('estado', '==', 'CERRADO')
      .get();
    const turnos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    turnos.sort((a, b) => new Date(b.fecha_apertura) - new Date(a.fecha_apertura));
    res.json(turnos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener historial de caja' });
  }
});

module.exports = router;
