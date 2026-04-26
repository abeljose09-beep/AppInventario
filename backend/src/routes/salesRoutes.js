const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Listar ventas (Admin, Auditor)
router.get('/', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR', 'AUDITOR']), salesController.obtenerVentas);

// Registrar una nueva venta/compra (Admin, Cajero)
router.post('/', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR', 'CAJERO']), salesController.crearVenta);

module.exports = router;
