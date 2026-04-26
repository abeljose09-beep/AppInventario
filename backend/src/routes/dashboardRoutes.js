const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ventas de Hoy
    const ventasSnapshot = await db.collection('ventas')
      .where('fecha', '>=', today)
      .get();
    
    let totalVentasHoy = 0;
    ventasSnapshot.forEach(doc => {
      totalVentasHoy += doc.data().total || 0;
    });

    // 2. Cuentas por Cobrar (Saldo Pendiente Total)
    const cobrosSnapshot = await db.collection('cuentas_cobro')
      .where('estado', '!=', 'PAGADA')
      .get();
    
    let totalPendiente = 0;
    cobrosSnapshot.forEach(doc => {
      totalPendiente += doc.data().saldo_pendiente || 0;
    });

    // 3. Productos Activos
    const productosSnapshot = await db.collection('productos')
      .where('estado', '==', 'ACTIVO')
      .get();
    const totalProductos = productosSnapshot.size;

    // 4. Total Clientes
    const clientesSnapshot = await db.collection('clientes').get();
    const totalClientes = clientesSnapshot.size;

    res.json({
      ventasHoy: totalVentasHoy,
      cuentasCobrar: totalPendiente,
      productosActivos: totalProductos,
      totalClientes: totalClientes
    });
  } catch (error) {
    console.error('Error obteniendo estadisticas:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
});

module.exports = router;
