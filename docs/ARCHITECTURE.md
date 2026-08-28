# ARCHITECTURE.md — Arquitectura del Sistema

## 1. Principios de Arquitectura

1. **Modular Monolith:** Un único artefacto desplegable estructurado internamente en módulos cohesivos y con bajo acoplamiento. Permite velocidad de iteración y simplicidad operativa sin los costos de infraestructura de microservicios.
2. **Separación de UI y Dominio:** Los componentes de React se limitan a la presentación, interacción y accesibilidad. Toda regla de negocio y cálculo reside en capas de servicio y dominio en el servidor.
3. **Server-Side Authorization & Defense in Depth:** La seguridad no depende del frontend. Cada Server Action o Route Handler valida la sesión y los permisos del actor antes de ejecutar cualquier operación.
4. **Validación en Límites con Zod:** Todo dato entrante (formularios, APIs, cargas de archivos) se valida exhaustivamente mediante esquemas Zod antes de alcanzar la capa de dominio.
5. **Acceso a Datos mediante Prisma:** ORM tipado para acceso a PostgreSQL con migraciones versionadas y consultas seguras.
6. **Auditoría como Capacidad Transversal:** El subsistema de auditoría registra eventos críticos del ciclo de vida de las entidades sin almacenar secretos ni credenciales.
7. **Pragmatismo sin Sobrediseño:** Sin brokers de mensajes externos (Kafka), sin Redis en fase inicial, sin microservicios innecesarios.

---

## 2. Pila Tecnológica (Tech Stack)

| Capa | Tecnología | Justificación |
|---|---|---|
| **Framework Web** | Next.js 16+ (App Router) | SSR/RSC moderno, Server Actions para mutaciones seguras y ruteo optimizado. |
| **Lenguaje** | TypeScript (Strict Mode) | Tipado estático riguroso de extremo a extremo, previniendo errores en tiempo de compilación. |
| **Base de Datos** | PostgreSQL | Base de datos relacional robusta con soporte nativo de transacciones ACID y JSONB para metadatos. |
| **ORM & Migraciones**| Prisma | Tipado automático generado desde el schema, migraciones declarativas y consultas seguras. |
| **Estilos & UI** | Tailwind CSS + shadcn/ui pattern | UI empresarial B2B limpia, rápida, accesible y altamente mantenible. |
| **Validación** | Zod | Inferencia de tipos estáticos a partir de esquemas de validación de tiempo de ejecución. |
| **Testing** | Vitest | Ejecución ultra-rápida de tests unitarios y de integración con soporte TypeScript nativo. |
| **Contenedores Dev** | Docker Compose (Postgres) | Entorno local de base de datos reproducible e independiente. |
| **Gestor de Paquetes**| pnpm | Gestión eficiente, determinista y rápida de dependencias. |

---

## 3. Diagrama de Arquitectura por Capas

```
+-------------------------------------------------------------------------------+
|                             CLIENT / BROWSER                                  |
|  - React Server Components (RSC)                                              |
|  - Interactive Client Components (Forms, Tables, Modals)                      |
|  - Tailwind CSS / Radix Primitives                                            |
+-------------------------------------------------------------------------------+
                                      │ HTTP / Server Actions
                                      ▼
+-------------------------------------------------------------------------------+
|                         NEXT.JS APP ROUTER LAYER                              |
|  - Route Middleware (Session extraction & Route Protection)                  |
|  - Server Actions & Route Handlers                                            |
|  - Boundary Validation (Zod Schemas)                                          |
+-------------------------------------------------------------------------------+
                                      │ Validated DTOs / Context
                                      ▼
+-------------------------------------------------------------------------------+
|                       DOMAIN & APPLICATION SERVICES                           |
|  - Auth & Session Service                                                     |
|  - Role & Authorization Service                                               |
|  - Audit Service (Transversal)                                                |
|  - [Future] Nutritional Calculation Engine                                    |
|  - [Future] Formulation & Cost Services                                       |
+-------------------------------------------------------------------------------+
                                      │ Prisma Client
                                      ▼
+-------------------------------------------------------------------------------+
|                          PERSISTENCE & DATA LAYER                             |
|  - Prisma ORM (Typed Queries, Relations, Transactions)                       |
|  - PostgreSQL Database (Tables: User, Session, Role, AuditEvent, etc.)       |
+-------------------------------------------------------------------------------+
```

---

## 4. Estructura de Directorios del Código

```
/
├── AGENTS.md                  # Protocolo de gobernanza y autonomía de agentes
├── README.md                  # Guía de inicio y puesta en marcha
├── docker-compose.yml         # Contenedor de PostgreSQL para desarrollo local
├── .env.example               # Variables de entorno documentadas (sin secretos)
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración TypeScript strict
├── tailwind.config.ts         # Configuración de estilos y temas
├── prisma/
│   ├── schema.prisma          # Definición de modelos de datos
│   └── seed.ts                # Semilla para entorno de desarrollo (Admin inicial)
├── docs/                      # Documentación arquitectónica y de producto
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DOMAIN.md
│   ├── DECISIONS.md
│   ├── OPEN-QUESTIONS.md
│   ├── DATA-SOURCES.md
│   ├── SECURITY.md
│   └── specs/
│       └── SPEC-001-platform-foundation.md
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Rutas públicas de autenticación (login)
│   │   │   └── login/
│   │   ├── (app)/             # Rutas protegidas de la aplicación
│   │   │   ├── layout.tsx     # Shell autenticado con Sidebar y Header
│   │   │   ├── dashboard/     # Vista principal de resumen
│   │   │   ├── ingredientes/  # Placeholder Semana 2
│   │   │   ├── productos/     # Placeholder Semana 3
│   │   │   ├── formulaciones/ # Placeholder Semana 3
│   │   │   ├── costos/        # Placeholder Semana 5
│   │   │   ├── normativa/     # Placeholder Semana 4
│   │   │   ├── documentos/    # Placeholder Semana 6
│   │   │   ├── usuarios/      # Gestión de usuarios y roles
│   │   │   └── auditoria/     # Consulta de eventos de auditoría
│   │   ├── actions/           # Next.js Server Actions (mutaciones seguras)
│   │   ├── api/               # API Route Handlers técnicos
│   │   ├── error.tsx          # Error boundary global
│   │   ├── loading.tsx        # Loading state global
│   │   └── not-found.tsx      # 404 handler
│   ├── components/
│   │   ├── ui/                # Primitivas de interfaz de usuario
│   │   └── layout/            # Sidebar, Header, UserMenu, ModulePlaceholder
│   ├── lib/
│   │   ├── db.ts              # Instancia singleton de Prisma Client
│   │   ├── auth/              # Lógica de contraseñas, sesiones y roles
│   │   ├── audit/             # Servicio transversal de registro de auditoría
│   │   └── validations/       # Esquemas de validación Zod
│   └── middleware.ts          # Middleware de protección de rutas privadas
└── tests/
    ├── unit/                  # Tests unitarios (auth, audit, roles, validación)
    └── integration/           # Tests de integración y protección de endpoints
```

---

## 5. Estrategia de Auditoría y Trazabilidad

El servicio de auditoría (`src/lib/audit/audit-service.ts`) expone una API declarativa:

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

**Garantías de Auditoría:**
1. Sanitización estricta: los campos sensibles (`password`, `token`, `secret`) se eliminan antes de persistir en `metadata`.
2. Persistencia en base de datos en tabla inmutable `AuditEvent`.
3. Fallbacks resilientes: si el logging de auditoría falla, no debe corromper la transacción principal de manera silenciosa, pero se registra en logs de servidor estructurados.

---

## 6. Evolución a 6 Semanas

El Modular Monolith permite la adición secuencial de módulos por carpetas (`src/modules/*` o dentro de `src/lib/*`), manteniendo aislamiento de responsabilidades y facilitando una eventual extracción a servicios independientes sólo si la escala del negocio lo justificase en el futuro.
