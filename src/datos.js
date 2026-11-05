// datos.js — la base de datos SQLite (sesión 3: los datos ya sobreviven a un reinicio)
//
// node:sqlite viene incluido en Node 22.5+: no hay que instalar nada más.
// Regla: TODA consulta que lleve un dato del cliente va con parámetros (?), nunca pegando texto.

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, '..', 'registro.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS profesores (
    id     INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clases (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    codigo      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    cupo        INTEGER NOT NULL,
    profesor_id INTEGER NOT NULL REFERENCES profesores(id)
  );
`);

const sembrar = db.prepare('INSERT OR IGNORE INTO profesores (id, nombre) VALUES (?, ?)');
sembrar.run(1, 'Ricardo Jaramillo Velasco');
sembrar.run(2, 'Arturo García Nevares');

module.exports = { db };
