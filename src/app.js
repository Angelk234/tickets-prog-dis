// app.js — Registro de estudiantes · Unidad III, Sesión 2
// npm install   ·   npm start   (o: node src/app.js)

const express = require('express');
const path = require('path');
const clases = require('./routes/clases');
const { error } = require('./utils/error');

const app = express();
app.use(express.json());

app.get('/openapi.yaml', (q, r) =>
  r.sendFile(path.join(__dirname, 'openapi.yaml')));
app.get('/docs', (q, r) =>
  r.sendFile(path.join(__dirname, 'docs.html')));

app.use('/api/classes', clases);

app.use((req, res) => error(res, 404, `No existe la ruta ${req.method} ${req.path}`));

app.use((err, req, res, next) => {                 // JSON roto y cualquier otro error
  if (err.type === 'entity.parse.failed') return error(res, 400, 'El cuerpo no es un JSON válido');
  error(res, 500, 'Error interno del servidor');
});

app.listen(3000, () => console.log('Escuchando en http://127.0.0.1:3000'));
