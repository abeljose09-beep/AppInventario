const { db } = require('./firebase');
const bcrypt = require('bcrypt');

async function initialize() {
    try {
        const adminSnapshot = await db.collection('usuarios').where('rol', '==', 'SUPERUSUARIO').get();
        if (adminSnapshot.empty) {
            const empresaRef = await db.collection('empresas').add({
                nombre_comercial: 'Empresa Principal',
                razon_social: 'Empresa Firebase S.A.S',
                fecha_creacion: new Date().toISOString()
            });

            const hash = await bcrypt.hash('Admin123!', 10);
            await db.collection('usuarios').add({
                empresa_id: empresaRef.id,
                nombre_completo: 'Super Administrador',
                correo: 'admin@admin.com',
                password_hash: hash,
                rol: 'SUPERUSUARIO',
                estado: 'ACTIVO',
                fecha_creacion: new Date().toISOString()
            });
            console.log('✅ Superusuario admin@admin.com creado en Firebase Firestore');
        } else {
            console.log('✅ Firebase ya tiene el superusuario admin@admin.com');
        }
    } catch (e) {
        console.error('Error inicializando Firebase:', e);
    } finally {
        process.exit(0);
    }
}
initialize();
