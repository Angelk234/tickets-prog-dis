// routes/usuarios.js — Gestión y alta de usuarios, profesores y alumnos
//
// Reglas de rol:
//   - admin: puede listar usuarios/profesores/alumnos y dar de alta cualquier rol
//   - profesor: puede listar profesores/alumnos, dar de alta alumnos o dar de alta más profesores (403 si intenta crear admin)
//   - alumno: sin acceso a listar usuarios ni crear cuentas (403)

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../datos');
const { usuarioActual, soloRoles } = require('../middlewares/auth');
const { error } = require('../utils/error');

const router = express.Router();

const ROLES_VALIDOS = ['admin', 'profesor', 'alumno'];

const sql = {
  listarUsuarios:   db.prepare('SELECT id, usuario, nombre, rol FROM usuarios ORDER BY id'),
  listarPorRol:     db.prepare('SELECT id, usuario, nombre, rol FROM usuarios WHERE rol = ? ORDER BY id'),
  listarProfesores: db.prepare('SELECT id, nombre, usuario FROM profesores ORDER BY id'),
  existeUsuario:    db.prepare('SELECT 1 FROM usuarios WHERE usuario = ?'),
  crearUsuario:     db.prepare('INSERT INTO usuarios (usuario, nombre, clave_hash, rol) VALUES (?, ?, ?, ?)'),
  crearProfesor:    db.prepare('INSERT INTO profesores (nombre, usuario) VALUES (?, ?)'),
  consultarUsuario: db.prepare('SELECT id, usuario, nombre, rol FROM usuarios WHERE id = ?'),
};

function validarUsuario(datos, rolFijo = null) {
  const detalles = [];
  const usuario = typeof datos.usuario === 'string' ? datos.usuario.trim() : '';
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const clave = typeof datos.clave === 'string' ? datos.clave : '';
  const rol = rolFijo ?? datos.rol;

  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(usuario)) {
    detalles.push('usuario: obligatorio, 3 a 30 caracteres alfanuméricos, ".", "_" o "-"');
  }
  if (nombre.length < 3 || nombre.length > 80) {
    detalles.push('nombre: obligatorio, de 3 a 80 caracteres');
  }
  if (clave.length < 6 || clave.length > 72) {
    detalles.push('clave: obligatoria, de 6 a 72 caracteres');
  }
  if (!ROLES_VALIDOS.includes(rol)) {
    detalles.push(`rol: debe ser uno de ${ROLES_VALIDOS.join(', ')}`);
  }

  return { detalles, usuario, nombre, clave, rol };
}

function crearUsuarioEnBD(res, rutaBase, datos, rolFijo = null) {
  const { detalles, usuario, nombre, clave, rol } = validarUsuario(datos, rolFijo);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (sql.existeUsuario.get(usuario)) return error(res, 409, `Ya existe el usuario ${usuario}`);

  const hash = bcrypt.hashSync(clave, 12);
  let userId;
  let profesorId = null;

  db.exec('BEGIN');
  try {
    const rUser = sql.crearUsuario.run(usuario, nombre, hash, rol);
    userId = rUser.lastInsertRowid;
    if (rol === 'profesor') {
      const rProf = sql.crearProfesor.run(nombre, usuario);
      profesorId = Number(rProf.lastInsertRowid);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const creado = sql.consultarUsuario.get(userId);
  if (profesorId !== null) creado.profesor_id = profesorId;
  return res.status(201).location(`${rutaBase}/${creado.id}`).json(creado);
}

// GET /api/usuarios — listar todos los usuarios (solo admin)
router.get('/usuarios', usuarioActual, soloRoles('admin'), (req, res) => {
  res.json(sql.listarUsuarios.all());
});

// POST /api/usuarios — crear usuario (admin: cualquier rol; profesor: solo profesores)
router.post('/usuarios', usuarioActual, soloRoles('admin', 'profesor'), (req, res) => {
  const datos = req.body || {};
  if (req.yo.rol === 'profesor' && datos.rol !== 'profesor') {
    return error(res, 403, 'Tu rol solo puede dar de alta a otros profesores');
  }
  return crearUsuarioEnBD(res, '/api/usuarios', datos);
});

// GET /api/teachers — listar profesores (admin o profesor)
router.get('/teachers', usuarioActual, soloRoles('admin', 'profesor'), (req, res) => {
  res.json(sql.listarProfesores.all());
});

// POST /api/teachers — dar de alta un nuevo profesor (admin o profesor)
router.post('/teachers', usuarioActual, soloRoles('admin', 'profesor'), (req, res) => {
  return crearUsuarioEnBD(res, '/api/teachers', req.body || {}, 'profesor');
});

// GET /api/students — listar alumnos registrados (admin o profesor)
router.get('/students', usuarioActual, soloRoles('admin', 'profesor'), (req, res) => {
  res.json(sql.listarPorRol.all('alumno'));
});

// POST /api/students — alta de nuevo alumno (solo admin o profesor; rol siempre forzado a 'alumno')
router.post('/students', usuarioActual, soloRoles('admin', 'profesor'), (req, res) => {
  return crearUsuarioEnBD(res, '/api/students', req.body || {}, 'alumno');
});

module.exports = router;

