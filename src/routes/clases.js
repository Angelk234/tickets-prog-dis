// routes/clases.js — los 5 endpoints del recurso clases (montados en /api/classes)

const express = require('express');
const { clases, profesores } = require('../datos');
const { validarClase } = require('../validaciones/clases');
const { error } = require('../utils/error');

const router = express.Router();
const pendiente = (res) => error(res, 501, 'Endpoint pendiente de programar');

// GET /api/classes — listar todas las clases → 200
router.get('/', (req, res) => {
  // TODO: regresar la lista de clases
  pendiente(res);
});

// GET /api/classes/:id — consultar una clase → 200 · 404 si no existe
router.get('/:id', (req, res) => {
  // TODO: buscar la clase por id; si no existe, 404
  pendiente(res);
});

// POST /api/classes — crear una clase → 201 (con encabezado Location)
//   422 si los datos no cumplen las reglas · 409 si el código ya existe
router.post('/', (req, res) => {
  // TODO: validar con validarClase, revisar código repetido, guardar y responder 201
  pendiente(res);
});

// PUT /api/classes/:id — reemplazar la clase completa → 200
//   404 si no existe · 422 si los datos están mal · 409 si el código choca con otra clase
router.put('/:id', (req, res) => {
  // TODO: buscar, validar, revisar código repetido (sin contar esta misma clase) y reemplazar
  pendiente(res);
});

// DELETE /api/classes/:id — borrar la clase → 204 · 404 si no existe
router.delete('/:id', (req, res) => {
  // TODO: buscar y borrar; la segunda vez debe responder 404
  pendiente(res);
});

module.exports = router;
