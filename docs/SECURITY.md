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
- **Registro público deshabilitado:** `emailAndPassword.disableSignUp: true` (`src/lib/auth/auth.ts`). El endpoint `POST /api/auth/sign-up/email` responde `400 EMAIL_PASSWORD_SIGN_UP_DISABLED`. Antes de este cambio cualquier persona en internet podía crearse una cuenta activa con rol `VIEWER`.
- **Alta de cuentas:** solo desde el servidor, con `provisionCredentialUser` (`src/lib/auth/provision-user.ts`), que usa el adaptador interno de Better Auth (mismo hash y misma cuenta `credential` que su registro). La bandera `disableSignUp` también bloquea `auth.api.signUpEmail` llamado desde el servidor, por eso el seed y el bootstrap no lo usan.
- **Orígenes de confianza:** `trustedOrigins` se construye con `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` (`src/lib/auth/config.ts`). En producción solo se acepta ese origen; las direcciones `localhost` solo fuera de producción. Una petición con otro `Origin` recibe `403 INVALID_ORIGIN`.

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
- **Fail-closed del secreto (`src/lib/auth/config.ts`):** en producción `BETTER_AUTH_SECRET` es obligatorio, debe tener al menos 32 caracteres y no puede ser el valor de ejemplo de `.env.example` (publicado en el repositorio: con él cualquiera podría firmar sesiones). Lo mismo para `BETTER_AUTH_URL`.
- **Validación al arrancar (`src/instrumentation.ts`):** el servidor comprueba esa configuración antes de atender peticiones y termina con código 1 si es inválida. Sin esta comprobación el error solo aparecía en la primera petición que cargaba Better Auth.
- `.env.production` está en `.gitignore`; las variables de producción se documentan en `.env.production.example`.

---

## 7. Políticas de Seed y Bootstrap en Producción

- `prisma/seed.ts` implementa **fail-closed**: si `NODE_ENV === "production"`, el script aborta inmediatamente la creación de cuentas de demostración.
- El bootstrap del primer administrador se realiza con `pnpm admin:bootstrap` (`scripts/bootstrap-admin.ts`) y las variables `INITIAL_ADMIN_*`, sin valores por defecto y validadas con `createUserSchema`. Si ya existe un administrador activo, no crea otro: no es una vía para fabricar administradores sobre una instalación en uso. También carga el catálogo de nutrientes (dato de referencia que el seed de desarrollo no deja en producción). Deja el evento `PLATFORM_BOOTSTRAPPED` en la auditoría.
- Las demás cuentas se crean con `pnpm user:create` (`scripts/create-user.ts`), validado con `createUserSchema`. La contraseña la genera el script con CSPRNG (20 caracteres, mayúscula, minúscula, número y símbolo; sin caracteres ambiguos): **nunca se recibe por argumento**, para que no quede en el historial de la terminal, y se muestra una sola vez. `--reset-password` reemplaza la contraseña y **revoca todas las sesiones** del usuario. Eventos de auditoría: `USER_CREATED`, `USER_PASSWORD_RESET` (sin la contraseña).

---

## 8. Despliegue en Producción

- Imagen Docker multi-etapa (`Dockerfile`) con salida `standalone` de Next: el contenedor final no lleva `node_modules` completos ni código fuente, y corre como usuario `node` sin privilegios.
- `docker-compose.prod.yml`: PostgreSQL sin puertos publicados; la app sin puertos publicados (la sirve el proxy HTTPS del servidor por una red Docker externa); sistema de archivos de solo lectura, `cap_drop: ALL`, `no-new-privileges` y límites de memoria.
- Las migraciones se aplican con `prisma migrate deploy` en un contenedor aparte (`migrar`) antes de que arranque la app.
- `poweredByHeader: false`: las respuestas no anuncian el framework.
