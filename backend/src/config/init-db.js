const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function initializeDatabase() {
  try {
    console.log('Iniciando la creación de tablas en la base de datos SQLite...');
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, { encoding: 'utf-8' });
    
    // Ejecutar queries uno por uno (SQLite driver maneja múltiples queries diferente)
    const statements = sqlQuery.split(';').filter(s => s.trim().length > 0);
    
    for (let statement of statements) {
       await pool.query(statement);
    }
    
    console.log('✅ Tablas creadas exitosamente.');
    
    // Verificar si existe el superusuario
    const superuserCheck = await pool.query("SELECT * FROM usuarios WHERE rol = 'SUPERUSUARIO'");
    
    if (superuserCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('Admin123!', 10);
      
      // Empresa base
      const empresaRes = await pool.query(`
        INSERT INTO empresas (nombre_comercial, razon_social) 
        VALUES ('Empresa Principal', 'Empresa S.A.S') RETURNING id
      `);
      const empresaId = empresaRes.rows[0].id;
      
      // Superusuario
      await pool.query(`
        INSERT INTO usuarios (empresa_id, nombre_completo, correo, password_hash, rol) 
        VALUES (?, 'Super Administrador', 'admin@admin.com', ?, 'SUPERUSUARIO')
      `, [empresaId, hash]);
      
      console.log('✅ Superusuario por defecto creado: admin@admin.com / Admin123!');
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  } finally {
    setTimeout(() => {
        process.exit(0);
    }, 500);
  }
}

initializeDatabase();
