# OPEN-QUESTIONS.md — Catálogo de Preguntas Abiertas

Este documento centraliza todas las dudas funcionales, normativas y técnicas pendientes de resolución por parte del cliente **Alimentos Sevilla S.A.S.** o de las mesas de trabajo del Kick-Off funcional de la Semana 1.

> **REGLA DE TRABAJO:** Ningún agente ni desarrollador debe asumir o inventar una respuesta unilateral para estas preguntas. Toda implementación dependiente de una pregunta abierta debe postergarse o desacoplarse hasta su confirmación oficial.

---

## 1. Banco Nutricional y Materias Primas

### [OQ-001] ¿Cuál es la fuente oficial nutricional cuando existen múltiples valores o fuentes para una misma materia prima?
- **Respuesta Cliente:** Si un ingrediente cambia de proveedor y tiene componentes que alteran la composición nutricional, se considera un ingrediente diferente.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 2. Formulaciones, Versiones y Workflows

### [OQ-002] ¿Una formulación es única por producto o puede variar según la presentación comercial?
- **Respuesta Cliente:** Es la misma formulación. Lo que cambia por presentación es el gramaje neto de producto terminado y el consumo de material de empaque.
- **Estado:** `CONFIRMADA EN SEMANA 1` (Modelo: 1 Producto -> 1 Formulación -> N Presentaciones).

### [OQ-003] ¿Bajo qué condiciones se dispara la creación de una nueva versión de una formulación?
- **Respuesta Cliente:** Cuando se cambian materias primas o porcentajes de participación dentro de la fórmula.
- **Estado:** `CONFIRMADA EN SEMANA 1` (Versiones inmutables v1, v2, v3).

### [OQ-004] ¿Existe un workflow formal de estados (Borrador -> En Revisión -> Aprobada -> Obsoleta)?
- **Respuesta Cliente:** El Director de I+D/Técnico debe liberar y aprobar cada cambio dejando trazabilidad.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-005] ¿Qué roles o cargos específicos tienen la potestad de aprobar formulaciones para producción?
- **Respuesta Cliente:** Rol Director / Calidad con perfil de aprobación.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 3. Motor de Cálculo Nutricional y Rendimientos

### [OQ-006] ¿Los archivos Excel CTN representan exactamente la lógica que debe reproducir el motor de cálculo?
- **Respuesta Cliente:** Sí, esa es la base oficial del cálculo y debe ser replicable matemáticamente.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-007] ¿Cómo deben manejarse el rendimiento de cocción/horneo, transformación y pérdidas de proceso?
- **Respuesta Cliente:** Balance de masa directo: entran X kg de batch y salen Y kg cocidos; la diferencia es la merma de proceso que concentra los nutrientes.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-008] ¿Cuáles son exactamente las reglas oficiales de redondeo y cifras significativas aplicables?
- **Respuesta Cliente:** Sí, las reglas y tablas del archivo CTN son la base oficial.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 4. Normativa y Documentos Históricos

### [OQ-009] ¿Cómo deben reaccionar los documentos y formulaciones históricas ante un cambio de normativa regulatoria?
- **Respuesta Cliente:** Los documentos históricos no se alteran (permanecen inmutables como snapshots); el recálculo aplica únicamente a documentos futuros.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-010] ¿Quién está autorizado para modificar parámetros regulatorios (umbrales de sellos, valores diarios de referencia)?
- **Estado:** `ABIERTA (Pendiente Semana 4)`

---

## 5. Permisos y Roles de Usuario

### [OQ-011] ¿Cuál es la matriz definitiva de permisos por rol?
- **Estado:** `ABIERTA (Se ajustará progresivamente en Semana 2-6)`

---

## 6. Estructura Financiera, Costos y Códigos SIESA

### [OQ-012] ¿Cuál de los archivos de costos entregados representa el formato estándar del archivo mensual oficial?
- **Respuesta Cliente:** El archivo mensual de costos de materias primas.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-013] ¿Cuál es la estructura del código identificador SIESA?
- **Respuesta Cliente:** Prefijos por insumo: `11` = Carnes, `12` = Materia seca, `13` = Empaques, más códigos para Producto en Proceso y Producto Terminado.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-014] ¿Qué ocurre si el archivo financiero mensual contiene un código SIESA desconocido?
- **Respuesta Cliente:** El archivo mensual representa la última versión de materias primas e insumos. Si hay códigos nuevos, se advierte para parametrizar.
- **Estado:** `CONFIRMADA EN SEMANA 1`

---

## 7. Alcance Documental y Migración

### [OQ-015] ¿Debe migrarse información histórica o solamente información vigente?
- **Respuesta Cliente:** Solo la información vigente.
- **Estado:** `CONFIRMADA EN SEMANA 1`

### [OQ-016] ¿El documento "Textos Legales" entregado representa el formato exacto que deberá generar la plataforma?
- **Respuesta Cliente:** Sí, es la guía y referencia de salida.
- **Estado:** `CONFIRMADA EN SEMANA 1`

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
