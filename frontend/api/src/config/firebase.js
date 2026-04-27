const admin = require('firebase-admin');

// Intentar cargar desde variable de entorno (para Vercel) o desde archivo local
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('./firebaseServiceAccount.json');
  }
} catch (e) {
  console.error("Error cargando credenciales de Firebase:", e.message);
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Ignorar valores undefined para compatibilidad
db.settings({ ignoreUndefinedProperties: true });

module.exports = { db, admin };
