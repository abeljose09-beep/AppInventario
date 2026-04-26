const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Todas las rutas de inventario requieren estar autenticado
router.use(verificarToken);

// Obtener inventario (permitido para Admin, Bodeguero, Cajero, Auditor)
router.get('/productos', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR', 'CAJERO', 'BODEGUERO', 'AUDITOR']), inventoryController.obtenerProductos);

// Crear producto nuevo (permitido solo para Admin y Bodeguero)
router.post('/productos', verificarRol(['SUPERUSUARIO', 'ADMINISTRADOR', 'BODEGUERO']), inventoryController.crearProducto);

module.exports = router;
