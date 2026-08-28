# SPEC-001 — Platform Foundation

| Metadato | Detalle |
|---|---|
| **Código** | SPEC-001 |
| **Título** | Platform Foundation |
| **Fase / Semana** | Semana 1 — Levantamiento y Diseño |
| **Estado** | IMPLEMENTADA Y VALIDADA |
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
   - Next.js 16+ con App Router, Turbopack y TypeScript en modo estricto (`strict: true`).
   - Tailwind CSS configurado con componentes de interfaz B2B limpios y accesibles.
   - Configuración de ESLint flat config y Vitest para pruebas unitarias e integración real.
   - Contenedor `docker-compose.yml` para PostgreSQL local con puerto parametrizable (`${POSTGRES_PORT:-5432}:5432`).
   - Archivo `.env.example` exhaustivamente documentado.

2. **Capa de Persistencia y Migraciones:**
   - Prisma ORM configurado con PostgreSQL.
   - Migraciones SQL físicas versionadas en `prisma/migrations/`.
   - Modelos físicos mínimos para Foundation y Better Auth:
     - `User`: Gestión de cuentas, email, nombre, rol base y estado activo.
     - `Account`: Vinculación de credenciales y contraseñas hasheadas gestionadas por Better Auth.
     - `Session`: Sesiones de usuario seguras en base de datos.
     - `Verification`: Tokens de verificación requeridos por Better Auth.
     - `AuditEvent`: Bitácora inmutable de eventos de auditoría y trazabilidad.
     - `Role`: Enum para los 4 perfiles base (`ADMIN`, `R_AND_D`, `QUALITY`, `VIEWER`).
   - Script de siembra (`prisma/seed.ts`) con comportamiento **fail-closed** en producción.

3. **Autenticación y Autorización en Capas:**
   - Autenticación canónica mediante **Better Auth (v1.7+)**.
   - Generación de sesiones con tokens criptográficos y transporte mediante cookies HTTP-Only seguras (`better-auth.session_token`).
   - Proxy de protección de rutas privadas en `/(app)/*` (`src/proxy.ts`).
   - Capa de autorización de dominio (`getCurrentUser`, `requireRole`, `hasRole`):
     - **Control de inactividad:** Usuario inactivo (`isActive === false`) es rechazado inmediatamente del lado del servidor.
     - **Control de roles:** Operaciones administrativas de usuarios restringidas exclusivamente al rol `ADMIN`.
   - Flujo completo de Login y Logout.

4. **Subsistema de Auditoría Transversal:**
   - Servicio `recordAuditEvent` con normalización estricta de nombres de claves (`key.toLowerCase().replace(/[-_\s]/g, '')`).
   - Sanitización automática y recursiva sobre objetos planos, anidados y arrays, ofuscando claves sensibles (`password`, `token`, `secret`, `api_key`, `private_key`, `credentials`, `auth_header`, `bearer`, etc.) con `[REDACTED]`.

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
   - Tests unitarios: Roles, validaciones Zod y sanitizador de auditoría con normalización de casing y estructuras anidadas.
   - Tests de integración real: Persistencia en PostgreSQL, sesiones, rechazo de usuario inactivo, barreras de autorización por rol y verificación de sanitización en base de datos.

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

- **AC-01 (Compilación y Tipado):** La aplicación compila sin errores con `pnpm build` (Next.js 16 con Turbopack) y `pnpm typecheck` ejecuta con cero errores de TypeScript en modo estricto.
- **AC-02 (Calidad de Código):** `pnpm lint` ejecuta con cero advertencias o errores con ESLint flat config.
- **AC-03 (Protección de Rutas):** Intentar acceder a cualquier ruta bajo `/(app)/*` sin una sesión activa de Better Auth redirige inmediatamente a `/login`.
- **AC-04 (Autenticación Canónica):** Inicio de sesión gestionado por Better Auth emitiendo cookies HTTP-Only y validando credenciales contra la base de datos PostgreSQL.
- **AC-05 (Cierre de Sesión):** Al invocar `logoutAction`, la sesión se invalida y se destruye la cookie.
- **AC-06 (Roles Base):** Los 4 roles (`ADMIN`, `R_AND_D`, `QUALITY`, `VIEWER`) están tipados y soportados.
- **AC-07 (Control de Inactividad):** Un usuario con `isActive: false` es rechazado del lado del servidor.
- **AC-08 (Placeholders Informativos):** Todas las rutas de módulos no implementados renderizan un placeholder profesional sin datos ficticios.
- **AC-09 (Auditoría Sanitizada):** El servicio de auditoría almacena eventos en la tabla `AuditEvent` y purga cualquier clave sensible normalizada.
- **AC-10 (Migraciones y Seed):** La base de datos puede crearse desde cero con `pnpm db:deploy` y el seed de desarrollo cuenta con protección fail-closed en producción.
- **AC-11 (Pruebas Automatizadas):** Todos los tests unitarios e integrados pasan exitosamente (`pnpm test`).
