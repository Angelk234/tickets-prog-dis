// api_equipos_express.js — el mismo CRUD de equipos, en Node + Express
// npm install express   ·   node api_equipos_express.js

const express = require('express');
const app = express();
app.use(express.json());

let equipos = []; let sig = 1;
const TIPOS = ['multimetro', 'arduino', 'osciloscopio', 'fuente'];

function validar(d) {                                // las reglas de validación
  const det = [];
  if (typeof d.nombre !== 'string' || d.nombre.trim().length < 2) det.push('nombre: mínimo 2 caracteres');
  if (!TIPOS.includes(d.tipo)) det.push('tipo: debe ser ' + TIPOS.join(', '));
  if (!/^LAB-\d{3}$/.test(d.inventario || '')) det.push('inventario: formato LAB-000');
  return det;
}
const error = (res, codigo, mensaje, detalles = []) => res.status(codigo).json({ error: mensaje, detalles });

app.get('/equipos', (req, res) => res.json(equipos));
app.get('/equipos/:id', (req, res) => {
  const e = equipos.find(x => x.id === Number(req.params.id));
  if (!e) return error(res, 404, `No existe el equipo ${req.params.id}`);
  res.json(e);
});
app.post('/equipos', (req, res) => {
  const det = validar(req.body || {});
  if (det.length) return error(res, 422, 'Los datos no son válidos', det);
  if (equipos.some(x => x.inventario === req.body.inventario)) return error(res, 409, 'Inventario repetido');
  const e = { id: sig++, nombre: req.body.nombre, tipo: req.body.tipo, inventario: req.body.inventario };
  equipos.push(e);
  res.status(201).location(`/equipos/${e.id}`).json(e);
});
app.put('/equipos/:id', (req, res) => {
  const i = equipos.findIndex(x => x.id === Number(req.params.id));
  if (i < 0) return error(res, 404, `No existe el equipo ${req.params.id}`);
  const det = validar(req.body || {});
  if (det.length) return error(res, 422, 'Los datos no son válidos', det);
  equipos[i] = { id: equipos[i].id, nombre: req.body.nombre, tipo: req.body.tipo, inventario: req.body.inventario };
  res.json(equipos[i]);
});
app.delete('/equipos/:id', (req, res) => {
  const i = equipos.findIndex(x => x.id === Number(req.params.id));
  if (i < 0) return error(res, 404, `No existe el equipo ${req.params.id}`);
  equipos.splice(i, 1);
  res.status(204).end();
});
app.use((err, req, res, next) => {                 // JSON roto y cualquier otro error
  if (err.type === 'entity.parse.failed') return error(res, 400, 'El cuerpo no es un JSON válido');
  error(res, 500, 'Error interno del servidor');
});
app.listen(3000, () => console.log("Escuchando en http://127.0.0.1:3000"));
