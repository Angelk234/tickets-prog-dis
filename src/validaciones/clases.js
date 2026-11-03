// validaciones/clases.js — las reglas del bloque 03
//
// Regresa la lista de detalles (vacía si todo está bien), por ejemplo:
//   ['nombre: de 3 a 80 caracteres', 'cupo: entero de 1 a 60']
//
// Reglas:
//   nombre       texto, obligatorio, de 3 a 80 caracteres          se rechaza: ""
//   codigo       texto, obligatorio, 6 letras o números, único     se rechaza: "AB"
//   cupo         número entero, obligatorio, de 1 a 60             se rechaza: 0
//   profesor_id  número entero, obligatorio, el profesor debe existir   se rechaza: "abc"
//
// Lo de "único" (409) se revisa en la ruta, no aquí: aquí solo va la forma de los datos.

function validarClase(datos, profesores) {
  const detalles = [];
  // TODO: una condición por regla; si no cumple, detalles.push('campo: qué está mal')
  return detalles;
}

module.exports = { validarClase };
