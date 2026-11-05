// routes/clases.js — los 5 endpoints del recurso clases (montados en /api/classes)
//
// Todas las consultas van con parámetros (?): el dato del cliente nunca se pega al SQL.

const express = require('express');
const { db } = require('../datos');
const { validarClase } = require('../validaciones/clases');
const { error } = require('../utils/error');

const router = express.Router();

const sql = {
  listar:     db.prepare('SELECT id, nombre, codigo, cupo, profesor_id FROM clases ORDER BY id'),
  consultar:  db.prepare('SELECT id, nombre, codigo, cupo, profesor_id FROM clases WHERE id = ?'),
  repetido:   db.prepare('SELECT 1 FROM clases WHERE codigo = ? AND id <> ?'),
  crear:      db.prepare('INSERT INTO clases (nombre, codigo, cupo, profesor_id) VALUES (?, ?, ?, ?)'),
  reemplazar: db.prepare('UPDATE clases SET nombre = ?, codigo = ?, cupo = ?, profesor_id = ? WHERE id = ?'),
  borrar:     db.prepare('DELETE FROM clases WHERE id = ?'),
};

const buscar = (id) => sql.consultar.get(Number(id));
const codigoRepetido = (codigo, excepto = 0) => !!sql.repetido.get(codigo, excepto);

// GET /api/classes — listar todas las clases → 200
router.get('/', (req, res) => res.json(sql.listar.all()));

// GET /api/classes/:id — consultar una clase → 200 · 404 si no existe
router.get('/:id', (req, res) => {
  const clase = buscar(req.params.id);
  if (!clase) return error(res, 404, `No existe la clase ${req.params.id}`);
  res.json(clase);
});

// POST /api/classes — crear una clase → 201 (con encabezado Location)
//   422 si los datos no cumplen las reglas · 409 si el código ya existe
router.post('/', (req, res) => {
  const datos = req.body || {};
  const detalles = validarClase(datos);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (codigoRepetido(datos.codigo)) return error(res, 409, `Ya existe una clase con el código ${datos.codigo}`);
  const r = sql.crear.run(datos.nombre.trim(), datos.codigo, datos.cupo, datos.profesor_id);
  const clase = buscar(r.lastInsertRowid);
  res.status(201).location(`/api/classes/${clase.id}`).json(clase);
});

// PUT /api/classes/:id — reemplazar la clase completa → 200
//   404 si no existe · 422 si los datos están mal · 409 si el código choca con otra clase
router.put('/:id', (req, res) => {
  const actual = buscar(req.params.id);
  if (!actual) return error(res, 404, `No existe la clase ${req.params.id}`);
  const datos = req.body || {};
  const detalles = validarClase(datos);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (codigoRepetido(datos.codigo, actual.id)) return error(res, 409, `Ya existe una clase con el código ${datos.codigo}`);
  sql.reemplazar.run(datos.nombre.trim(), datos.codigo, datos.cupo, datos.profesor_id, actual.id);
  res.json(buscar(actual.id));
});

// DELETE /api/classes/:id — borrar la clase → 204 · 404 si no existe
router.delete('/:id', (req, res) => {
  const r = sql.borrar.run(Number(req.params.id));
  if (r.changes === 0) return error(res, 404, `No existe la clase ${req.params.id}`);
  res.status(204).end();
});

module.exports = router;
