const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ya no usamos SQLite (db.js), ahora todo es Firebase en los controladores.

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://app-inventario-version.vercel.app'],
  credentials: true
}));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba para verificar que el Backend está vivo
app.get('/', (req, res) => {
  res.json({ status: 'Backend de Inventario corriendo en Firebase Mode 🚀' });
});

// Rutas API
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const clientRoutes = require('./routes/clientRoutes');
const salesRoutes = require('./routes/salesRoutes');
const cobrosRoutes = require('./routes/cobrosRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const proveedoresRoutes = require('./routes/proveedoresRoutes');
const gastosRoutes = require('./routes/gastosRoutes');
const cajaRoutes = require('./routes/cajaRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/inventario', inventoryRoutes);
app.use('/api/ventas', salesRoutes);
app.use('/api/cobros', cobrosRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/caja', cajaRoutes);

// Manejo de errores básicos
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal en el servidor!' });
});

// Configuración Dual: Local y Vercel Serverless
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT} (Firebase Mode)`);
  });
}

// Exportar la aplicación para Vercel Serverless Functions
module.exports = app;
