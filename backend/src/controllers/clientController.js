const { db } = require('../config/firebase');

exports.obtenerClientes = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const snapshot = await db.collection('clientes')
                             .where('empresa_id', '==', empresa_id)
                             .get();
    
    // Sort in memory to avoid needing composite indexes in Firestore
    const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    clientes.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));
    
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes Firebase:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.crearCliente = async (req, res) => {
  try {
    const { empresa_id } = req.usuario;
    const data = req.body;
    
    // Validar si existe documento_identidad (si es único)
    if (data.documento_identidad) {
        const exist = await db.collection('clientes')
                              .where('empresa_id', '==', empresa_id)
                              .where('documento_identidad', '==', data.documento_identidad)
                              .get();
        if (!exist.empty) {
            return res.status(400).json({ message: 'El documento de identidad ya está registrado' });
        }
    }

    const nuevoCliente = {
      empresa_id,
      nombre_completo: data.nombre_completo,
      documento_identidad: data.documento_identidad || '',
      telefono: data.telefono || '',
      correo: data.correo || '',
      direccion_entrega: data.direccion_entrega || '',
      tipo_cliente: data.tipo_cliente || 'REGULAR',
      cupo_credito: data.cupo_credito || 0,
      estado: 'ACTIVO',
      fecha_registro: new Date().toISOString()
    };

    const docRef = await db.collection('clientes').add(nuevoCliente);
    res.status(201).json({ id: docRef.id, ...nuevoCliente });
  } catch (error) {
    console.error('Error al crear cliente Firebase:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
