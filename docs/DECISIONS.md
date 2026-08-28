# DECISIONS.md — Registro de Decisiones de Arquitectura (ADRs)

Este documento registra las decisiones arquitectónicas fundamentales (Architectural Decision Records) adoptadas para la **Plataforma Centralizada de Gestión Técnica y Nutricional** de **Alimentos Sevilla S.A.S.**

---

## ADR-001: Arquitectura de Monolito Modular (Modular Monolith)
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** La plataforma debe centralizar catálogos, cálculos nutricionales, control de formulaciones, costos y generación documental para un único cliente corporativo. Se requiere máxima velocidad de iteración, consistencia transaccional y simplicidad operativa sin incurrir en la sobrecarga de infraestructura, latencia de red ni complejidad de despliegue de microservicios.
- **Decisión:** Implementar la solución como un Monolito Modular dentro de Next.js, con separación limpia de dominios y capas de servicio en `src/lib/*` y `src/app/*`.
- **Consecuencias:**
  - *Positivas:* Despliegue unificado, refactorizaciones seguras mediante TypeScript estricto, transacciones ACID nativas directas en base de datos, menor costo operativo.
  - *Mitigación:* Mantener fronteras claras entre módulos para evitar acoplamientos circulares o lógica dispersa.

---

## ADR-002: Adopción de PostgreSQL como Base de Datos Relacional
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** El dominio requiere modelar relaciones jerárquicas estrictas (productos, formulaciones, versiones, materias primas, costos y auditoría), garantizando integridad referencial, precisión decimal en valores nutricionales y soporte para estructuras semi-estructuradas (JSONB) en auditoría y metadatos regulatorios.
- **Decisión:** Utilizar PostgreSQL como el motor de base de datos relacional primario del sistema.
- **Consecuencias:**
  - *Positivas:* Soporte nativo robusto para tipos numéricos de alta precisión (`Decimal`), campos `JSONB`, transacciones ACID e índices avanzados.
  - *Trade-off:* Requiere aprovisionamiento de instancia Postgres administrada o contenedor Docker en desarrollo con puerto configurable.

---

## ADR-003: Prisma como ORM y Motor de Migraciones Declarativas Versionadas
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Se requiere un acceso a base de datos fuertemente tipado en TypeScript, con generación automática de tipos y control determinista de migraciones versionadas a lo largo de las 6 semanas del proyecto.
- **Decisión:** Utilizar Prisma ORM (`@prisma/client` y `prisma` CLI) con migraciones físicas versionadas en `prisma/migrations/`.
- **Consecuencias:**
  - *Positivas:* Tipado estático completo en tiempo de desarrollo, migraciones SQL trazables e inmutables aplicables mediante `prisma migrate deploy`.
  - *Mitigación:* Escribir scripts de semilla reproducibles (`seed.ts`) con comportamiento seguro y fail-closed en producción.

---

## ADR-004: Next.js 16+ con App Router, Turbopack y TypeScript Estricto
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Se necesita una plataforma web moderna con Server-Side Rendering (RSC) para proteger información sensible y Server Actions / Proxy para procesar mutaciones y proteger rutas de manera segura sin exponer APIs REST públicas desprotegidas.
- **Decisión:** Utilizar Next.js 16 (16.3.3) con App Router en modo estricto de TypeScript (`"strict": true`) y convención `src/proxy.ts`.
- **Consecuencias:**
  - *Positivas:* Excelente rendimiento con Turbopack, componentes de servidor con acceso seguro a la capa de datos, validación centralizada en el backend.
  - *Mitigación:* Mantener separación estricta entre la UI y la capa de servicios de dominio.

---

## ADR-005: Autorización en el Servidor en Capas sobre Sesiones de Better Auth
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** La plataforma procesará formulaciones secretas y costos industriales confidenciales. La seguridad no puede delegarse a controles puramente cosméticos en el cliente (como deshabilitar botones en React).
- **Decisión:** Construir la autorización de la aplicación sobre las sesiones criptográficas de Better Auth. Cada operación server-side valida:
  1. La validez de la sesión en base de datos.
  2. Que el usuario permanezca activo (`isActive === true`).
  3. Que el rol del usuario (`ADMIN`, `R_AND_D`, `QUALITY`, `VIEWER`) coincida con los requeridos para la operación mediante `requireRole()`.
- **Consecuencias:**
  - *Positivas:* Desacoplamiento total: Better Auth resuelve autenticación/sesiones, mientras que nuestra aplicación resuelve la autorización de dominio. Inactividad de usuario deniega el acceso server-side inmediatamente.

---

## ADR-006: Asociación de Información SIESA por Archivo Mensual (Sin Integración API Directa)
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** El ERP SIESA de Alimentos Sevilla S.A.S. gestiona costos y maestros contables, pero no forma parte del alcance contractual una integración directa vía API o conexión de base de datos en tiempo real.
- **Decisión:** La plataforma NO implementa endpoints, clientes SOAP/REST ni conexiones directas con SIESA. Toda asociación se realiza mediante la coincidencia del campo "Código de Materia Prima SIESA" en los archivos mensuales de costos cargados por los usuarios.
- **Consecuencias:**
  - *Positivas:* Aislamiento de fallos externos de red del ERP, simplificación de la arquitectura y reducción de riesgos de seguridad.
  - *Trade-off:* La frescura de los costos depende de la periodicidad de carga manual del archivo mensual por parte del equipo de costos.

---

## ADR-007: Subsistema Transversal de Auditoría (AuditEvent) con Sanitización Normalizada
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Cumplimiento con auditorías de calidad alimentaria y trazabilidad corporativa exigen registrar quién modificó una fórmula, cuándo y con qué parámetros, garantizando que jamás se filtren secretos o credenciales.
- **Decisión:** Implementar un servicio centralizado (`recordAuditEvent`) que persiste eventos inmutables en la tabla `AuditEvent`, aplicando una capa de sanitización que normaliza claves (eliminando guiones, guiones bajos y mayúsculas) y ofusca claves sensibles (`password`, `token`, `secret`, `api_key`, `private_key`, `credential`, `auth_header`, `bearer`, `cookie`, `session`, `signature`, `passphrase`) en objetos planos, anidados y arrays.
- **Consecuencias:**
  - *Positivas:* Trazabilidad total sin riesgo de fuga de credenciales en logs de auditoría ante variaciones de nombres de clave.

---

## ADR-008: Implementación Progresiva del Modelo de Datos (Foundation First)
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Muchas entidades nutricionales y regulatorias están sujetas a validación con el cliente en el Kick-Off de la Semana 1. Crear tablas físicas especulativas generaría deuda técnica y migraciones destructivas.
- **Decisión:** En SPEC-001 (Platform Foundation) únicamente se migran las tablas esenciales (`User`, `Session`, `Account`, `Verification`, `Role`, `AuditEvent`). El resto de entidades se mantienen en el modelo conceptual (`docs/DOMAIN.md`) y se implementarán en sus respectivas SPECs según el cronograma.
- **Consecuencias:**
  - *Positivas:* Cero deuda técnica por suposiciones erróneas, base de datos limpia y verificable.

---

## ADR-009: Adopción de Better Auth como Proveedor Canónico de Autenticación
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Se requería una solución estándar y robusta para Next.js que gestionase el ciclo de vida de autenticación por email y contraseña, hashing seguro (scrypt/bcrypt), almacenamiento de sesiones en PostgreSQL con adapter Prisma y transporte mediante cookies HTTP-Only seguras, evitando mantener código criptográfico propio.
- **Decisión:** Integrar `better-auth` (v1.7+) como el motor canónico de autenticación.
- **Consecuencias:**
  - *Positivas:* Cero mantenimiento de criptografía y sesiones caseras, tablas estandarizadas (`Account`, `Verification`, `Session`, `User`), soporte para extensiones futuras (SSO, 2FA) si se aprueba en el Kick-Off.
