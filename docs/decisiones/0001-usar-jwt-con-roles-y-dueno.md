# 0001. Usar JWT con roles y dueño tomado del token

- **Fecha:** 2026-11-11
- **Estado:** Aceptada

## Contexto

La API la usan tres tipos de personas (admin, profesor y alumno) y cada una puede hacer cosas distintas. Además, un alumno solo debe ver y cancelar sus propias inscripciones. Necesitábamos saber en cada petición quién la hace, sin guardar sesiones en el servidor. Las opciones eran sesiones con cookie guardadas en la API o un token firmado que el cliente manda en cada petición.

## Decisión

Usamos JWT firmado con HS256 que vence a los 30 minutos y lleva el usuario (`sub`) y su rol. El middleware `usuarioActual` lo verifica en cada petición y `soloRoles` decide por rol (403). En las consultas de recursos con dueño, el usuario sale siempre del token (`req.yo.usuario`), nunca del cuerpo de la petición.

## Consecuencias

- La API no guarda sesiones: cualquier copia de la API puede verificar el token solo con el secreto.
- Un alumno no puede hacerse pasar por otro mandando otro usuario en el cuerpo: lo ajeno responde 404.
- Un token robado sirve hasta que vence (30 min) y no se puede revocar antes; para eso haría falta una lista de tokens revocados.
- Si cambia el rol de un usuario, la API lo nota porque vuelve a leer el usuario de la base en cada petición, pero eso es una consulta extra por petición.
- El secreto `JWT_SECRETO` es crítico: si se filtra, cualquiera puede firmar tokens. Por eso va en variables de entorno.
