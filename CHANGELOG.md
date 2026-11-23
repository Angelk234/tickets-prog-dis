# Changelog

Todos los cambios importantes de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y el proyecto usa [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-23

### Agregado

- CRUD de clases (`/api/classes`) con validación (422), código de clase único (409) y formato de error único `{"error", "detalles"}`.
- Persistencia en SQLite (`node:sqlite`) con todas las consultas parametrizadas; los datos sobreviven al reinicio.
- Contrato OpenAPI en `openapi.yaml`, servido en `/api/openapi.yaml` y con Swagger UI en `/docs`, con los errores documentados.
- Login con JWT (30 minutos) y contraseñas con bcrypt.
- Roles admin, profesor y alumno: solo admin o profesor crean, modifican o borran clases; solo el admin lista usuarios (403).
- Inscripciones con dueño: cada alumno se inscribe con el código de la clase y ve o cancela solo las suyas (404 si no son suyas); no puede inscribirse dos veces ni pasar del cupo (409).
- Normalización de la carrera con Gemini (`POST /api/estudiantes/carrera`), con tiempo máximo de 5 s, un reintento ante fallas pasajeras y respuestas 502, 503 y 504 claras.
- Página web (`front/index.html`) con login, lista de clases, alta e IA, que reacciona a 401, 403, 422 y 502/504.
- CORS con lista de orígenes y Authorization permitido, antes de las rutas y del token.
- 28 pruebas automáticas en `probar_api.py`, con el simulador de fallas `simulador.py`.
- Documentación: README, `.env.example`, arquitectura C4, catálogo de errores y dos decisiones (ADR).

### Pendiente

- Leer `JWT_SECRETO` solo de variables de entorno y negarse a arrancar sin ella fuera de desarrollo.
- Cambiar el modelo de Gemini por omisión a uno que responda en menos de 5 s.
- Cambiar SQLite por un servidor de base de datos si varias copias de la API corren al mismo tiempo.
- Quitar la carpeta duplicada `frontend/` (es una copia de `front/`).
