const { db } = require('../config/firebase');

exports.obtenerProductos = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snapshot = await db.collection('productos')
                             .where('empresa_id', '==', empresa_id)
                             .get();
    
    const productos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    productos.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const data = req.body;

    if (data.codigo_barras) {
        const exist = await db.collection('productos')
                              .where('empresa_id', '==', empresa_id)
                              .where('codigo_barras', '==', data.codigo_barras)
                              .get();
        if (!exist.empty) {
            return res.status(400).json({ message: 'El código de barras ya existe' });
        }
    }

    const nuevoProducto = {
      empresa_id,
      codigo_barras: data.codigo_barras || '',
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      categoria: data.categoria || '',
      precio_costo: data.precio_costo,
      precio_venta: data.precio_venta,
      stock_actual: data.stock_actual || 0,
      stock_minimo: data.stock_minimo || 5,
      estado: 'ACTIVO',
      fecha_creacion: new Date().toISOString()
    };

    const docRef = await db.collection('productos').add(nuevoProducto);
    
    // Movimiento inicial
    if (nuevoProducto.stock_actual > 0) {
      await db.collection('movimientos_inventario').add({
        empresa_id,
        producto_id: docRef.id,
        usuario_id: req.usuario.id,
        tipo_movimiento: 'ENTRADA',
        cantidad: nuevoProducto.stock_actual,
        motivo: 'Inventario Inicial',
        fecha_hora: new Date().toISOString()
      });
    }

    res.status(201).json({ id: docRef.id, ...nuevoProducto });
  } catch (error) {
    console.error('Error al crear producto Firebase:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
