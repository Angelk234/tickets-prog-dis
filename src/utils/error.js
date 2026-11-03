// utils/error.js — un solo formato para todos los errores: {"error": "...", "detalles": [...]}

const error = (res, codigo, mensaje, detalles = []) => res.status(codigo).json({ error: mensaje, detalles });

module.exports = { error };
