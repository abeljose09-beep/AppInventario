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

    // Traer todas las compras de la empresa
    const allComprasSnapshot = await db.collection('compras')
      .where('empresa_id', '==', empresa_id)
      .get();

    // Mapa de precio_costo por producto
    const productosMap = {};
    const productosSnap2 = await db.collection('productos').where('empresa_id', '==', empresa_id).get();
    productosSnap2.forEach(d => { productosMap[d.id] = Number(d.data().precio_costo) || 0; });

    let totalVentasHoy = 0;
    let costoVentasHoy = 0;
    let totalPendiente = 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    const last7Days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mi\u00e9', 'Jue', 'Vie', 'S\u00e1b'];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({ date: d.toISOString().split('T')[0], name: dayNames[d.getDay()], ventas: 0 });
    }

    for (const doc of allComprasSnapshot.docs) {
      const data = doc.data();
      
      if (data.fecha_compra >= todayISO) {
        totalVentasHoy += Number(data.total) || 0;
        // Calcular costo de las ventas de hoy usando los detalles
        const detallesSnap = await doc.ref.collection('detalles').get();
        detallesSnap.forEach(d => {
          const det = d.data();
          const costo = productosMap[det.producto_id] || 0;
          costoVentasHoy += costo * Number(det.cantidad);
        });
      }

      if (data.fecha_compra >= sevenDaysAgoISO) {
        const dateStr = data.fecha_compra.split('T')[0];
        const dayIndex = last7Days.findIndex(d => d.date === dateStr);
        if (dayIndex !== -1) last7Days[dayIndex].ventas += Number(data.total) || 0;
      }

      if (data.estado === 'PENDIENTE' || data.estado === 'ABONADA') {
        const pagosSnap = await doc.ref.collection('pagos').get();
        let pagado = 0;
        pagosSnap.forEach(p => pagado += Number(p.data().monto));
        totalPendiente += (Number(data.total) - pagado);
      }
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
    
    // Gastos del mes actual
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0,0,0,0);
    const primerDiaMesISO = primerDiaMes.toISOString();
    const gastosSnap = await db.collection('gastos').where('empresa_id', '==', empresa_id).get();
    let gastosMes = 0;
    gastosSnap.forEach(d => {
      if (d.data().fecha >= primerDiaMesISO) gastosMes += Number(d.data().monto) || 0;
    });
    
    res.json({
      ventasHoy: totalVentasHoy,
      costoVentasHoy,
      gananciaBrutaHoy: totalVentasHoy - costoVentasHoy,
      cuentasCobrar: totalPendiente,
      productosActivos: totalProductos,
      totalClientes: totalClientes,
      gastosMes,
      chartData: last7Days
    });
  } catch (error) {
    console.error('Error obteniendo estadisticas:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
});

module.exports = router;
