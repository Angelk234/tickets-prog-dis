// routes/estudiantes.js — Endpoint con IA (Gemini) para normalización y clasificación de carrera

const express = require('express');
const { preguntarALaIA, FallaIA } = require('../services/ia');
const { error } = require('../utils/error');

const router = express.Router();

const INSTRUCCION_IA =
  'Un alumno escribió el nombre de su carrera como quiso. Responde SOLO un JSON con la forma {"area": "ingenieria" | "ciencias" | "sociales" | "salud" | "artes" | "otra", "carrera": "el nombre completo y correcto de la carrera"}.\nCarrera escrita: ';

const AREAS_VALIDAS = ['ingenieria', 'ciencias', 'sociales', 'salud', 'artes', 'otra'];

router.post('/estudiantes/carrera', async (req, res, next) => {
  const carrera = req.body?.carrera;
  if (typeof carrera !== 'string' || carrera.trim().length < 2 || carrera.length > 300) {
    return error(res, 422, 'Los datos no son válidos', ['carrera: de 2 a 300 caracteres']);
  }

  try {
    const ia = await preguntarALaIA(INSTRUCCION_IA + carrera.trim());

    if (
      !ia ||
      typeof ia !== 'object' ||
      !AREAS_VALIDAS.includes(ia.area) ||
      typeof ia.carrera !== 'string' ||
      !ia.carrera.trim()
    ) {
      throw new FallaIA(502, 'La IA respondió algo inesperado.');
    }

    res.json({
      area: ia.area,
      carrera: String(ia.carrera).trim().slice(0, 200),
    });
  } catch (e) {
    if (e instanceof FallaIA) {
      return error(res, e.estado, e.message);
    }
    next(e);
  }
});

module.exports = router;

