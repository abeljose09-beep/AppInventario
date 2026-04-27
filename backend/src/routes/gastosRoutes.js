const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Obtener todos los gastos
router.get('/', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snap = await db.collection('gastos').where('empresa_id', '==', empresa_id).get();
    const gastos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(gastos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener gastos' });
  }
});

// Crear gasto
router.post('/', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), async (req, res) => {
  try {
    const { empresa_id, id: usuario_id } = req.usuario;
    const { concepto, categoria, monto, metodo_pago, notas } = req.body;
    if (!concepto || !monto || monto <= 0)
      return res.status(400).json({ message: 'Datos incompletos' });

    const ref = await db.collection('gastos').add({
      empresa_id, usuario_id, concepto,
      categoria: categoria || 'GENERAL',
      monto: Number(monto),
      metodo_pago: metodo_pago || 'EFECTIVO',
      notas: notas || '',
      fecha: new Date().toISOString()
    });
    res.status(201).json({ id: ref.id, message: 'Gasto registrado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar gasto' });
  }
});

// Eliminar gasto
router.delete('/:id', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), async (req, res) => {
  try {
    await db.collection('gastos').doc(req.params.id).delete();
    res.json({ message: 'Gasto eliminado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar gasto' });
  }
});

module.exports = router;
