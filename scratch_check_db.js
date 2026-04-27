const { db } = require('./backend/src/config/firebase');

async function checkData() {
  console.log("--- PRODUCTOS ---");
  const prodSnap = await db.collection('productos').get();
  prodSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Nombre: ${data.nombre} | Empresa: ${data.empresa_id} | Estado: ${data.estado}`);
  });

  console.log("\n--- CLIENTES ---");
  const cliSnap = await db.collection('clientes').get();
  cliSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Nombre: ${data.nombre_completo} | Empresa: ${data.empresa_id}`);
  });

  console.log("\n--- USUARIOS ---");
  const userSnap = await db.collection('usuarios').get();
  userSnap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Email: ${data.correo} | Empresa: ${data.empresa_id}`);
  });
}

checkData().catch(console.error);
