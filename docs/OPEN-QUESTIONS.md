# OPEN-QUESTIONS.md — Catálogo de Preguntas Abiertas

Este documento centraliza todas las dudas funcionales, normativas y técnicas pendientes de resolución por parte del cliente **Alimentos Sevilla S.A.S.** o de las mesas de trabajo del Kick-Off funcional de la Semana 1.

> **REGLA DE TRABAJO:** Ningún agente ni desarrollador debe asumir o inventar una respuesta unilateral para estas preguntas. Toda implementación dependiente de una pregunta abierta debe postergarse o desacoplarse hasta su confirmación oficial.

---

## 1. Banco Nutricional y Materias Primas

### [OQ-001] ¿Cuál es la fuente oficial nutricional cuando existen múltiples valores o fuentes para una misma materia prima?
- **Contexto:** En el archivo `Banco de Información Nutricional.xlsx` coexisten pestañas y registros con valores de análisis de laboratorio interno, fichas técnicas de proveedores y bases de datos bibliográficas (USDA, ICBF, etc.).
- **Impacto:** Determina el algoritmo de selección o la prioridad de precedencia al calcular la información nutricional de un ingrediente.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 2. Formulaciones, Versiones y Workflows

### [OQ-002] ¿Una formulación es única por producto o puede variar según la presentación comercial?
- **Contexto:** Algunos productos cárnicos o embutidos podrían compartir la misma emulsión/pasta base para diferentes gramajes, o bien tener formulaciones ligeramente ajustadas por condiciones de embutido o calibre de tripa.
- **Impacto:** Modelado de la relación entre `Product`, `Formulation` y `Presentation` en la base de datos.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-003] ¿Bajo qué condiciones se dispara la creación de una nueva versión de una formulación?
- **Contexto:** Necesidad de definir si cualquier cambio menor en porcentajes genera una versión inmutable (`v2`, `v3`) o si existe un estado de borrador editable.
- **Impacto:** Reglas de versionamiento y control de concurrencia en la edición de recetas.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-004] ¿Existe un workflow formal de estados (Borrador -> En Revisión -> Aprobada -> Obsoleta)?
- **Contexto:** Es necesario conocer el ciclo de vida documental y si una formulación en borrador puede ser utilizada para generar fichas técnicas oficiales.
- **Impacto:** Máquina de estados y validaciones en el módulo de formulaciones.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-005] ¿Qué roles o cargos específicos tienen la potestad de aprobar formulaciones para producción?
- **Contexto:** El alcance menciona perfiles (I+D, Calidad, Administrador), pero no la asignación exacta de aprobadores.
- **Impacto:** Autorización server-side en el endpoint/acción de aprobación.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 3. Motor de Cálculo Nutricional y Rendimientos

### [OQ-006] ¿Los archivos Excel CTN (ej. `CTN - Salchicha Desayuno Premium - v11.xlsx`) representan exactamente la lógica que debe reproducir el motor de cálculo?
- **Contexto:** Los libros de cálculo existentes contienen macros y celdas intermedias históricas que deben ser auditadas contra la norma vigente.
- **Impacto:** Algoritmo matemático del motor de cálculo nutricional.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-007] ¿Cómo deben manejarse el rendimiento de cocción/horneo, transformación y pérdidas de proceso?
- **Contexto:** Durante el procesamiento térmico de embutidos hay pérdidas de humedad o grasa que alteran la concentración final de nutrientes por 100g de producto terminado.
- **Impacto:** Fórmulas de balance de masa y factores de retención nutricional.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-008] ¿Cuáles son exactamente las reglas oficiales de redondeo y cifras significativas aplicables?
- **Contexto:** La normativa de etiquetado establece rangos de redondeo específicos (ej. calorías al múltiplo de 10 más cercano si >50 kcal, sodio al múltiplo de 5 o 10 mg, etc.).
- **Impacto:** Función utilitaria de formato y redondeo de tablas nutricionales.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 4. Normativa y Documentos Históricos

### [OQ-009] ¿Cómo deben reaccionar los documentos y formulaciones históricas ante un cambio de normativa regulatoria?
- **Contexto:** Si cambia la resolución sanitaria que rige los sellos frontales, se debe definir si las versiones históricas aprobadas se recalculan dinámicamente o permanecen como una instantánea (*snapshot*) inmutable con la norma vigente en su fecha de aprobación.
- **Impacto:** Estrategia de almacenamiento (snapshots JSON vs cálculo dinámico en tiempo de lectura).
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-010] ¿Quién está autorizado para modificar parámetros regulatorios (umbrales de sellos, valores diarios de referencia)?
- **Contexto:** Se debe definir si esta potestad es exclusiva del Administrador o si el perfil de Calidad puede ajustar parámetros.
- **Impacto:** Restricciones de autorización en el módulo de Normativa.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 5. Permisos y Roles de Usuario

### [OQ-011] ¿Cuál es la matriz definitiva de permisos por rol?
- **Contexto:** Se conocen los 4 perfiles base (`Administrador`, `Investigación y Desarrollo`, `Calidad`, `Consulta`), pero no la tabla cruzada de acciones permitidas (Crear ingrediente, editar costo, aprobar receta, exportar ficha, etc.).
- **Impacto:** Reglas de autorización granular para las Weeks 2 a 6.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 6. Estructura Financiera, Costos y Códigos SIESA

### [OQ-012] ¿Cuál de los archivos de costos entregados representa el formato estándar del archivo mensual oficial?
- **Contexto:** Existen múltiples formatos de reporte en las muestras de junio entregadas.
- **Impacto:** Parser y esquema de validación Zod para el módulo de importación mensual de costos.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-013] ¿Cuál es el nombre de columna o estructura exacta del código identificador de materia prima SIESA en el archivo de costos?
- **Contexto:** Se requiere conocer si el código incluye prefijos, ceros a la izquierda o si es puramente numérico/alfanumérico.
- **Impacto:** Normalización de cadenas y coincidencia en base de datos.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-014] ¿Qué debe ocurrir si el archivo financiero mensual contiene un código SIESA desconocido que no existe en el catálogo de ingredientes?
- **Contexto:** Opciones: ¿Se rechaza todo el archivo?, ¿se importa parcialmente con advertencia?, ¿se crea un ingrediente provisional sin datos nutricionales?
- **Impacto:** Manejo de transacciones y flujo de reporte de errores en la importación.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 7. Alcance Documental y Migración

### [OQ-015] ¿Debe migrarse información histórica de formulaciones anteriores o únicamente se cargarán productos e ingredientes vigentes?
- **Contexto:** Define el esfuerzo y la necesidad de herramientas de migración masiva inicial.
- **Impacto:** Scripts de carga de datos iniciales en etapa de implantación.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-016] ¿El documento "Textos Legales" entregado como ejemplo representa el formato y estructura exactos que deberá generar la plataforma?
- **Contexto:** Muestra de referencia `TL - Salchicha desayuno Premium x 480 g`.
- **Impacto:** Motor de plantillas y exportación del módulo de documentos técnicos.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

---

## 8. Aspectos Técnicos Adicionales

### [OQ-017] ¿Cuál es la política corporativa de expiración de sesión y timeout por inactividad?
- **Contexto:** Se ha configurado una expiración de sesión por defecto de 8 horas con renovación pasiva.
- **Impacto:** Ajuste de configuración de seguridad de sesiones en `src/lib/auth/session.ts`.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`

### [OQ-018] ¿Se requerirá a futuro autenticación federada (SSO / Azure AD / Google Workspace) o se mantiene autenticación local con email y contraseña segura?
- **Contexto:** SPEC-001 implementa autenticación local robusta con hash bcrypt y sesiones en base de datos.
- **Impacto:** Futura extensión del proveedor de autenticación.
- **Estado:** `ABIERTA (Pendiente Kick-Off)`
