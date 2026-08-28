# SECURITY.md — Políticas y Prácticas de Seguridad

Este documento define los estándares de seguridad implementados en la **Plataforma Centralizada de Gestión Técnica y Nutricional** de **Alimentos Sevilla S.A.S.** desde su fase inicial de Platform Foundation (SPEC-001).

---

## 1. Principios de Seguridad

1. **Defensa en Profundidad (Defense in Depth):** Las comprobaciones de autorización se ejecutan obligatoriamente en el servidor en cada Server Action, Route Handler y carga de página, sin confiar en el estado del cliente o la visibilidad de elementos visuales en React.
2. **Principio de Menor Privilegio (Least Privilege):** Cada rol tiene acceso estrictamente a las operaciones requeridas para su función.
3. **Validación Exhaustiva en Boundaries:** Ningún dato no confiable ingresa a la capa de dominio sin ser parseado y validado mediante esquemas estrictos de **Zod**.
4. **Protección de Datos Sensibles:** Contraseñas, tokens de sesión y secretos nunca se almacenan en texto plano ni se registran en logs o eventos de auditoría.
5. **Fail-Closed en Producción:** Las herramientas de prueba y seeds de demostración están expresamente bloqueadas en entornos de producción.

---

## 2. Autenticación y Gestión de Contraseñas (Better Auth)

- **Motor de Autenticación:** Se utiliza **Better Auth (v1.7+)** con adapter Prisma para PostgreSQL.
- **Hashing de Contraseñas:** Better Auth gestiona el hashing mediante funciones criptográficas de derivación de claves seguras con salting automático por usuario. Las credenciales se almacenan exclusivamente en la tabla `Account`.
- **Políticas de Contraseña:** Mínimo 8 caracteres, requiriendo al menos una letra mayúscula, una minúscula y un número.

---

## 3. Manejo de Sesiones y Protección de Rutas

- **Mecanismo:** Sesiones con identificador criptográficamente seguro almacenadas en la base de datos (tabla `Session`) asociadas a la tabla `User`.
- **Transporte de Sesión:** Cookies HTTP-Only emitidas por Better Auth con directivas estrictas:
  - `httpOnly: true` (Inaccesible desde JavaScript en el navegador, previene robo de sesión por XSS).
  - `secure: process.env.NODE_ENV === 'production'` (Transmisión sobre HTTPS en producción).
  - `sameSite: 'lax'` (Protección contra CSRF).
  - `maxAge: 8 * 60 * 60` (8 horas de vigencia).
- **Control de Inactividad de Usuario (FIX-03):** La capa de autorización del servidor verifica en tiempo real que `user.isActive === true`. Si un usuario es marcado como inactivo (`isActive: false`), cualquier petición es **rechazada inmediatamente** server-side independientemente de la validez temporal del token de sesión. Además, la acción administrativa revoca todas las sesiones activas en la tabla `Session`.

---

## 4. Autorización Server-Side y RBAC

- El Proxy/Middleware de Next.js (`src/proxy.ts`) intercepta las peticiones a rutas protegidas (`/(app)/*`), redirigiendo a `/login` si no existe la cookie de sesión de Better Auth.
- Los Server Components (`src/app/(app)/layout.tsx`) y Server Actions validan el usuario activo mediante `getCurrentUser()` en el servidor.
- La verificación de roles se ejecuta mediante funciones de guarda tipadas:
  ```typescript
  export async function requireRole(allowedRoles: Role[]): Promise<void> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new Error('FORBIDDEN');
    }
  }
  ```

---

## 5. Sanitización Normalizada de Auditoría (`AuditEvent`)

El servicio `src/lib/audit/audit-service.ts` implementa un algoritmo de sanitización que normaliza las claves (convirtiendo a minúsculas y eliminando guiones, guiones bajos y espacios) y ofusca recursivamente cualquier término coincidente:

```typescript
const SENSITIVE_KEY_PATTERNS = [
  "password", "token", "secret", "auth", "credential",
  "cookie", "session", "key", "signature", "passphrase", "bearer"
];
```

**Cobertura de Sanitización:**
- Variantes de casing: `password_hash`, `passwordHash`, `api_key`, `apiKey`, `api-key`, `private_key`, `privateKey`, `auth_header`, `authHeader`, `client_secret`, `bearer_token`, etc.
- Objetos planos, estructuras profundamente anidadas y colecciones (arrays).

---

## 6. Gestión de Secretos y Variables de Entorno

- `.env`, `.env.local` y `.env.production` están explícitamente ignorados en `.gitignore`.
- Se mantiene `.env.example` documentando todas las variables requeridas con valores sintéticos de ejemplo.
- Secretos principales:
  - `DATABASE_URL`: Cadena de conexión a PostgreSQL.
  - `BETTER_AUTH_SECRET`: Secreto criptográfico de Better Auth.
  - `POSTGRES_PORT`: Puerto expuesto en contenedor local de desarrollo.

---

## 7. Políticas de Seed y Bootstrap en Producción

- `prisma/seed.ts` implementa **fail-closed**: si `NODE_ENV === "production"`, el script aborta inmediatamente la creación de cuentas de demostración.
- El bootstrap del primer administrador se realiza a través de variables de entorno seguras (`INITIAL_ADMIN_*`) configuradas deliberadamente por el equipo de operaciones.
