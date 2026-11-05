# Documentación de la API (OpenAPI / Swagger)

Esta carpeta contiene la especificación formal de la API de backend para el sistema de registro escolar (estilo Classroom) para la materia de **Programación Distribuida**.

---

## 📁 Archivos

- **[`openapi.yaml`](./openapi.yaml)**: Definición completa en formato **OpenAPI 3.0.3** (estándar de la industria, compatible con Swagger).

---

## 🚀 ¿Cómo visualizar y probar la documentación?

Hay varias formas sencillas de visualizar esta especificación con una interfaz interactiva de Swagger:

### Opción 1: Swagger Editor en línea (Sin instalar nada)
1. Abre [editor.swagger.io](https://editor.swagger.io/).
2. Haz clic en **File** > **Import file** (o copia y pega el contenido de `docs/openapi.yaml`).
3. Verás la documentación interactiva lista para explorar y probar endpoints.

### Opción 2: En Visual Studio Code
Puedes instalar extensiones muy populares como:
- **OpenAPI (Swagger) Editor** (por 42Crunch)
- **Swagger Viewer** (por arjun.slack)
- Al abrir `openapi.yaml`, presiona `Shift + Alt + E` (o el botón de vista previa) para renderizar la interfaz gráfica de Swagger directamente dentro del editor.

### Opción 3: Postman
1. Abre Postman.
2. Da clic en **Import**.
3. Selecciona el archivo `docs/openapi.yaml`.
4. Postman generará automáticamente una colección con todos los endpoints, parámetros y cuerpos de prueba estructurados.

---

## 📌 Resumen de Recursos y Flujos

| Recurso | Método | Ruta | Descripción | Rol principal |
|---|---|---|---|---|
| **Clases** | `GET` | `/api/classes` | Listar todas las clases | Alumno / Profesor |
| | `POST` | `/api/classes` | Crear una nueva clase (asigna código único de 6 caracteres) | Profesor |
| | `GET` | `/api/classes/:id` | Consultar detalle de una clase | Alumno / Profesor |
| | `PUT` | `/api/classes/:id` | Actualizar clase completa | Profesor |
| | `DELETE` | `/api/classes/:id` | Eliminar clase | Profesor |
| | `GET` | `/api/classes/:id/students` | Listar estudiantes inscritos a una clase | Profesor |
| **Inscripciones**| `POST` | `/api/classes/enroll` | Inscribirse a una clase usando el código | Alumno |
| **Profesores** | `GET` | `/api/teachers` | Listar profesores registrados | Administración / Profesores |
| | `POST` | `/api/teachers` | Dar de alta a un profesor | Profesor / Admin |
| | `GET` | `/api/teachers/:id` | Consultar perfil del profesor | General |
| | `GET` | `/api/teachers/:id/classes` | Consultar clases asignadas a un profesor | Profesor |
| **Alumnos** | `GET` | `/api/students` | Listar alumnos dados de alta | General |
| | `POST` | `/api/students` | Dar de alta a un alumno | Alumno / Admin |
| | `GET` | `/api/students/:id` | Consultar perfil del alumno | General |
| | `GET` | `/api/students/:id/classes` | Consultar clases inscritas de un alumno | Alumno |

---

## 💡 Nota sobre el formato de errores

Todos los errores siguen la estructura homogénea del proyecto:
```json
{
  "error": "Descripción del error",
  "detalles": [
    "campo: explicación del problema"
  ]
}
```
Códigos de estado utilizados:
- `200 OK` / `201 Created` / `204 No Content`
- `400 Bad Request`: JSON mal formado
- `404 Not Found`: Recurso o código no encontrado
- `409 Conflict`: Código de clase duplicado o cupo lleno
- `422 Unprocessable Entity`: Errores de validación de reglas de negocio
- `500 Internal Server Error`: Errores inesperados

