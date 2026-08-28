# SPEC-001 — Platform Foundation

| Metadato | Detalle |
|---|---|
| **Código** | SPEC-001 |
| **Título** | Platform Foundation |
| **Fase / Semana** | Semana 1 — Levantamiento y Diseño |
| **Estado** | IMPLEMENTADA |
| **Responsable** | Principal Software Engineer |
| **Dependencias** | Ninguna (Inicio de proyecto desde cero) |

---

## 1. Resumen Ejecutivo y Objetivo

El objetivo de **SPEC-001** es establecer la base tecnológica, de seguridad, arquitectura de datos, interfaz de usuario y pruebas automatizadas para la **Plataforma Centralizada de Gestión Técnica y Nutricional** de **Alimentos Sevilla S.A.S.**

Esta especificación proporciona una aplicación web funcional, desplegable y verificable que sirve de cimiento para el desarrollo modular de las siguientes 5 semanas, sin inventar reglas de negocio nutricionales ni esquemas prematuros.

---

## 2. Alcance (In Scope)

1. **Inicialización y Configuración:**
   - Repositorio Git inicializado.
   - Next.js 16+ con App Router y TypeScript en modo estricto (`strict: true`).
   - Tailwind CSS configurado con componentes de interfaz B2B limpios y accesibles.
   - Configuración de ESLint, Prettier y Vitest para pruebas automatizadas.
   - Contenedor `docker-compose.yml` para PostgreSQL local.
   - Archivo `.env.example` exhaustivamente documentado.

2. **Capa de Persistencia y Base de Datos:**
   - Prisma ORM configurado con PostgreSQL.
   - Modelos físicos mínimos para Foundation:
     - `User`: Gestión de cuentas de usuario, email, nombre, hash de contraseña y estado.
     - `Role`: Enum y soporte para los 4 perfiles base (`ADMIN`, `R_AND_D`, `QUALITY`, `VIEWER`).
     - `Session`: Sesiones de usuario seguras en base de datos.
     - `AuditEvent`: Bitácora inmutable de eventos de auditoría y trazabilidad.
   - Script de siembra (`prisma/seed.ts`) idempotente para inicializar el usuario Administrador inicial en entornos de desarrollo.

3. **Autenticación y Autorización:**
   - Password hashing seguro con `bcryptjs` (salt rounds >= 10).
   - Generación de sesiones con tokens opacos y transporte mediante cookies HTTP-Only seguras.
   - Middleware de protección de rutas privadas en `/(app)/*`.
   - Utilidades de autorización server-side (`requireRole`, `hasRole`, `getCurrentUser`).
   - Flujo completo de Login y Logout mediante Server Actions.

4. **Subsistema de Auditoría Transversal:**
   - Servicio `recordAuditEvent` para registrar acciones relevantes de negocio y seguridad.
   - Sanitización automática de metadatos para bloquear el registro de contraseñas o tokens.

5. **Shell de Interfaz de Usuario y Navegación:**
   - Layout autenticado con sidebar moderno, responsive y colapsable.
   - Indicador visual del usuario conectado y su rol.
   - Dashboard inicial sobrio y profesional que presenta los módulos del sistema, estado de la plataforma y accesos directos.
   - Vistas placeholder profesionales para todos los módulos futuros con el mensaje estandarizado:
     > *"Este módulo será habilitado durante las siguientes etapas del proyecto."*
   - Páginas de módulos:
     - `/dashboard`
     - `/ingredientes`
     - `/productos`
     - `/formulaciones`
     - `/costos`
     - `/normativa`
     - `/documentos`
     - `/usuarios`
     - `/auditoria`
   - Manejo consistente de estados de carga (`loading.tsx`), errores (`error.tsx`) y páginas no encontradas (`not-found.tsx`).

6. **Suite de Pruebas Automatizadas:**
   - Tests unitarios de hashing, roles, validación Zod y sanitización de auditoría.
   - Tests de integración de protección de rutas y gestión de sesiones.

---

## 3. Fuera de Alcance (Out of Scope para SPEC-001)

- ❌ Motor de cálculo nutricional o fórmulas matemáticas.
- ❌ Hojas de cálculo CTN o lógica de balance nutricional.
- ❌ Importación de `Banco de Información Nutricional.xlsx`.
- ❌ Fórmulas regulatorias y cálculo de sellos frontales de advertencia.
- ❌ Importador mensual de costos y asignación de costos a formulaciones.
- ❌ Integración directa vía API con ERP SIESA (descartada por alcance contractual).
- ❌ Generación y exportación de fichas técnicas en PDF o Word.
- ❌ Modelado físico en base de datos de ingredientes, productos, recetas y versiones.
- ❌ Workflow formal de aprobación y firma electrónica.
- ❌ Migración de datos históricos.

---

## 4. Criterios de Aceptación (Acceptance Criteria)

- **AC-01 (Compilación y Tipado):** La aplicación compila sin errores con `pnpm build` y `pnpm typecheck` ejecuta con cero errores de TypeScript en modo estricto.
- **AC-02 (Calidad de Código):** `pnpm lint` ejecuta con cero advertencias o errores bloqueantes.
- **AC-03 (Protección de Rutas):** Intentar acceder a cualquier ruta bajo `/dashboard`, `/ingredientes`, `/productos`, etc., sin una sesión activa redirige inmediatamente a `/login`.
- **AC-04 (Autenticación):** Un usuario registrado puede iniciar sesión ingresando credenciales válidas en `/login`, recibiendo una cookie HTTP-Only que le permite navegar por la aplicación.
- **AC-05 (Cierre de Sesión):** Al hacer clic en "Cerrar Sesión", la sesión en base de datos se invalida y la cookie se destruye, redirigiendo a `/login`.
- **AC-06 (Roles Base):** Los 4 roles (`Administrador`, `Investigación y Desarrollo`, `Calidad`, `Consulta`) están soportados y se muestran claramente en la interfaz.
- **AC-07 (Dashboard Sobrio):** El Dashboard muestra el nombre de la plataforma, el estado del sistema, el rol del usuario conectado y las tarjetas de acceso rápido a los módulos sin gráficas falsas ni KPIs inventados.
- **AC-08 (Placeholders de Módulos):** Todas las rutas de módulos no implementados renderizan un placeholder profesional informativo.
- **AC-09 (Auditoría Segura):** El servicio de auditoría almacena eventos en la tabla `AuditEvent` y purga cualquier campo de contraseña o token en los metadatos.
- **AC-10 (Seed de Desarrollo):** Ejecutar `pnpm db:seed` crea o asegura la existencia de un usuario administrador inicial con credenciales documentadas en `README.md`.
- **AC-11 (Pruebas Unitarias e Integración):** Todos los tests en `vitest` ejecutan y pasan exitosamente (`pnpm test`).

---

## 5. Matriz de Verificación

| Criterio | Método de Verificación | Resultado Esperado |
|---|---|---|
| Compilación TypeScript | `pnpm typecheck` | 0 errores |
| Linting | `pnpm lint` | 0 errores |
| Pruebas automatizadas | `pnpm test` | Todos los tests en verde |
| Build de producción | `pnpm build` | Compilación exitosa de todas las rutas |
| Seguridad de cookies | Inspección de headers HTTP | `HttpOnly; SameSite=Lax; Path=/` |
| Sanitización de auditoría | Test unitario dedicado | Claves `password`/`token` reemplazadas por `[REDACTED]` |
