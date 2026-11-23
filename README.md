# Registro de estudiantes · API

API para que una escuela organice sus clases al estilo Classroom: el administrador y los profesores dan de alta clases con su código y su cupo, y cada alumno se inscribe con el código de la clase y ve solo sus propias inscripciones. Además, una IA (Gemini) normaliza la carrera que el alumno escribe como quiera y la clasifica por área.

- **Versión:** v1.0.0 (ver [CHANGELOG.md](CHANGELOG.md))
- **Lenguaje:** Node · Express, con SQLite (`node:sqlite`)
- **Arquitectura:** [docs/arquitectura.md](docs/arquitectura.md)

## Cómo correrla

Requiere **Node 22.13 o superior** (trae `node:sqlite`) y Python 3 para servir la página y correr las pruebas.

1. Clonar el repositorio:
   ```
   git clone https://github.com/Angelk234/tickets-prog-dis.git
   cd tickets-prog-dis
   ```
2. Instalar dependencias:
   ```
   npm install
   ```
3. Configurar las variables de entorno (ver la tabla de abajo). Lo más fácil es copiar `.env.example` como `.env` y llenarlo; la API lo lee sola al arrancar:
   ```
   copy .env.example .env
   ```
   O en cmd, una línea por variable:
   ```
   set JWT_SECRETO=una-cadena-larga-y-aleatoria
   set GEMINI_API_KEY=su-clave-de-aistudio
   set GEMINI_MODELO=gemini-3.1-flash-lite
   ```
4. Arrancar la API:
   ```
   npm start
   ```
5. Abrir el contrato en http://127.0.0.1:3000/docs y el front en http://127.0.0.1:5500, sirviéndolo en otra terminal (no con doble clic):
   ```
   cd front
   python -m http.server 5500
   ```

Usuarios de prueba (se crean solos la primera vez que arranca la API):

| Usuario | Clave | Rol |
|---|---|---|
| `admin` | `admin123` | admin |
| `profe` | `profe123` | profesor |
| `ana` | `ana12345` | alumno |
| `beto` | `beto12345` | alumno |

## Variables de entorno

Están todas en [.env.example](.env.example). **Ninguna clave real va en el repositorio:** el `.env` está en `.gitignore`.

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `JWT_SECRETO` | Firmar los tokens. Sin ella usa una de desarrollo que no debe llegar a producción. | Sí, en producción |
| `GEMINI_API_KEY` | La clave de Gemini para `POST /api/estudiantes/carrera` (también acepta `API_KEY`). Sin ella ese endpoint responde 503 y el resto de la API sigue funcionando. | Para la IA |
| `GEMINI_MODELO` | El modelo de Gemini. Recomendado `gemini-3.1-flash-lite`: el de omisión (`gemini-flash-lite-latest`) puede tardar más de 5 s y responder 504. | No |
| `EXTERNO_URL` | A dónde se manda la petición de IA. Para las pruebas apunta al simulador: `http://127.0.0.1:9000`. | No |
| `CORS_ORIGENES` | Páginas que pueden usar la API desde el navegador, separadas por coma. | No |
| `PORT` | Puerto de la API (3000 por omisión). | No |
| `DB_PATH` | Ruta del archivo SQLite (`registro.db` por omisión). | No |

## Ejemplos de uso

Entrar y obtener el token:
```
curl -X POST http://127.0.0.1:3000/api/login -H "Content-Type: application/json" -d "{\"usuario\": \"admin\", \"clave\": \"admin123\"}"
```

Crear una clase (solo admin o profesor):
```
curl -X POST http://127.0.0.1:3000/api/classes -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nombre\": \"Redes II\", \"codigo\": \"RED202\", \"cupo\": 20, \"profesor_id\": 1}"
```

Un alumno se inscribe con el código de la clase (la inscripción queda a nombre de quien dice el token):
```
curl -X POST http://127.0.0.1:3000/api/inscripciones -H "Authorization: Bearer %TOKEN_ALUMNO%" -H "Content-Type: application/json" -d "{\"codigo\": \"RED202\"}"
```

Preguntarle a la IA por una carrera escrita como sea:
```
curl -X POST http://127.0.0.1:3000/api/estudiantes/carrera -H "Content-Type: application/json" -d "{\"carrera\": \"ing en soft\"}"
```
Responde `{"area":"ingenieria","carrera":"Ingeniería en Software"}`.

## Contrato y errores

- Contrato OpenAPI: http://127.0.0.1:3000/docs (Swagger UI) y [openapi.yaml](openapi.yaml), servido también en `/api/openapi.yaml`.
- Errores: todos responden `{"error": "...", "detalles": [...]}`. Ver [docs/errores.md](docs/errores.md).

## Cómo probarla

Con la API arrancada apuntando al simulador de fallas:
```
set EXTERNO_URL=http://127.0.0.1:9000
npm start
```
En otra terminal, con su matrícula en `prueba.json`:
```
python probar_api.py
```
Después reinicien la API (Ctrl+C y `npm start`) y córranlo otra vez: la prueba 15 revisa que los datos sobrevivan al reinicio.

Resultado de la versión v1.0.0: **28 de 28 pruebas** (CRUD y validación, contrato, persistencia, login, roles y dueño, IA con fallas simuladas y CORS).

## Anatomía de mi API

```
Anatomía de mi API · lista de revisión (43 de 43)

0 · Cliente (2/2)
  [x] Mi proyecto tiene un cliente que consume la API: una página, una app o un script.
  [x] Puedo hacer una acción en el cliente y mostrar la petición y la respuesta en la pestaña Red (F12).
  En la presentación: Abran su front y hagan una acción en vivo. Con F12 → Red, muestren la petición que salió y la respuesta que llegó.

1 · Petición HTTP (3/3)
  [x] Mis rutas nombran cosas (/tareas, /tareas/7), no acciones (/crearTarea).
  [x] Cada operación usa el método correcto: GET lee, POST crea, PUT o PATCH modifica, DELETE borra.
  [x] Tengo la ficha de endpoints: método, ruta, qué recibe y qué responde.
  En la presentación: Muestren su ficha de endpoints o /docs y expliquen en una frase qué hace cada ruta.

2 · CORS (3/3)
  [x] Configuré CORS con una lista de orígenes, no con *.
  [x] Authorization y Content-Type están en los encabezados permitidos.
  [x] CORS va antes de revisar el token.
  En la presentación: Abran su front desde su origen (por ejemplo, el puerto 5500) con F12 abierto: la consola sin errores de CORS.

3 · Autenticación (3/3)
  [x] Las contraseñas se guardan con hash (bcrypt o password_hash).
  [x] El login regresa un token JWT con vencimiento.
  [x] Sin token, o con un token alterado, la API responde 401.
  En la presentación: Hagan una petición a una ruta protegida sin token (401) y luego con token (200).

4 · Autorización (2/2)
  [x] Hay al menos dos roles y una acción que un rol no puede hacer (403).
  [x] Las consultas de recursos propios filtran por el usuario del token (WHERE id = ? AND usuario = ?).
  En la presentación: Con el usuario A pidan un recurso del usuario B: debe responder 404. Con un rol sin permiso intenten borrar: 403.

5 · Validación (3/3)
  [x] Valido campos obligatorios, tipo, formato y rango.
  [x] Un dato inválido responde 422 y dice qué campo falló.
  [x] Un duplicado o una regla rota responde 409.
  En la presentación: Manden un dato inválido desde su front y muestren que el error aparece en el campo correcto.

6 · Endpoint / controlador (2/2)
  [x] Tengo el CRUD completo de mi recurso principal.
  [x] Cada operación responde con su código: 200, 201, 204 o 404.
  En la presentación: Recorran el CRUD de su recurso principal en /docs, Postman o su front.

7 · Servicio / lógica de negocio (2/2)
  [x] Identifico al menos una regla de negocio propia de mi proyecto.
  [x] La regla está en una función aparte, no revuelta con el manejo de HTTP.
  En la presentación: Expliquen su regla de negocio y muestren el caso en que dice que no (409).

7b · Integraciones externas (5/5)
  [x] Mi API consume al menos un servicio externo.
  [x] La llamada tiene un tiempo máximo de espera (timeout).
  [x] Si el servicio falla o tarda, responde 502 o 504 con un mensaje claro.
  [x] La clave del servicio está en una variable de entorno.
  [x] Puedo explicar en qué caso se usaría SOAP en lugar de REST (por ejemplo, el SAT).
  En la presentación: Muestren la integración funcionando y luego la falla controlada: sin clave (503) o con el servicio caído (502 o 504).

8 · Persistencia (2/2)
  [x] Los datos se guardan en una base de datos y sobreviven al reinicio.
  [x] Todas mis consultas usan parámetros (?), ninguna pega datos al texto del SQL.
  En la presentación: Reinicien la API en vivo y muestren que los datos siguen ahí. Enseñen una de sus consultas con ?.

9 · Respuesta HTTP (2/2)
  [x] Todos mis errores salen en JSON con el mismo formato: {"error": ..., "detalles": [...]}.
  [x] Ningún error muestra trazas, rutas de archivos ni SQL.
  En la presentación: Provoquen dos errores distintos y muestren que ambos llegan con el mismo formato JSON.

Configuración base (3/3)
  [x] Secretos y claves (JWT, IA, base de datos) se leen de variables de entorno, no están escritos en el código.
  [x] En mi repositorio de GitHub no hay ninguna clave.
  [x] Mi README dice qué variables hay que configurar.
  En la presentación: Muestren dónde lee su código las variables de entorno y busquen en vivo en su repositorio que no haya ninguna clave.

Pruebas automáticas (2/2)
  [x] Tengo pruebas automáticas (probar_api.py, una colección de Postman o similar).
  [x] Las pruebas pasan antes de entregar.
  En la presentación: Corran sus pruebas en vivo y comenten el resultado.

Documentación (6/6)
  [x] Mi README explica qué es, cómo correrla en pocos pasos, qué variables configurar y cómo probarla.
  [x] Mi API publica su contrato (OpenAPI en /docs u openapi.yaml).
  [x] Tengo .env.example con las variables de entorno, sin valores secretos.
  [x] Tengo docs/arquitectura.md con el diagrama C4 de contenedores: página, API, base de datos y servicio externo.
  [x] Tengo CHANGELOG.md con lo que trae la versión v1.0.0.
  [x] Recomendado: 2 decisiones explicadas (ADR) en docs/decisiones/ y el catálogo de errores en docs/errores.md.
  En la presentación: Abran su repositorio en GitHub: el README y el diagrama de arquitectura. Con el diagrama expliquen qué parte de su sistema está distribuida y cómo se comunican las piezas.

Timeout e idempotencia (2/2)
  [x] Sé qué operaciones de mi API se pueden repetir sin riesgo y cuáles no.
  [x] Si reintento llamadas externas, solo es ante fallas pasajeras (429, 5xx o timeout).
  En la presentación: Expliquen qué pasaría en su proyecto si el usuario le da doble clic a "Guardar".

Seguridad en capas (1/1)
  [x] Puedo decir qué riesgo del OWASP API Top 10 evita cada capa de mi API.
  En la presentación: Cierren la presentación con la tabla “riesgo → cómo lo evita mi API”.
```

### Dónde está cada pieza en el código

| Pieza | Archivo |
|---|---|
| Cliente | `front/index.html` |
| CORS y configuración | `src/app.js` (CORS antes de las rutas, `process.loadEnvFile`) |
| Autenticación | `src/routes/auth.js` (login con bcrypt y JWT de 30 min) y `src/middlewares/auth.js` (`usuarioActual`, 401) |
| Autorización | `src/middlewares/auth.js` (`soloRoles`, 403) y las consultas con dueño en `src/routes/inscripciones.js` |
| Validación | `src/validaciones/clases.js` (422) |
| Endpoints | `src/routes/clases.js`, `inscripciones.js`, `usuarios.js`, `estudiantes.js` |
| Reglas de negocio (409) | `codigoRepetido` en `src/routes/clases.js`; ya inscrito y cupo lleno en `src/routes/inscripciones.js` |
| Integración externa | `src/services/ia.js` (timeout de 5 s, 1 reintento, 502/503/504) |
| Persistencia | `src/datos.js` (SQLite, todas las consultas con `?`) |
| Respuesta | `src/utils/error.js` (formato único) y el manejador de errores de `src/app.js` |
| Pruebas | `probar_api.py` y `simulador.py` |

### Idempotencia: el doble clic en "Guardar"

`GET`, `PUT` y `DELETE` se pueden repetir sin riesgo: leer no cambia nada, reemplazar con lo mismo deja la misma foto y borrar dos veces responde 204 y luego 404. `POST` no es idempotente, pero nuestras reglas lo protegen: si un profesor da doble clic al crear una clase, la segunda petición choca con el código único y responde **409**; si un alumno da doble clic al inscribirse, la segunda responde **409 "Ya estás inscrito"**. Además el front desactiva el botón mientras espera la respuesta. Con la IA solo reintentamos una vez y solo ante fallas pasajeras (429, 500, 502, 503 y 504); un 400 no se reintenta.

### Seguridad en capas (OWASP API Security Top 10, 2023)

| Riesgo | Cómo lo evita mi API |
|---|---|
| API1 · Autorización a nivel de objeto (BOLA/IDOR) | Las inscripciones se consultan con `WHERE i.id = ? AND i.usuario = ?` usando el usuario del token; lo ajeno responde 404. |
| API2 · Autenticación rota | Contraseñas con bcrypt, JWT firmado HS256 que vence a los 30 min y se verifica en cada petición; token alterado o vencido → 401. |
| API3 · Propiedades de objeto expuestas | El login y `/usuarios` nunca regresan la clave ni el hash; cada respuesta arma sus campos a mano. |
| API4 · Consumo de recursos sin límite | La llamada a la IA tiene tiempo máximo de 5 s y un solo reintento; la carrera se limita a 300 caracteres. |
| API5 · Autorización a nivel de función | `soloRoles` responde 403: un alumno no crea ni borra clases y solo el admin lista usuarios. |
| API8 · Mala configuración de seguridad | CORS con lista de orígenes (nunca `*`), claves en variables de entorno, errores sin trazas ni SQL. |
| API10 · Consumo inseguro de APIs | La respuesta de Gemini se valida (área de una lista fija, carrera de texto) antes de usarla; si no cumple, 502. |
| Inyección (A05 del OWASP Top 10) | Todas las consultas usan parámetros `?` de `node:sqlite`. |

## REST y SOAP en mi proyecto

Si la escuela cobrara la inscripción a cada clase, tendría que emitir y validar facturas electrónicas, y el servicio del SAT para consultar el estado de un CFDI es SOAP. Iría como otra integración externa (la pieza 7b), igual que Gemini: una función en `src/services/` que arme el sobre XML con los datos de la factura, haga un POST al SAT con tiempo máximo de espera, lea el campo `Estado` de la respuesta XML y lo regrese a nuestra API como JSON (`{"estado": "Vigente"}`). Si el SAT tarda o falla, respondería 504 o 502 como ya lo hacemos con la IA. El front y los demás clientes nunca verían XML: hablan REST con nuestra API y la traducción queda escondida en esa función.

## Equipo y reflexiones

| Integrante | Matrícula | Qué hizo |
|---|---|---|
| Jesús Ángel Aguilar Vázquez | 20204845 | Login con JWT, roles y dueño (inscripciones), integración con Gemini, contrato OpenAPI, CORS y front. |
| César Alberto Gerardo Vergara | 20204927 | CRUD de clases con validación (BUG-142), persistencia en SQLite con consultas parametrizadas y contrato en /docs, revisión del PR de login y roles, documentación v1.0.0. |
| Manuel Alcaraz Baltazar | 20202740 | [PENDIENTE: qué hizo] |

<!-- Cada integrante escribe la suya, con sus palabras: ¿qué pieza le costó más y por qué? ¿Qué haría distinto si este proyecto fuera de una empresa? -->

**Jesús Ángel Aguilar Vázquez:** [PENDIENTE: reflexión con sus palabras]

**Manuel Alcaraz Baltazar:** [PENDIENTE: reflexión con sus palabras]

**César Alberto Gerardo Vergara:** Lo que más me costó fue la parte de la IA con Gemini. Al principio la clave no me funcionaba porque la había pegado mal en el `.env`, y luego aunque ya funcionaba la API me respondía 504 porque el modelo tardaba más de 5 segundos. Ahí entendí para qué sirve el tiempo máximo: sin él la página se quedaría esperando sin decir nada. También me confundía por qué la página no podía usar la API si con curl sí funcionaba, hasta que vi el OPTIONS en la pestaña Red y entendí que CORS lo revisa el navegador. Si esto fuera de una empresa, haría las pruebas desde el principio y no al final, guardaría las claves bien desde el primer día y documentaría cada cosa conforme la hacemos, porque al final cuesta acordarse de por qué se hizo así.
