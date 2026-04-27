const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo base de datos SQLite', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
    // Habilitar soporte para Foreign Keys en SQLite
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Wrapper para simular la API de pg (PostgreSQL) usando SQLite
// Esto evita tener que modificar todos los controladores
const poolWrapper = {
  query: (text, params) => {
    return new Promise((resolve, reject) => {
      let sqliteText = text;
      let safeParams = [];
      
      if (params && params.length > 0) {
        // Convertir undefined a null para evitar SQLITE_MISUSE
        safeParams = params.map(p => p === undefined ? null : p);
        
        for(let i = 1; i <= safeParams.length; i++) {
          sqliteText = sqliteText.replace(new RegExp(`\\$${i}\\b`, 'g'), '?');
        }
      }

      db.all(sqliteText, safeParams, function(err, rows) {
        if (err) return reject(err);
        resolve({ rows: rows || [] });
      });
    });
  },
  
  // Wrapper simulado para transacciones
  connect: async () => {
    return {
      query: poolWrapper.query,
      release: () => {} // No-op en SQLite
    };
  },
  
  end: () => {
    db.close();
  }
};

module.exports = { pool: poolWrapper, rawDb: db };
