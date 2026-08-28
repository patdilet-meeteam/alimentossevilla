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
  - *Trade-off:* Requiere aprovisionamiento de instancia Postgres administrada o contenedor Docker en desarrollo.

---

## ADR-003: Prisma como ORM y Motor de Migraciones Declarativas
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Se requiere un acceso a base de datos fuertemente tipado en TypeScript, con generación automática de tipos y control determinista de migraciones a lo largo de las 6 semanas del proyecto.
- **Decisión:** Utilizar Prisma ORM (`@prisma/client` y `prisma` CLI).
- **Consecuencias:**
  - *Positivas:* Tipado estático completo en tiempo de desarrollo, autocompletado y validación de esquema centralizado en `schema.prisma`.
  - *Mitigación:* Escribir scripts de semilla reproducibles (`seed.ts`) para inicialización de entornos de prueba y desarrollo.

---

## ADR-004: Next.js 16+ con App Router y TypeScript Estricto
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Se necesita una aplicación web con Server-Side Rendering (RSC) para proteger información sensible y Server Actions para procesar mutaciones de manera segura sin exponer APIs REST públicas desprotegidas.
- **Decisión:** Utilizar Next.js con App Router en modo estricto de TypeScript (`"strict": true`).
- **Consecuencias:**
  - *Positivas:* Excelente rendimiento inicial, componentes de servidor con acceso directo y seguro a la capa de datos, validación centralizada en el backend.
  - *Mitigación:* Disciplina estricta en no mezclar lógica de negocio pesada dentro del JSX de los componentes.

---

## ADR-005: Autorización en el Servidor y Sesiones Seguras Basadas en Cookies HTTP-Only
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** La plataforma procesará formulaciones secretas y costos industriales confidenciales. La seguridad no puede delegarse a controles puramente cosméticos en el cliente (como deshabilitar botones en React).
- **Decisión:** Implementar sesiones en base de datos con tokens criptográficos opacos almacenados en cookies HTTP-only, `SameSite=Lax`, con flags `Secure` en producción. La verificación de identidad y rol se ejecuta del lado del servidor en cada mutación (Server Action) y a través del middleware de Next.js.
- **Consecuencias:**
  - *Positivas:* Inmunidad a ataques XSS de robo de token por `localStorage`, revocación inmediata de sesiones desde base de datos y control de acceso robusto.
  - *Trade-off:* Consulta de sesión en base de datos en peticiones autenticadas (mitigada por índices en `token`).

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

## ADR-007: Subsistema Transversal de Auditoría (AuditEvent) con Sanitización
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Cumplimiento con auditorías de calidad alimentaria y trazabilidad corporativa exigen registrar quién modificó una fórmula, cuándo y con qué parámetros.
- **Decisión:** Implementar un servicio centralizado (`recordAuditEvent`) que persiste eventos inmutables en la tabla `AuditEvent`, aplicando una capa de sanitización que bloquea el almacenamiento de secretos, contraseñas o tokens en los campos de metadatos.
- **Consecuencias:**
  - *Positivas:* Trazabilidad total sin riesgo de fuga de credenciales en logs de auditoría.
  - *Mitigación:* Invocar el servicio de forma transversal en las acciones críticas de cada módulo a medida que se implementen.

---

## ADR-008: Implementación Progresiva del Modelo de Datos (Foundation First)
- **Estado:** Aceptado
- **Fecha:** 2026-08-27 (Semana 1)
- **Contexto:** Muchas entidades nutricionales y regulatorias están sujetas a validación con el cliente en el Kick-Off de la Semana 1. Crear tablas físicas especulativas generaría deuda técnica y migraciones destructivas.
- **Decisión:** En SPEC-001 (Platform Foundation) únicamente se migran las tablas esenciales (`User`, `Session`, `Role`, `AuditEvent`). El resto de entidades se mantienen en el modelo conceptual (`docs/DOMAIN.md`) y se implementarán en sus respectivas SPECs según el cronograma.
- **Consecuencias:**
  - *Positivas:* Cero deuda técnica por suposiciones erróneas, base de datos limpia y verificable.
  - *Trade-off:* Los módulos futuros presentan interfaces de placeholder durante la Semana 1.
