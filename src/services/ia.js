// services/ia.js — Integración con Gemini y servicios de IA (Unidad III, Sesión 5)
//
// Reglas de consumo seguro de APIs externas:
//   1. Timeout siempre: máx. 5 s con AbortSignal.timeout (si la IA tarda, responde 504 en 5 s)
//   2. Reintentos con criterio: solo fallas transitorias de servidor (429, 500, 502, 503, 504) con backoff y jitter; 400/401/404 NO se reintentan
//   3. La clave nunca va en código: se toma de GEMINI_API_KEY o API_KEY de las variables de entorno
//   4. Validación estricta: nunca confiar en que el tercero responda JSON válido o la forma esperada

const TIMEOUT_MS = 5000;
const INTENTOS = 2; // 1 intento + 1 reintento para fallas transitorias HTTP
const TRANSITORIOS = new Set([429, 500, 502, 503, 504]);

class FallaIA extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

const dormir = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function preguntarALaIA(instruccion) {
  const clave = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const urlBase = (process.env.EXTERNO_URL ?? 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const modelo = process.env.GEMINI_MODELO ?? 'gemini-flash-lite-latest';

  if (!clave && urlBase.includes('googleapis.com')) {
    throw new FallaIA(503, 'Falta configurar la variable de entorno GEMINI_API_KEY');
  }

  const endpoint = `${urlBase}/v1beta/models/${modelo}:generateContent`;
  const headers = { 'Content-Type': 'application/json' };
  if (clave) {
    headers['x-goog-api-key'] = clave;
  }

  const cuerpo = {
    contents: [{ parts: [{ text: instruccion }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  };

  let r = null;

  for (let intento = 1; intento <= INTENTOS; intento++) {
    let esperaMinima = 0;
    try {
      r = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (r.status === 429) {
        esperaMinima = Number(r.headers.get('Retry-After') || 0) * 1000;
      }
    } catch (e) {
      console.error('[ia fetch error]', e.name, e.message);
      if (e.name === 'TimeoutError') {
        throw new FallaIA(504, 'La IA tardó demasiado en responder. Intenta en un momento.');
      }
      throw new FallaIA(502, 'No se pudo conectar con la IA.');
    }

    if (r.ok || !TRANSITORIOS.has(r.status)) {
      break;
    }

    if (intento < INTENTOS) {
      const espera = Math.max(esperaMinima, 500 * (2 ** (intento - 1))) + Math.random() * 200;
      await dormir(espera);
    }
  }

  if (!r || !r.ok) {
    const st = r ? r.status : 502;
    throw new FallaIA(502, `La IA no está disponible (respondió ${st}). Intenta más tarde.`);
  }

  try {
    const respuestaJson = await r.json();
    const rawTexto = respuestaJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawTexto) throw new Error('Sin candidatos en la respuesta');
    return JSON.parse(rawTexto);
  } catch {
    throw new FallaIA(502, 'La IA respondió algo que no entendemos.');
  }
}

module.exports = { preguntarALaIA, FallaIA };
