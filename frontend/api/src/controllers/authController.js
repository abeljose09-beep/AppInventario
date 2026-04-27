const { db } = require('../config/firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const usersRef = db.collection('usuarios');
    const snapshot = await usersRef.where('correo', '==', correo).get();
    
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const userDoc = snapshot.docs[0];
    const usuario = userDoc.data();
    usuario.id = userDoc.id;

    if (usuario.estado !== 'ACTIVO') {
      return res.status(403).json({ message: 'Usuario inactivo o suspendido' });
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Actualizar último acceso (sin esperar)
    userDoc.ref.update({ ultimo_acceso: new Date().toISOString() });

    const token = jwt.sign(
      { id: usuario.id, empresa_id: usuario.empresa_id, rol: usuario.rol },
      process.env.JWT_SECRET || 'mi_secreto_super_seguro_para_jwt',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.rol,
        empresa_id: usuario.empresa_id
      }
    });
  } catch (error) {
    console.error('Error en login Firebase:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
