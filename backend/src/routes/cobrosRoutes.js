const express = require('express');
const router = express.Router();
const cobrosController = require('../controllers/cobrosController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Listar cuentas por cobrar (Solo Admin y Superusuario)
router.get('/pendientes', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), cobrosController.obtenerCuentasPendientes);

// Registrar pago parcial o total a una cuenta
router.post('/:compra_id/abono', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR']), cobrosController.registrarAbono);

module.exports = router;
