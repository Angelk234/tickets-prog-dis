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
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (nombre.length < 3 || nombre.length > 80) detalles.push('nombre: obligatorio, de 3 a 80 caracteres');
  if (typeof datos.codigo !== 'string' || !/^[A-Za-z0-9]{6}$/.test(datos.codigo)) detalles.push('codigo: obligatorio, 6 letras o números');
  if (!Number.isInteger(datos.cupo) || datos.cupo < 1 || datos.cupo > 60) detalles.push('cupo: número entero de 1 a 60');
  if (!Number.isInteger(datos.profesor_id) || datos.profesor_id < 1) detalles.push('profesor_id: número entero mayor que 0');
  else if (!profesores.some(p => p.id === datos.profesor_id)) detalles.push(`profesor_id: no existe el profesor ${datos.profesor_id}`);
  return detalles;
}

module.exports = { validarClase };
