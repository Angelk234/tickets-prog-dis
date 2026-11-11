// routes/inscripciones.js — Recurso con dueño (SEC-311) montado en /api/inscripciones
//
// Reglas SEC-311:
//   1. Al crear (POST), el dueño (usuario) siempre se toma del token (req.yo.usuario), nunca del body.
//   2. Al consultar (GET /:id) o borrar (DELETE /:id), el WHERE incluye al dueño; si no coincide, responde 404.

const express = require('express');
const { db } = require('../datos');
const { usuarioActual, soloRoles } = require('../middlewares/auth');
const { error } = require('../utils/error');

const router = express.Router();

const sql = {
  listarTodas: db.prepare(`
    SELECT i.id, i.usuario, i.clase_id, c.codigo, c.nombre AS clase_nombre, i.fecha
    FROM inscripciones i
    INNER JOIN clases c ON c.id = i.clase_id
    ORDER BY i.id
  `),
  listarPorProfesor: db.prepare(`
    SELECT i.id, i.usuario, i.clase_id, c.codigo, c.nombre AS clase_nombre, i.fecha
    FROM inscripciones i
    INNER JOIN clases c ON c.id = i.clase_id
    WHERE c.profesor_id = ?
    ORDER BY i.id
  `),
  listarPorAlumno: db.prepare(`
    SELECT i.id, i.usuario, i.clase_id, c.codigo, c.nombre AS clase_nombre, i.fecha
    FROM inscripciones i
    INNER JOIN clases c ON c.id = i.clase_id
    WHERE i.usuario = ?
    ORDER BY i.id
  `),
  consultarAdmin: db.prepare(`
    SELECT i.id, i.usuario, i.clase_id, c.codigo, c.nombre AS clase_nombre, i.fecha
    FROM inscripciones i
    INNER JOIN clases c ON c.id = i.clase_id
    WHERE i.id = ?
  `),
  consultarProfesor: db.prepare(`
    SELECT i.id, i.usuario, i.clase_id, c.codigo, c.nombre AS clase_nombre, i.fecha
    FROM inscripciones i
    INNER JOIN clases c ON c.id = i.clase_id
    WHERE i.id = ? AND c.profesor_id = ?
  `),
  consultarDueno: db.prepare(`
    SELECT i.id, i.usuario, i.clase_id, c.codigo, c.nombre AS clase_nombre, i.fecha
    FROM inscripciones i
    INNER JOIN clases c ON c.id = i.clase_id
    WHERE i.id = ? AND i.usuario = ?
  `),
  clasePorCodigo: db.prepare('SELECT id, nombre, codigo, cupo FROM clases WHERE codigo = ?'),
  yaInscrito:     db.prepare('SELECT 1 FROM inscripciones WHERE usuario = ? AND clase_id = ?'),
  contarInscritos: db.prepare('SELECT COUNT(*) AS total FROM inscripciones WHERE clase_id = ?'),
  crear:          db.prepare('INSERT INTO inscripciones (usuario, clase_id, fecha) VALUES (?, ?, ?)'),
  borrarAdmin:    db.prepare('DELETE FROM inscripciones WHERE id = ?'),
  borrarProfesor: db.prepare('DELETE FROM inscripciones WHERE id = ? AND clase_id IN (SELECT id FROM clases WHERE profesor_id = ?)'),
  borrarDueno:    db.prepare('DELETE FROM inscripciones WHERE id = ? AND usuario = ?'),
};

const parsearId = (raw) => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

router.use(usuarioActual);

// GET /api/inscripciones — listar inscripciones según el rol → 200
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

// GET /api/inscripciones/:id — consultar una inscripción (404 si es de otro usuario) → 200 · 404
router.get('/:id', (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return error(res, 404, `No existe la inscripción ${req.params.id}`);

  let inscripcion;
  if (req.yo.rol === 'admin') {
    inscripcion = sql.consultarAdmin.get(id);
  } else if (req.yo.rol === 'profesor') {
    inscripcion = req.yo.profesor_id ? sql.consultarProfesor.get(id, req.yo.profesor_id) : null;
  } else {
    inscripcion = sql.consultarDueno.get(id, req.yo.usuario);
  }

  if (!inscripcion) return error(res, 404, `No existe la inscripción ${req.params.id}`);
  res.json(inscripcion);
});

// POST /api/inscripciones — alumno se inscribe a una clase mediante su código → 201
router.post('/', soloRoles('alumno'), (req, res) => {
  const datos = req.body || {};
  const codigo = typeof datos.codigo === 'string' ? datos.codigo.trim() : '';
  if (!/^[A-Za-z0-9]{6}$/.test(codigo)) {
    return error(res, 422, 'Los datos no son válidos', ['codigo: obligatorio, 6 letras o números']);
  }

  const clase = sql.clasePorCodigo.get(codigo);
  if (!clase) {
    return error(res, 404, `No existe ninguna clase con el código ${codigo}`);
  }

  // Dueño tomado estrictamente del token (req.yo.usuario)
  if (sql.yaInscrito.get(req.yo.usuario, clase.id)) {
    return error(res, 409, `Ya estás inscrito en la clase ${clase.codigo}`);
  }

  const { total } = sql.contarInscritos.get(clase.id);
  if (total >= clase.cupo) {
    return error(res, 409, `La clase ${clase.codigo} ya alcanzó su cupo máximo`);
  }

  const fecha = new Date().toISOString();
  const r = sql.crear.run(req.yo.usuario, clase.id, fecha);
  const creada = sql.consultarDueno.get(r.lastInsertRowid, req.yo.usuario);
  res.status(201).location(`/api/inscripciones/${creada.id}`).json(creada);
});

// DELETE /api/inscripciones/:id — darse de baja de una inscripción propia → 204 · 404
router.delete('/:id', (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return error(res, 404, `No existe la inscripción ${req.params.id}`);

  let r;
  if (req.yo.rol === 'admin') {
    r = sql.borrarAdmin.run(id);
  } else if (req.yo.rol === 'profesor') {
    r = req.yo.profesor_id ? sql.borrarProfesor.run(id, req.yo.profesor_id) : { changes: 0 };
  } else {
    r = sql.borrarDueno.run(id, req.yo.usuario);
  }

  if (r.changes === 0) return error(res, 404, `No existe la inscripción ${req.params.id}`);
  res.status(204).end();
});

module.exports = router;

