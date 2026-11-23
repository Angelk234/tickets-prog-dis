# 0002. Tiempo máximo de 5 s y un solo reintento para la IA

- **Fecha:** 2026-11-16
- **Estado:** Aceptada

## Contexto

`POST /api/estudiantes/carrera` le pregunta a Gemini, un servicio que no controlamos. Puede tardar, caerse o responder algo que no esperamos. Sin tiempo máximo, el usuario se quedaría con la pantalla congelada y la API ocupada esperando. Teníamos que decidir cuánto esperar, cuántas veces reintentar y qué código responder en cada caso.

## Decisión

Cada llamada usa `AbortSignal.timeout(5000)`: si Gemini no contesta en 5 s, la API responde **504**. Reintentamos **una sola vez**, con una espera corta, y solo ante fallas pasajeras (429, 500, 502, 503 y 504); un 400 no se reintenta porque volver a mandar lo mismo daría el mismo error. Si Gemini falla o responde algo que no es el JSON esperado, la API responde **502**; si falta la clave, **503**. Nunca respondemos 500 por una falla de Gemini, porque el 500 significa un error de nuestro código.

## Consecuencias

- El usuario siempre recibe respuesta en pocos segundos y un mensaje claro, y el front muestra el aviso.
- El resto de la API sigue funcionando aunque Gemini esté caído.
- 5 s es justo para algunos modelos: `gemini-flash-lite-latest` tarda 8 a 10 s porque "piensa" antes de contestar, y responde 504. Por eso recomendamos `GEMINI_MODELO=gemini-3.1-flash-lite`.
- Un solo reintento puede no bastar si Gemini está saturado mucho tiempo; más reintentos alargarían la espera del usuario.
