const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const db = require('./config/db'); // Inicializar base de datos

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const clientRoutes = require('./routes/clientRoutes');
const salesRoutes = require('./routes/salesRoutes');
const cobrosRoutes = require('./routes/cobrosRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/inventario', inventoryRoutes);
app.use('/api/ventas', salesRoutes);
app.use('/api/cobros', cobrosRoutes);
app.use('/api/clientes', clientRoutes);

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
