// app.js — Registro de estudiantes · Unidad III, Sesión 5 (APIs de terceros y Gemini IA)
// npm install   ·   npm start   (o: node src/app.js)
// Contrato: http://127.0.0.1:3000/docs  ·  http://127.0.0.1:3000/api/openapi.yaml

const path = require('node:path');

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.join(__dirname, '..', '.env'));
  } catch (e) {
    // Si no existe el archivo .env se utilizan las variables del entorno del sistema
  }
}
if (!process.env.GEMINI_API_KEY && process.env.API_KEY) {
  process.env.GEMINI_API_KEY = process.env.API_KEY;
}

const express = require('express');
const auth = require('./routes/auth');
const clases = require('./routes/clases');
const inscripciones = require('./routes/inscripciones');
const usuarios = require('./routes/usuarios');
const estudiantes = require('./routes/estudiantes');
const { error } = require('./utils/error');

const CONTRATO = path.join(__dirname, '..', 'openapi.yaml');
const CONTRATO_JSON = path.join(__dirname, '..', 'openapi.json');
const DOCS = path.join(__dirname, '..', 'docs.html');

const app = express();

// ---------- CORS: qué páginas pueden usar su API desde el navegador ----------
const cors = require('cors');
const ORIGENES = (process.env.CORS_ORIGENES ?? 'http://127.0.0.1:5500,http://localhost:5500').split(',');

app.use(cors({
  origin: ORIGENES,                                   // una lista, nunca '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Authorization', 'Content-Type']   // sin Authorization, el token no pasa la pregunta previa
}));

app.use(express.json());

// Autenticación (/api/login, /api/me y alias /login)
app.use('/api', auth);
app.use('/', auth);

// Recursos de la API
app.use('/api/classes', clases);
app.use('/api/inscripciones', inscripciones);
app.use('/api', usuarios);
app.use('/api', estudiantes);
app.use('/', estudiantes);

// El contrato OpenAPI y su documentación (Swagger UI)
app.get(['/api/openapi.yaml', '/openapi.yaml'], (req, res) => res.type('application/yaml').sendFile(CONTRATO));
app.get(['/api/openapi.json', '/openapi.json'], (req, res) => res.type('application/json').sendFile(CONTRATO_JSON));
app.get('/docs', (req, res) => res.sendFile(DOCS));

app.use((req, res) => error(res, 404, `No existe la ruta ${req.method} ${req.path}`));

app.use((err, req, res, next) => {                 // JSON roto y cualquier otro error
  if (err.type === 'entity.parse.failed') return error(res, 400, 'El cuerpo no es un JSON válido');
  error(res, 500, 'Error interno del servidor');
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Escuchando en http://127.0.0.1:${PORT}  ·  contrato en /docs`));
