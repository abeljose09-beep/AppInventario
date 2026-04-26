const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Listar clientes (Admin, Cajero, Auditor)
router.get('/', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR', 'CAJERO', 'AUDITOR']), clientController.obtenerClientes);

// Crear cliente (Admin, Cajero)
router.post('/', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR', 'CAJERO']), clientController.crearCliente);

module.exports = router;
