# SECURITY.md — Políticas y Prácticas de Seguridad

Este documento define los estándares de seguridad implementados en la **Plataforma Centralizada de Gestión Técnica y Nutricional** de **Alimentos Sevilla S.A.S.** desde su fase inicial de Platform Foundation (SPEC-001).

---

## 1. Principios de Seguridad

1. **Defensa en Profundidad (Defense in Depth):** Las comprobaciones de autorización se ejecutan obligatoriamente en el servidor en cada Server Action, Route Handler y carga de página, sin confiar jamás en el estado del cliente o la visibilidad de elementos visuales en React.
2. **Principio de Menor Privilegio (Least Privilege):** Cada rol tiene acceso estrictamente a las operaciones requeridas para su función.
3. **Validación Exhaustiva en Boundaries:** Ningún dato no confiable ingresa a la capa de dominio sin ser parseado y validado mediante esquemas estrictos de **Zod**.
4. **Protección de Datos Sensibles:** Contraseñas, tokens de sesión y secretos nunca se almacenan en texto plano ni se registran en logs o eventos de auditoría.

---

## 2. Autenticación y Gestión de Contraseñas

- **Algoritmo de Hashing:** Se utiliza `bcryptjs` con un factor de trabajo (salt rounds) de 10 o superior, protegiendo las credenciales contra ataques de fuerza bruta y tablas arcoíris.
- **Políticas de Contraseña:** Mínimo 8 caracteres, requiriendo al menos una letra mayúscula, una minúscula y un número o carácter especial.
- **Almacenamiento:** El hash de contraseña se almacena exclusivamente en la columna `passwordHash` de la tabla `User`. Jamás se retorna en payloads JSON al cliente.

---

## 3. Manejo de Sesiones

- **Mecanismo:** Sesiones con identificador aleatorio criptográficamente seguro (UUID v4 / base64URL de 32 bytes de entropía) almacenadas en la base de datos (tabla `Session`).
- **Transporte de Sesión:** Cookie HTTP-Only con los siguientes flags de seguridad:
  - `httpOnly: true` (Inaccesible desde JavaScript en el navegador, previene robo de sesión por XSS).
  - `secure: process.env.NODE_ENV === 'production'` (Transmisión obligatoria sobre HTTPS en producción).
  - `sameSite: 'lax'` (Protección contra Cross-Site Request Forgery - CSRF en navegaciones cross-origin).
  - `path: '/'`
  - `maxAge: 8 * 60 * 60` (8 horas de vigencia por defecto).
- **Revocación:** La sesión puede ser invalidada instantáneamente en el servidor eliminando el registro correspondiente en la tabla `Session`.

---

## 4. Autorización Server-Side y RBAC

- Toda mutación o consulta protegida verifica la sesión del usuario mediante la función `getCurrentUser()` en el servidor.
- La verificación de roles se ejecuta mediante funciones de guarda tipadas:
  ```typescript
  export async function requireRole(allowedRoles: Role[]): Promise<User> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new Error('FORBIDDEN');
    }
    return user;
  }
  ```
- **Rutas Protegidas:** El middleware de Next.js intercepta todas las peticiones a rutas bajo `/(app)/*` (`/dashboard`, `/ingredientes`, `/productos`, `/formulaciones`, `/costos`, `/normativa`, `/documentos`, `/usuarios`, `/auditoria`), redirigiendo a `/login` si no existe una cookie de sesión válida.

---

## 5. Sanitización de Auditoría y Logs

El servicio `src/lib/audit/audit-service.ts` implementa un filtro automático de sanitización que purga cualquier clave sensible antes de persistir en `AuditEvent.metadata`:

```typescript
const FORBIDDEN_AUDIT_KEYS = ['password', 'passwordHash', 'token', 'secret', 'authorization', 'cookie'];

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!FORBIDDEN_AUDIT_KEYS.some(f => key.toLowerCase().includes(f))) {
      clean[key] = value;
    } else {
      clean[key] = '[REDACTED]';
    }
  }
  return clean;
}
```

---

## 6. Gestión de Secretos y Variables de Entorno

- Los archivos `.env`, `.env.local` y `.env.production` están explícitamente excluidos en `.gitignore`.
- Se mantiene un archivo `.env.example` documentando todas las variables requeridas con valores sintéticos de ejemplo.
- Secretos obligatorios:
  - `DATABASE_URL`: Cadena de conexión a PostgreSQL.
  - `AUTH_SECRET` / `SESSION_SECRET`: Semilla criptográfica para firma y tokens.

---

## 7. Manejo Seguro de Errores

- En producción, los errores de base de datos o stack traces internos nunca se envían al cliente.
- Las Server Actions retornan objetos de resultado con formato estructurado `{ success: boolean, error?: string }` con mensajes de error comprensibles y genéricos para el usuario.
