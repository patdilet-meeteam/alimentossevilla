# Plataforma Centralizada de Gestión Técnica y Nutricional

**Cliente:** Alimentos Sevilla S.A.S.  
**Estado:** Semana 2 completada — Catálogo de Ingredientes y Perfiles Nutricionales (**SPEC-001 y SPEC-002**)
**Stack:** Next.js 16+ (App Router, Turbopack), React 19, TypeScript Strict, Better Auth 1.7+, PostgreSQL, Prisma, Tailwind CSS, Zod, Vitest, pnpm.

---

## 1. Descripción del Proyecto

La **Plataforma Centralizada de Gestión Técnica y Nutricional** es una solución web empresarial diseñada para consolidar, automatizar y estandarizar la gestión de materias primas, formulaciones, cálculos nutricionales normativos (sellos frontales de advertencia, tablas de rotulado), costeo mensual de recetas y emisión de documentos técnicos para Alimentos Sevilla S.A.S., reemplazando hojas de cálculo dispersas.

> **GOBERNANZA TÉCNICA Y REGLAS FUNDAMENTALES:**
> - La Foundation (SPEC-001) y el Catálogo de Ingredientes y Perfiles Nutricionales (SPEC-002) están implementados. El siguiente alcance pendiente es SPEC-003: Productos, Formulaciones y Versionamiento.
> - **NO** se han inventado fórmulas de cálculo nutricional, límites de sellos ni reglas de negocio prematuras antes del Kick-Off funcional.
> - **NO** existe integración directa vía API con el ERP SIESA. Toda asociación se realiza mediante el código de materia prima SIESA presente en los archivos de costos mensuales.
> - **Autenticación:** Gestionada canónicamente por **Better Auth** con persistencia en PostgreSQL mediante Prisma.
> - **Autorización:** Gestionada por la aplicación mediante roles estrictos y comprobación del estado activo del usuario.

---

## 2. Estructura de Documentación de Referencia

| Documento | Ubicación | Descripción |
|---|---|---|
| **Protocolo de Gobernanza y Autonomía** | [`AGENTS.md`](AGENTS.md) | Reglas de autonomía de agentes, límites y disparadores de escalamiento (E1-E7). |
| **Visión de Producto** | [`docs/PRODUCT.md`](docs/PRODUCT.md) | Objetivos, contexto de negocio y alcance modular a 6 semanas. |
| **Arquitectura de la Solución** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Principios de Monolito Modular, Better Auth y directrices técnicas. |
| **Modelo Conceptual de Dominio** | [`docs/DOMAIN.md`](docs/DOMAIN.md) | Modelo V0 categorizado en conceptos confirmados, provisionales y preguntas abiertas. |
| **Registro de Decisiones (ADRs)** | [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisiones arquitectónicas fundamentales formalizadas (ADR-001 a ADR-009). |
| **Catálogo de Preguntas Abiertas** | [`docs/OPEN-QUESTIONS.md`](docs/OPEN-QUESTIONS.md) | Catálogo unificado de dudas funcionales y normativas pendientes de Kick-Off. |
| **Fuentes de Datos e Insumos** | [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md) | Documentación de archivos Excel de referencia, textos legales y muestras de costos. |
| **Políticas de Seguridad** | [`docs/SECURITY.md`](docs/SECURITY.md) | Estándares de Better Auth, sesiones, autorización server-side y sanitización normalizada. |
| **Especificación Técnica SPEC-001** | [`docs/specs/SPEC-001-platform-foundation.md`](docs/specs/SPEC-001-platform-foundation.md) | Alcance detallado, criterios de aceptación y matriz de verificación de Foundation. |
| **Especificación Técnica SPEC-002** | [`docs/specs/SPEC-002-ingredients-catalog.md`](docs/specs/SPEC-002-ingredients-catalog.md) | Catálogo de ingredientes y perfiles nutricionales implementado. |

---

## 3. Requisitos Previos

- **Node.js:** v20.x o v24.x LTS
- **pnpm:** v9.x o v10.x (`npm i -g pnpm`)
- **Docker & Docker Compose:** (Para ejecutar PostgreSQL localmente)

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
*(Si el puerto `5432` de PostgreSQL ya está en uso en su máquina por otra base de datos local, modifique `POSTGRES_PORT=5439` en `.env` y ajuste `DATABASE_URL` acorde).*

### Paso 3: Iniciar PostgreSQL con Docker Compose
```bash
pnpm db:docker
# O directamente: docker compose up -d
```

### Paso 4: Aplicar migraciones versionadas
```bash
pnpm db:migrate
# Para entornos limpios / producción: pnpm db:deploy
```

### Paso 5: Ejecutar la inicialización de usuarios (Seed de Desarrollo)
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

El script de semilla inicializa cuentas de prueba para los 4 roles base soportados (bloqueado en producción):

| Rol | Correo Electrónico | Contraseña por Defecto |
|---|---|---|
| **Administrador** | `admin@alimentossevilla.com` | `AdminSevilla2026!#` |
| **Investigación y Desarrollo (I+D)** | `id@alimentossevilla.com` | `IDSevilla2026!#` |
| **Calidad** | `calidad@alimentossevilla.com` | `CalidadSevilla2026!#` |
| **Consulta** | `consulta@alimentossevilla.com` | `ConsultaSevilla2026!#` |

---

## 6. Comandos de Verificación y Calidad

```bash
# Ejecutar suite completa de pruebas (unitarias e integración real con PostgreSQL)
pnpm test

# Verificación estricta de tipos con TypeScript
pnpm typecheck

# Análisis estático de código con ESLint
pnpm lint

# Compilación de producción con Next.js 16 (Turbopack)
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

---

## 8. Despliegue en Producción

Requiere Docker y un proxy HTTPS en el servidor conectado a una red Docker externa (por defecto `proxy`).

```bash
# 1. Variables de producción (archivo ignorado por git)
cp .env.production.example .env.production
#    Complete BETTER_AUTH_URL, BETTER_AUTH_SECRET, POSTGRES_PASSWORD e INITIAL_ADMIN_*

# 2. Construir, migrar y arrancar
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 3. Solo la primera vez: administrador inicial y catálogo de nutrientes
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrar pnpm admin:bootstrap
```

### Usuarios

El registro público está cerrado y el panel aún no permite crear usuarios ni cambiar contraseñas. Se hace desde el servidor; la contraseña la genera el comando y se muestra una sola vez:

```bash
# Crear (roles: ADMIN, R_AND_D, QUALITY, VIEWER)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrar \
  pnpm user:create --email ana@alimentossevilla.com --name "Ana Pérez" --role R_AND_D

# Restablecer contraseña (cierra todas sus sesiones)
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrar \
  pnpm user:create --email ana@alimentossevilla.com --reset-password
```

En desarrollo: `pnpm user:create ...` directamente.

La aplicación no arranca si falta `BETTER_AUTH_SECRET`, si es el valor de ejemplo o si falta `BETTER_AUTH_URL`. El registro público está deshabilitado: las cuentas se crean desde el servidor. Detalle en [`docs/SECURITY.md`](docs/SECURITY.md) §2, §6, §7 y §8.
