// routes/clases.js — Endpoints del recurso clases (montados en /api/classes)
//
// Todas las consultas van con parámetros (?): el dato del cliente nunca se pega al SQL.
// Control de acceso:
//   - admin: acceso total sobre todas las clases
//   - profesor: crea, consulta, modifica y borra sus propias clases
//   - alumno: solo consulta las clases en las que está inscrito (403 al escribir, 404 en clases ajenas)

const express = require('express');
const { db } = require('../datos');
const { usuarioActual, soloRoles } = require('../middlewares/auth');
const { validarClase } = require('../validaciones/clases');
const { error } = require('../utils/error');

const router = express.Router();

const sql = {
  listarTodas:         db.prepare('SELECT id, nombre, codigo, cupo, profesor_id FROM clases ORDER BY id'),
  listarPorProfesor:   db.prepare('SELECT id, nombre, codigo, cupo, profesor_id FROM clases WHERE profesor_id = ? ORDER BY id'),
  listarPorAlumno:     db.prepare(`
    SELECT c.id, c.nombre, c.codigo, c.cupo, c.profesor_id
    FROM clases c
    INNER JOIN inscripciones i ON i.clase_id = c.id
    WHERE i.usuario = ?
    ORDER BY c.id
  `),
  consultar:           db.prepare('SELECT id, nombre, codigo, cupo, profesor_id FROM clases WHERE id = ?'),
  consultarProfesor:   db.prepare('SELECT id, nombre, codigo, cupo, profesor_id FROM clases WHERE id = ? AND profesor_id = ?'),
  consultarAlumno:     db.prepare(`
    SELECT c.id, c.nombre, c.codigo, c.cupo, c.profesor_id
    FROM clases c
    INNER JOIN inscripciones i ON i.clase_id = c.id
    WHERE c.id = ? AND i.usuario = ?
  `),
  alumnosDeClase:      db.prepare(`
    SELECT u.id, u.usuario, u.nombre, i.fecha AS fecha_inscripcion
    FROM inscripciones i
    INNER JOIN usuarios u ON u.usuario = i.usuario
    WHERE i.clase_id = ?
    ORDER BY i.id
  `),
  repetido:            db.prepare('SELECT 1 FROM clases WHERE codigo = ? AND id <> ?'),
  crear:               db.prepare('INSERT INTO clases (nombre, codigo, cupo, profesor_id) VALUES (?, ?, ?, ?)'),
  reemplazar:          db.prepare('UPDATE clases SET nombre = ?, codigo = ?, cupo = ?, profesor_id = ? WHERE id = ?'),
  borrar:              db.prepare('DELETE FROM clases WHERE id = ?'),
  borrarProfesor:      db.prepare('DELETE FROM clases WHERE id = ? AND profesor_id = ?'),
};

const parsearId = (raw) => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const codigoRepetido = (codigo, excepto = 0) => !!sql.repetido.get(codigo, excepto);

// Todas las rutas de /api/classes requieren sesión válida
router.use(usuarioActual);

// GET /api/classes — listar clases visibles según el rol → 200
router.get('/', (req, res) => {
  if (req.yo.rol === 'admin') {
    return res.json(sql.listarTodas.all());
  }
  if (req.yo.rol === 'profesor') {
    if (!req.yo.profesor_id) return res.json([]);
    return res.json(sql.listarPorProfesor.all(req.yo.profesor_id));
  }
  return res.json(sql.listarPorAlumno.all(req.yo.usuario));
});

// GET /api/classes/:id — consultar una clase (alumno solo si está inscrito) → 200 · 404 si no existe o es ajena
router.get('/:id', (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return error(res, 404, `No existe la clase ${req.params.id}`);

  let clase;
  if (req.yo.rol === 'admin') {
    clase = sql.consultar.get(id);
  } else if (req.yo.rol === 'profesor') {
    clase = req.yo.profesor_id ? sql.consultarProfesor.get(id, req.yo.profesor_id) : null;
  } else {
    clase = sql.consultarAlumno.get(id, req.yo.usuario);
  }

  if (!clase) return error(res, 404, `No existe la clase ${req.params.id}`);
  res.json(clase);
});

// GET /api/classes/:id/students — consultar alumnos inscritos (solo admin o profesor dueño) → 200
router.get('/:id/students', soloRoles('admin', 'profesor'), (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return error(res, 404, `No existe la clase ${req.params.id}`);

  const clase = req.yo.rol === 'admin'
    ? sql.consultar.get(id)
    : (req.yo.profesor_id ? sql.consultarProfesor.get(id, req.yo.profesor_id) : null);

  if (!clase) return error(res, 404, `No existe la clase ${req.params.id}`);
  res.json(sql.alumnosDeClase.all(id));
});

// POST /api/classes — crear una clase (solo admin o profesor) → 201
router.post('/', soloRoles('admin', 'profesor'), (req, res) => {
  const datos = { ...(req.body || {}) };
  if (req.yo.rol === 'profesor') {
    if (!req.yo.profesor_id) {
      return error(res, 403, 'Tu perfil de profesor no está vinculado para crear clases');
    }
    datos.profesor_id = req.yo.profesor_id;
  }

  const detalles = validarClase(datos);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (codigoRepetido(datos.codigo)) return error(res, 409, `Ya existe una clase con el código ${datos.codigo}`);

  const r = sql.crear.run(datos.nombre.trim(), datos.codigo, datos.cupo, datos.profesor_id);
  const clase = sql.consultar.get(r.lastInsertRowid);
  res.status(201).location(`/api/classes/${clase.id}`).json(clase);
});

// PUT /api/classes/:id — reemplazar la clase completa (solo admin o profesor dueño) → 200
router.put('/:id', soloRoles('admin', 'profesor'), (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return error(res, 404, `No existe la clase ${req.params.id}`);

  const actual = req.yo.rol === 'admin'
    ? sql.consultar.get(id)
    : (req.yo.profesor_id ? sql.consultarProfesor.get(id, req.yo.profesor_id) : null);

  if (!actual) return error(res, 404, `No existe la clase ${req.params.id}`);

  const datos = { ...(req.body || {}) };
  if (req.yo.rol === 'profesor') {
    datos.profesor_id = req.yo.profesor_id;
  }

  const detalles = validarClase(datos);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (codigoRepetido(datos.codigo, actual.id)) return error(res, 409, `Ya existe una clase con el código ${datos.codigo}`);

  sql.reemplazar.run(datos.nombre.trim(), datos.codigo, datos.cupo, datos.profesor_id, actual.id);
  res.json(sql.consultar.get(actual.id));
});

// DELETE /api/classes/:id — borrar la clase (solo admin o profesor dueño; alumno -> 403) → 204
router.delete('/:id', soloRoles('admin', 'profesor'), (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return error(res, 404, `No existe la clase ${req.params.id}`);

  let r;
  if (req.yo.rol === 'admin') {
    r = sql.borrar.run(id);
  } else {
    if (!req.yo.profesor_id) return error(res, 404, `No existe la clase ${req.params.id}`);
    r = sql.borrarProfesor.run(id, req.yo.profesor_id);
  }

  if (r.changes === 0) return error(res, 404, `No existe la clase ${req.params.id}`);
  res.status(204).end();
});

module.exports = router;
