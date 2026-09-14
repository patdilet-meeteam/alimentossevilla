# ARCHITECTURE.md — Arquitectura del Sistema

## 1. Principios de Arquitectura

1. **Modular Monolith:** Un único artefacto desplegable estructurado internamente en módulos cohesivos y con bajo acoplamiento. Permite velocidad de iteración y consistencia transaccional sin incurrir en costos operativos ni latencias de red de microservicios.
2. **Separación de UI, Autenticación y Dominio:**
   - **Autenticación (Better Auth):** Resuelve el ciclo de vida de credenciales, hashing, creación de sesiones, tokens criptográficos y cookies seguras.
   - **Autorización de Aplicación:** Resuelve permisos funcionales, verificación de roles (`ADMIN`, `R_AND_D`, `QUALITY`, `VIEWER`) y estado de activación (`isActive`).
   - **Lógica de Dominio:** Servicios puros y Server Actions sin acoplamiento a frameworks de renderizado.
3. **Flujo de Seguridad Server-Side:**
   ```
   Better Auth (Session Cookie / Token)
       ↓
   Validación de Sesión en BD
       ↓
   Capa de Autorización de Dominio (getCurrentUser)
       ↓
   Verificación de Rol (requireRole) + Estado Activo (isActive === true)
       ↓
   Operación de Negocio / Persistencia
   ```
4. **Server-Side Authorization & Defense in Depth:** La seguridad se valida en cada Server Action, Route Handler y carga de página, sin confiar en componentes de cliente.
5. **Validación en Límites con Zod:** Todo dato entrante se valida exhaustivamente mediante esquemas Zod antes de alcanzar la capa de dominio.
6. **Acceso a Datos mediante Prisma:** ORM tipado para acceso a PostgreSQL con migraciones versionadas (`prisma/migrations`) y consultas seguras.
7. **Auditoría como Capacidad Transversal:** El subsistema de auditoría registra eventos críticos del ciclo de vida de las entidades, aplicando sanitización automática con normalización de nombres de clave.
8. **Pragmatismo sin Sobrediseño:** Sin brokers de mensajes externos (Kafka), sin Redis en fase inicial, sin infraestructura innecesaria.

---

## 2. Pila Tecnológica (Tech Stack)

| Capa | Tecnología | Justificación |
|---|---|---|
| **Framework Web** | Next.js 16+ (App Router, Turbopack) | SSR/RSC moderno, Server Actions para mutaciones seguras y Proxy unificado. |
| **Autenticación & Sesiones** | Better Auth (v1.7+) | Motor canónico de autenticación con adapter Prisma para PostgreSQL, hashing y cookies seguras. |
| **Lenguaje** | TypeScript (Strict Mode) | Tipado estático riguroso de extremo a extremo (`strict: true`). |
| **Base de Datos** | PostgreSQL | Base de datos relacional robusta con soporte nativo de transacciones ACID y JSONB para metadatos. |
| **ORM & Migraciones**| Prisma | Tipado automático generado desde el schema, migraciones declarativas y consultas seguras. |
| **Estilos & UI** | Tailwind CSS + shadcn/ui pattern | UI empresarial B2B limpia, rápida, accesible y altamente mantenible. |
| **Validación** | Zod | Inferencia de tipos estáticos a partir de esquemas de validación de tiempo de ejecución. |
| **Testing** | Vitest | Ejecución ultra-rápida de tests unitarios y de integración con soporte TypeScript nativo. |
| **Contenedores Dev** | Docker Compose (Postgres parametrizable) | Entorno local de base de datos reproducible e independiente con puerto configurable. |
| **Gestor de Paquetes**| pnpm | Gestión eficiente, determinista y rápida de dependencias. |

---

## 3. Diagrama de Arquitectura por Capas

```
+-------------------------------------------------------------------------------+
|                             CLIENT / BROWSER                                  |
|  - React Server Components (RSC)                                              |
|  - Interactive Client Components (Forms, Tables, Modals)                      |
|  - Better Auth Client (authClient.signIn / signOut)                           |
+-------------------------------------------------------------------------------+
                                      │ HTTP / Server Actions / Proxy
                                      ▼
+-------------------------------------------------------------------------------+
|                         NEXT.JS APP ROUTER LAYER                              |
|  - Proxy / Middleware (Session extraction & Route Protection)                 |
|  - Server Actions & Route Handlers (/api/auth/[...all])                       |
|  - Boundary Validation (Zod Schemas)                                          |
+-------------------------------------------------------------------------------+
                                      │ Validated Context (SafeUser)
                                      ▼
+-------------------------------------------------------------------------------+
|                       DOMAIN & APPLICATION SERVICES                           |
|  - Better Auth Server (auth.ts)                                               |
|  - Role & Authorization Service (requireRole, hasRole, isActive verification) |
|  - Audit Service (Transversal con sanitización normalizada)                   |
|  - [Future] Nutritional Engine, Formulation & Cost Services                   |
+-------------------------------------------------------------------------------+
                                      │ Prisma Client
                                      ▼
+-------------------------------------------------------------------------------+
|                          PERSISTENCE & DATA LAYER                             |
|  - Prisma ORM (Typed Queries, Relations, Transactions)                       |
|  - PostgreSQL Database (users, sessions, accounts, verifications, audit_events)|
+-------------------------------------------------------------------------------+
```

---

## 4. Estructura de Directorios del Código

```
/
├── AGENTS.md                  # Protocolo de gobernanza y autonomía de agentes
├── README.md                  # Guía de inicio y puesta en marcha
├── docker-compose.yml         # Contenedor de PostgreSQL con puerto parametrizado
├── .env.example               # Variables de entorno documentadas (sin secretos)
├── package.json               # Dependencias y scripts (Next 16, Better Auth, Prisma)
├── tsconfig.json              # Configuración TypeScript strict
├── tailwind.config.ts         # Configuración de estilos y temas
├── prisma/
│   ├── schema.prisma          # Definición de modelos de datos
│   ├── migrations/            # Migraciones SQL físicas versionadas
│   └── seed.ts                # Semilla para desarrollo (fail-closed en producción)
├── docs/                      # Documentación arquitectónica y de producto
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DOMAIN.md
│   ├── DECISIONS.md
│   ├── OPEN-QUESTIONS.md
│   ├── DATA-SOURCES.md
│   ├── SECURITY.md
│   └── specs/
│       ├── SPEC-001-platform-foundation.md
│       └── SPEC-002-ingredients-catalog.md
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Rutas públicas de autenticación (login)
│   │   ├── (app)/             # Rutas protegidas de la aplicación
│   │   │   ├── layout.tsx     # Shell autenticado con Sidebar y Header
│   │   │   ├── dashboard/     # Vista principal de resumen
│   │   │   ├── ingredientes/  # Catálogo y perfiles nutricionales (SPEC-002)
│   │   │   ├── productos/     # Placeholder Semana 3
│   │   │   ├── formulaciones/ # Placeholder Semana 3
│   │   │   ├── costos/        # Placeholder Semana 5
│   │   │   ├── normativa/     # Placeholder Semana 4
│   │   │   ├── documentos/    # Placeholder Semana 6
│   │   │   ├── usuarios/      # Gestión de usuarios y roles
│   │   │   └── auditoria/     # Consulta de eventos de auditoría
│   │   ├── actions/           # Next.js Server Actions (mutaciones seguras)
│   │   ├── api/               # API Route Handlers (/api/auth/[...all])
│   │   ├── error.tsx          # Error boundary global
│   │   ├── loading.tsx        # Loading state global
│   │   └── not-found.tsx      # 404 handler
│   ├── components/
│   │   ├── ui/                # Primitivas de interfaz de usuario
│   │   └── layout/            # Sidebar, Header, ModulePlaceholder
│   ├── lib/
│   │   ├── db.ts              # Instancia singleton de Prisma Client
│   │   ├── auth/              # Better Auth server (auth.ts), client y roles.ts
│   │   ├── audit/             # Servicio transversal de auditoría sanitizada
│   │   └── validations/       # Esquemas de validación Zod
│   └── proxy.ts               # Proxy de protección de rutas Next.js 16
└── tests/
    ├── unit/                  # Tests unitarios (roles, validación, audit-sanitizer)
    └── integration/           # Tests de integración contra PostgreSQL real
```

---

## 5. Estrategia de Auditoría y Trazabilidad

El servicio de auditoría (`src/lib/audit/audit-service.ts`) aplica normalización y ofuscación sobre cualquier clave sensible antes de su almacenamiento en PostgreSQL:

```typescript
await recordAuditEvent({
  actorId: user.id,
  actorEmail: user.email,
  action: 'USER_ROLE_UPDATED',
  entity: 'User',
  entityId: targetUserId,
  metadata: { previousRole: 'VIEWER', newRole: 'R_AND_D' }
});
```
