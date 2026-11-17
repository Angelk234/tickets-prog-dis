// datos.js — la base de datos SQLite (sesión 4: usuarios con hash, roles e inscripciones)
//
// node:sqlite viene incluido en Node 22.5+: no hay que instalar nada más.
// Regla: TODA consulta que lleve un dato del cliente va con parámetros (?), nunca pegando texto.

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, '..', 'registro.db'));

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS _meta (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario    TEXT NOT NULL UNIQUE COLLATE NOCASE,
    nombre     TEXT NOT NULL,
    clave_hash TEXT NOT NULL,
    rol        TEXT NOT NULL CHECK (rol IN ('admin', 'profesor', 'alumno'))
  );

  CREATE TABLE IF NOT EXISTS profesores (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre  TEXT NOT NULL,
    usuario TEXT UNIQUE REFERENCES usuarios(usuario)
  );

  CREATE TABLE IF NOT EXISTS clases (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    codigo      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    cupo        INTEGER NOT NULL,
    profesor_id INTEGER NOT NULL REFERENCES profesores(id)
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario  TEXT    NOT NULL REFERENCES usuarios(usuario) ON DELETE CASCADE,
    clase_id INTEGER NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
    fecha    TEXT    NOT NULL,
    UNIQUE(usuario, clase_id)
  );
`);

// Migración segura en caso de existir un registro.db previo sin la columna usuario en profesores
const colsProf = db.prepare('PRAGMA table_info(profesores)').all();
if (!colsProf.some(c => c.name === 'usuario')) {
  db.exec('ALTER TABLE profesores ADD COLUMN usuario TEXT;');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_profesores_usuario ON profesores(usuario);');
}

function sembrarUsuario(usuario, nombre, clave, rol) {
  const existe = db.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').get(usuario);
  if (!existe) {
    const hash = bcrypt.hashSync(clave, 12);
    db.prepare('INSERT INTO usuarios (usuario, nombre, clave_hash, rol) VALUES (?, ?, ?, ?)')
      .run(usuario, nombre, hash, rol);
  }
}

// 4 usuarios de prueba: 1 admin, 1 profesor y 2 alumnos
sembrarUsuario('admin', 'Administrador del Sistema', 'admin123',  'admin');
sembrarUsuario('profe', 'Ricardo Jaramillo Velasco', 'profe123',  'profesor');
sembrarUsuario('ana',   'Ana López',                 'ana12345',  'alumno');
sembrarUsuario('beto',  'Beto García',               'beto12345', 'alumno');

// Profesores base vinculados
db.prepare('INSERT OR IGNORE INTO profesores (id, nombre, usuario) VALUES (?, ?, ?)')
  .run(1, 'Ricardo Jaramillo Velasco', 'profe');
db.prepare('UPDATE profesores SET usuario = ? WHERE id = ? AND usuario IS NULL')
  .run('profe', 1);
db.prepare('INSERT OR IGNORE INTO profesores (id, nombre, usuario) VALUES (?, ?, ?)')
  .run(2, 'Arturo García Nevares', null);

// Sembrar 2 clases iniciales y 2 inscripciones (ana en clase 1, beto en clase 2) una sola vez
const yaSembrado = db.prepare('SELECT valor FROM _meta WHERE clave = ?').get('seed_u3s4_v1');
if (!yaSembrado) {
  const insClase = db.prepare('INSERT OR IGNORE INTO clases (nombre, codigo, cupo, profesor_id) VALUES (?, ?, ?, ?)');
  insClase.run('Redes y Sistemas Distribuidos', 'PRG101', 30, 1);
  insClase.run('Sistemas Operativos',           'SIS202', 25, 1);

  const c1 = db.prepare('SELECT id FROM clases WHERE codigo = ?').get('PRG101');
  const c2 = db.prepare('SELECT id FROM clases WHERE codigo = ?').get('SIS202');
  const ahora = new Date().toISOString();
  const insInsc = db.prepare('INSERT OR IGNORE INTO inscripciones (usuario, clase_id, fecha) VALUES (?, ?, ?)');
  if (c1) insInsc.run('ana', c1.id, ahora);
  if (c2) insInsc.run('beto', c2.id, ahora);

  db.prepare('INSERT INTO _meta (clave, valor) VALUES (?, ?)').run('seed_u3s4_v1', '1');
}

module.exports = { db };
