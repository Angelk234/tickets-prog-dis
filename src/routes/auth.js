// routes/auth.js — Inicio de sesión (POST /api/login) y perfil actual (GET /api/me)

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../datos');
const { SECRETO, usuarioActual } = require('../middlewares/auth');
const { error } = require('../utils/error');

const router = express.Router();

const sql = {
  buscarUsuario: db.prepare('SELECT id, usuario, nombre, clave_hash, rol FROM usuarios WHERE usuario = ?'),
};

// POST /api/login — autenticar usuario y firmar JWT
router.post('/login', (req, res) => {
  const { usuario, clave } = req.body || {};
  const fila = sql.buscarUsuario.get(String(usuario ?? '').trim());
  if (!fila || typeof clave !== 'string' || !bcrypt.compareSync(clave, fila.clave_hash)) {
    return error(res, 401, 'Usuario o clave incorrectos');
  }

  const token = jwt.sign(
    { sub: fila.usuario, rol: fila.rol },
    SECRETO,
    { algorithm: 'HS256', expiresIn: 30 * 60 }
  );

  // Nunca incluir clave ni clave_hash en la respuesta
  res.json({
    access_token: token,
    token_type: 'bearer',
    usuario: fila.usuario,
    rol: fila.rol,
  });
});

// GET /api/me — consultar el usuario autenticado del token
router.get('/me', usuarioActual, (req, res) => res.json(req.yo));

module.exports = router;

