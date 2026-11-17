// middlewares/auth.js — Autenticación JWT (401) y autorización por rol (403)

const jwt = require('jsonwebtoken');
const { db } = require('../datos');
const { error } = require('../utils/error');

const SECRETO = process.env.JWT_SECRETO || 'clave-de-desarrollo-cambiala-en-produccion-2026';

const sql = {
  usuarioPorNombre: db.prepare('SELECT id, usuario, nombre, rol FROM usuarios WHERE usuario = ?'),
  profesorPorUsuario: db.prepare('SELECT id FROM profesores WHERE usuario = ?'),
};

function usuarioActual(req, res, next) {
  const header = req.get('Authorization') || '';
  const partes = header.trim().split(/\s+/);
  if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
    return error(res, 401, 'Falta el token: inicia sesión en POST /api/login');
  }

  try {
    const datos = jwt.verify(partes[1], SECRETO, { algorithms: ['HS256'] });
    const fila = sql.usuarioPorNombre.get(String(datos.sub ?? ''));
    if (!fila) {
      return error(res, 401, 'El token no es válido o ya expiró');
    }

    let profesor_id = null;
    if (fila.rol === 'profesor') {
      const prof = sql.profesorPorUsuario.get(fila.usuario);
      profesor_id = prof ? prof.id : null;
    }

    req.yo = {
      id: fila.id,
      usuario: fila.usuario,
      nombre: fila.nombre,
      rol: fila.rol,
      profesor_id,
    };
    next();
  } catch (e) {
    return error(res, 401, 'El token no es válido o ya expiró');
  }
}

function soloRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.yo || !rolesPermitidos.includes(req.yo.rol)) {
      return error(res, 403, 'Tu rol no puede hacer esto');
    }
    next();
  };
}

module.exports = { SECRETO, usuarioActual, soloRoles };

