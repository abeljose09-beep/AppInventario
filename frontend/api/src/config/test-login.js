const { db } = require('./firebase');
const bcrypt = require('bcrypt');

async function test() {
  const correo = 'admin@admin.com';
  const password = 'Admin123!';
  
  const snapshot = await db.collection('usuarios').where('correo', '==', correo).get();
  if (snapshot.empty) {
    console.log('Usuario no encontrado en Firestore');
    return;
  }
  
  const usuario = snapshot.docs[0].data();
  console.log('Usuario encontrado:', usuario.correo);
  
  const match = await bcrypt.compare(password, usuario.password_hash);
  console.log('Password match:', match);
}

test();
