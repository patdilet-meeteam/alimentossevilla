# Plataforma Centralizada de Gestión Técnica y Nutricional

**Cliente:** Alimentos Sevilla S.A.S.  
**Estado:** Semana 1 — Levantamiento y Diseño (**SPEC-001: Platform Foundation**)  
**Stack:** Next.js 15+ (App Router), React 19, TypeScript Strict, PostgreSQL, Prisma, Tailwind CSS, Zod, Vitest, pnpm.

---

## 1. Descripción del Proyecto

La **Plataforma Centralizada de Gestión Técnica y Nutricional** es una solución web empresarial diseñada para consolidar, automatizar y estandarizar la gestión de materias primas, formulaciones, cálculos nutricionales normativos (sellos frontales de advertencia, tablas de rotulado), costeo mensual de recetas y emisión de documentos técnicos para Alimentos Sevilla S.A.S., reemplazando hojas de cálculo dispersas.

> **IMPORTANTE — GOBERNANZA TÉCNICA:**
> - El sistema opera actualmente en fase **SPEC-001 (Platform Foundation)**.
> - **NO** se han inventado fórmulas de cálculo nutricional, límites de sellos ni reglas de negocio prematuras antes del Kick-Off funcional.
> - **NO** existe integración directa vía API con el ERP SIESA. Toda asociación se realiza mediante el código de materia prima SIESA presente en los archivos de costos mensuales.

---

## 2. Estructura de Documentación de Referencia

| Documento | Ubicación | Descripción |
|---|---|---|
| **Protocolo de Gobernanza y Autonomía** | [`AGENTS.md`](AGENTS.md) | Reglas de autonomía de agentes, límites y disparadores de escalamiento (E1-E7). |
| **Visión de Producto** | [`docs/PRODUCT.md`](docs/PRODUCT.md) | Objetivos, contexto de negocio y alcance modular a 6 semanas. |
| **Arquitectura de la Solución** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Principios de Monolito Modular, capas de software y directrices técnicas. |
| **Modelo Conceptual de Dominio** | [`docs/DOMAIN.md`](docs/DOMAIN.md) | Modelo V0 categorizado en conceptos confirmados, provisionales y preguntas abiertas. |
| **Registro de Decisiones (ADRs)** | [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisiones arquitectónicas fundamentales formalizadas (ADR-001 a ADR-008). |
| **Catálogo de Preguntas Abiertas** | [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) | Catálogo unificado de dudas funcionales y normativas pendientes de Kick-Off. |
| **Fuentes de Datos e Insumos** | [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md) | Documentación de archivos Excel de referencia, textos legales y muestras de costos. |
| **Políticas de Seguridad** | [`docs/SECURITY.md`](docs/SECURITY.md) | Estándares de autenticación, sesiones, autorización server-side y sanitización. |
| **Especificación Técnica SPEC-001** | [`docs/specs/SPEC-001-platform-foundation.md`](docs/specs/SPEC-001-platform-foundation.md) | Alcance detallado, criterios de aceptación y matriz de verificación de Foundation. |

---

## 3. Requisitos Previos

- **Node.js:** v20.x o v24.x LTS
- **pnpm:** v9.x o v10.x (`npm i -g pnpm`)
- **Docker & Docker Compose:** (Para levantar PostgreSQL localmente)

---

## 4. Guía de Instalación y Puesta en Marcha Local

### Paso 1: Clonar e instalar dependencias
```bash
pnpm install
```

### Paso 2: Configurar variables de entorno
Copie el archivo de ejemplo:
```bash
cp .env.example .env
```
*(Ajuste `DATABASE_URL` y secretos si su entorno local difiere del estándar).*

### Paso 3: Iniciar PostgreSQL con Docker Compose
```bash
pnpm db:docker
# O directamente: docker compose up -d
```

### Paso 4: Sincronizar el esquema de base de datos
```bash
pnpm db:push
# O para migraciones versionadas: pnpm db:migrate
```

### Paso 5: Ejecutar la semilla inicial de usuarios (Seed)
```bash
pnpm db:seed
```

### Paso 6: Iniciar el servidor de desarrollo
```bash
pnpm dev
```
La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

---

## 5. Credenciales de Prueba (Entorno de Desarrollo)

El script de semilla inicializa cuentas de demostración para los 4 roles soportados:

| Rol | Correo Electrónico | Contraseña por Defecto |
|---|---|---|
| **Administrador** | `admin@alimentossevilla.com` | `AdminSevilla2026!#` |
| **Investigación y Desarrollo (I+D)** | `id@alimentossevilla.com` | `IDSevilla2026!#` |
| **Calidad** | `calidad@alimentossevilla.com` | `CalidadSevilla2026!#` |
| **Consulta** | `consulta@alimentossevilla.com` | `ConsultaSevilla2026!#` |

---

## 6. Comandos de Verificación y Calidad

```bash
# Ejecutar suite de pruebas con Vitest
pnpm test

# Verificación estricta de tipos con TypeScript
pnpm typecheck

# Análisis estático de código con ESLint
pnpm lint

# Compilación de producción
pnpm build
```

---

## 7. Módulos y Navegación de la Plataforma

- `/dashboard`: Panel ejecutivo con estado de la plataforma y accesos directos.
- `/ingredientes`: Catálogo de materias primas y perfiles nutricionales (*Semana 2*).
- `/productos`: Catálogo de productos y presentaciones comerciales (*Semana 3*).
- `/formulaciones`: Gestión y versionamiento de recetas (*Semana 3*).
- `/costos`: Costeo de formulaciones e importación mensual SIESA (*Semana 5*).
- `/normativa`: Motor de cálculo normativo y sellos regulatorios (*Semana 4*).
- `/documentos`: Emisión de Fichas Técnicas y Textos Legales (*Semana 6*).
- `/usuarios`: Administración de usuarios, roles y estados de cuenta (*Foundation*).
- `/auditoria`: Bitácora inmutable de eventos de auditoría y trazabilidad (*Foundation*).
