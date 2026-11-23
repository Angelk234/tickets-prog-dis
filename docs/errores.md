# Catálogo de errores

Todos los errores responden con el mismo formato:

```json
{"error": "Mensaje para el usuario", "detalles": ["detalle por campo, si aplica"]}
```

| Código | Cuándo | Ejemplo de mensaje |
|---|---|---|
| 400 | El cuerpo no es un JSON válido. | `El cuerpo no es un JSON válido` |
| 401 | Falta el token, está alterado o venció; o el usuario o la clave del login son incorrectos. | `Falta el token: inicia sesión en POST /api/login` · `El token no es válido o ya expiró` · `Usuario o clave incorrectos` |
| 403 | El rol no puede hacer esa acción (un alumno crea una clase, un profesor lista usuarios, un admin se inscribe). | `Tu rol no puede hacer esto` |
| 404 | No existe la ruta o el recurso, o el recurso es de otro usuario (para no revelar que existe). | `No existe la clase 999999` · `No existe la inscripción 7` |
| 409 | Los datos son válidos pero chocan con lo que ya hay: código de clase repetido, alumno ya inscrito o cupo lleno. | `Ya existe una clase con el código RED202` · `Ya estás inscrito en la clase SIS202` · `La clase SIS202 ya alcanzó su cupo máximo` |
| 422 | Un campo falta, tiene el tipo o el formato equivocado o se sale del rango; o el profesor del cuerpo no existe. | `Los datos no son válidos` con `detalles`: `["cupo: número entero de 1 a 60"]` |
| 500 | Un error nuestro que no esperábamos. Nunca muestra trazas ni SQL. | `Error interno del servidor` |
| 502 | Gemini respondió un error o algo que no entendemos. | `La IA no está disponible (respondió 503). Intenta más tarde.` |
| 503 | Falta configurar la clave de Gemini. | `Falta configurar la variable de entorno GEMINI_API_KEY` |
| 504 | Gemini tardó más de 5 segundos. | `La IA tardó demasiado en responder. Intenta en un momento.` |
