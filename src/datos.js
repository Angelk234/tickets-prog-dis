// datos.js — los datos viven en memoria (la base de datos llega en la sesión 3)

const profesores = [
  { id: 1, nombre: 'Ricardo Jaramillo Velasco' },
  { id: 2, nombre: 'Arturo García Nevares' },
];

const clases = [];
const siguiente = { clase: 1 };

module.exports = { profesores, clases, siguiente };
