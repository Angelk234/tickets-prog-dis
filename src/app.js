// app.js — Registro de estudiantes · Unidad III, Sesión 3
// npm install   ·   npm start   (o: node src/app.js)
// Contrato: http://127.0.0.1:3000/docs  ·  http://127.0.0.1:3000/api/openapi.yaml

const path = require('node:path');
const express = require('express');
const clases = require('./routes/clases');
const { error } = require('./utils/error');

const CONTRATO = path.join(__dirname, '..', 'openapi.yaml');

const app = express();
app.use(express.json());

app.use('/api/classes', clases);

// El contrato OpenAPI y su documentación (Swagger UI)
app.get(['/api/openapi.yaml', '/openapi.yaml'], (req, res) => res.type('application/yaml').sendFile(CONTRATO));
app.get('/docs', (req, res) => res.type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Registro de estudiantes · /docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"></head>
<body><div id="docs"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/openapi.yaml', dom_id: '#docs' });</script>
</body></html>`));

app.use((req, res) => error(res, 404, `No existe la ruta ${req.method} ${req.path}`));

app.use((err, req, res, next) => {                 // JSON roto y cualquier otro error
  if (err.type === 'entity.parse.failed') return error(res, 400, 'El cuerpo no es un JSON válido');
  error(res, 500, 'Error interno del servidor');
});

app.listen(3000, () => console.log('Escuchando en http://127.0.0.1:3000  ·  contrato en /docs'));
