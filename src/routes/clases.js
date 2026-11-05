// routes/clases.js — los 5 endpoints del recurso clases (montados en /api/classes)

const express = require('express');
const { clases, profesores, siguiente } = require('../datos');
const { validarClase } = require('../validaciones/clases');
const { error } = require('../utils/error');

const router = express.Router();

const buscar = (id) => clases.findIndex(c => c.id === Number(id));
const codigoRepetido = (codigo, excepto = 0) =>
  clases.some(c => c.codigo.toUpperCase() === codigo.toUpperCase() && c.id !== excepto);
const armar = (id, d) => ({ id, nombre: d.nombre.trim(), codigo: d.codigo, cupo: d.cupo, profesor_id: d.profesor_id });

// GET /api/classes — listar todas las clases → 200
router.get('/', (req, res) => res.json(clases));

// GET /api/classes/:id — consultar una clase → 200 · 404 si no existe
router.get('/:id', (req, res) => {
  const i = buscar(req.params.id);
  if (i < 0) return error(res, 404, `No existe la clase ${req.params.id}`);
  res.json(clases[i]);
});

// POST /api/classes — crear una clase → 201 (con encabezado Location)
//   422 si los datos no cumplen las reglas · 409 si el código ya existe
router.post('/', (req, res) => {
  const datos = req.body || {};
  const detalles = validarClase(datos, profesores);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (codigoRepetido(datos.codigo)) return error(res, 409, `Ya existe una clase con el código ${datos.codigo}`);
  const clase = armar(siguiente.clase++, datos);
  clases.push(clase);
  res.status(201).location(`/api/classes/${clase.id}`).json(clase);
});

// PUT /api/classes/:id — reemplazar la clase completa → 200
//   404 si no existe · 422 si los datos están mal · 409 si el código choca con otra clase
router.put('/:id', (req, res) => {
  const i = buscar(req.params.id);
  if (i < 0) return error(res, 404, `No existe la clase ${req.params.id}`);
  const datos = req.body || {};
  const detalles = validarClase(datos, profesores);
  if (detalles.length) return error(res, 422, 'Los datos no son válidos', detalles);
  if (codigoRepetido(datos.codigo, clases[i].id)) return error(res, 409, `Ya existe una clase con el código ${datos.codigo}`);
  clases[i] = armar(clases[i].id, datos);
  res.json(clases[i]);
});

// DELETE /api/classes/:id — borrar la clase → 204 · 404 si no existe
router.delete('/:id', (req, res) => {
  const i = buscar(req.params.id);
  if (i < 0) return error(res, 404, `No existe la clase ${req.params.id}`);
  clases.splice(i, 1);
  res.status(204).end();
});

module.exports = router;
