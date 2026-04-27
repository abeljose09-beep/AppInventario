const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/stats', async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 1. Ventas de Hoy
    const ventasSnapshot = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .where('fecha_compra', '>=', todayISO)
      .get();
    
    let totalVentasHoy = 0;
    ventasSnapshot.forEach(doc => {
      totalVentasHoy += Number(doc.data().total) || 0;
    });

    // 2. Cuentas por Cobrar (Saldo Pendiente Total)
    const cobrosSnapshot = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .where('estado', 'in', ['PENDIENTE', 'ABONADA'])
      .get();
    
    let totalPendiente = 0;
    for (const doc of cobrosSnapshot.docs) {
       const pagosSnap = await doc.ref.collection('pagos').get();
       let pagado = 0;
       pagosSnap.forEach(p => pagado += Number(p.data().monto));
       totalPendiente += (Number(doc.data().total) - pagado);
    }

    // 3. Productos Activos
    const productosSnapshot = await db.collection('productos')
      .where('empresa_id', '==', empresa_id)
      .where('estado', '==', 'ACTIVO')
      .get();
    const totalProductos = productosSnapshot.size;

    // 4. Total Clientes
    const clientesSnapshot = await db.collection('clientes')
      .where('empresa_id', '==', empresa_id)
      .get();
    const totalClientes = clientesSnapshot.size;

    // 5. Datos para el gráfico (Últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const chartSnapshot = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .where('fecha_compra', '>=', sevenDaysAgoISO)
      .get();
    
    // Inicializar array de 7 días
    const last7Days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({ 
        date: d.toISOString().split('T')[0], 
        name: dayNames[d.getDay()], 
        ventas: 0 
      });
    }

    chartSnapshot.forEach(doc => {
      const data = doc.data();
      const dateStr = data.fecha_compra.split('T')[0];
      const dayIndex = last7Days.findIndex(d => d.date === dateStr);
      if (dayIndex !== -1) {
        last7Days[dayIndex].ventas += Number(data.total);
      }
    });

    res.json({
      ventasHoy: totalVentasHoy,
      cuentasCobrar: totalPendiente,
      productosActivos: totalProductos,
      totalClientes: totalClientes,
      chartData: last7Days
    });
  } catch (error) {
    console.error('Error obteniendo estadisticas:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
});

module.exports = router;
