# AGENTS.md — Protocolo de Autonomía y Gobernanza para Agentes

Este documento establece las reglas operativas, los límites de autonomía y los protocolos de escalamiento para todos los agentes de inteligencia artificial y desarrolladores que interactúen con el repositorio del proyecto **"Plataforma Centralizada de Gestión Técnica y Nutricional"** de **Alimentos Sevilla S.A.S.**.

---

## 1. Principio Rector

> **REGLA FUNDAMENTAL:** NO INVENTAR REGLAS DE NEGOCIO.
>
> Queda estrictamente prohibido asumir, inventar o inferir fórmulas de cálculo nutricional, reglas de redondeo, factores de conversión, límites de sellos de advertencia, criterios normativos, workflows de aprobación, estructuras financieras o comportamientos del sistema ante datos no confirmados por el cliente o el equipo funcional.

Cuando una decisión de negocio no esté confirmada, el agente **NO la resolverá unilateralmente**, sino que la registrará como una `OPEN QUESTION` en `docs/OPEN-QUESTIONS.md` y continuará con los aspectos técnicos desacoplados de dicha decisión.

---

## 2. Frontera de Autonomía

### 2.1. Decisiones que el Agente PUEDE tomar unilateralmente
El agente tiene autonomía técnica para decidir sobre:
- **Implementación interna**: Algoritmos internos, estructuras de datos auxiliares y patrones de diseño en código.
- **Nombres y organización interna**: Nombres de variables, funciones, archivos y carpetas internas siguiendo las convenciones del stack.
- **Refactorizaciones locales**: Mejoras de legibilidad, modularidad o rendimiento que no alteren contratos ni interfaces públicas.
- **Estrategia y suite de pruebas**: Creación de tests unitarios, de integración, mocks y fixtures.
- **Manejo de errores y tipado**: Tipos e interfaces en TypeScript estricto, guardas de tipos y manejo robusto de excepciones.
- **Consultas a base de datos**: Optimización de queries Prisma, índices técnicos y transacciones.
- **Componentes de UI internos**: Componentes visuales reutilizables, loading skeletons y estados vacíos consistentes con el diseño B2B.
- **Detalles técnicos de tooling**: Configuración de linters, formateadores, scripts de build y scripts de desarrollo.

### 2.2. Decisiones que el Agente NO PUEDE tomar unilateralmente
El agente **NUNCA** debe decidir unilateralmente sobre:
- **Nuevas reglas de negocio o fórmulas técnicas**: Cualquier lógica de cálculo nutricional, sellos o costos.
- **Modificación de Acceptance Criteria (AC)**: Alterar los criterios de aceptación definidos en las especificaciones.
- **Cambio de alcance contractual**: Agregar o eliminar capacidades comprometidas sin aprobación explícita.
- **Cambios arquitectónicos globales**: Introducir microservicios, brokers de eventos (Kafka/RabbitMQ), caches distribuidas (Redis) o bases de datos adicionales.
- **Relajación de seguridad**: Desactivar autenticación, saltarse validación en boundaries o debilitar políticas de hashing/sesión.
- **Definición de permisos funcionales no confirmados**: Asumir qué rol exacto puede ejecutar qué acción antes de recibir la matriz de permisos oficial.
- **Modificación de contratos públicos o APIs**: Cambiar endpoints, contratos de Server Actions o schemas de exportación sin justificación documental.
- **Eliminación de funcionalidad existente**: Retirar código o vistas requeridas.
- **Reinterpretación de ambigüedades funcionales**: Asumir una interpretación particular de un requisito ambiguo en lugar de consultar.

---

## 3. Protocolo de Escalamiento (Triggers E1 - E7)

El agente debe detener la toma de decisión unilateral, documentar una **Open Question** o escalar al equipo humano ante cualquiera de los siguientes eventos:

| Código | Disparador de Escalamiento | Acción Requerida |
|---|---|---|
| **E1** | **Contradicción entre requisitos** | Documentar en `docs/OPEN-QUESTIONS.md` señalando las fuentes en conflicto. Pausar la implementación del módulo en conflicto y avanzar en módulos independientes. |
| **E2** | **Decisión de negocio faltante** | Registrar la pregunta funcional con el prefijo `OQ-XXX`. No inventar la lógica. Implementar placeholders o interfaces desacopladas. |
| **E3** | **Cambio arquitectónico global** | Requerir aprobación y redactar un Architecture Decision Record (ADR) formal en `docs/DECISIONS.md`. |
| **E4** | **Impacto importante de seguridad** | Documentar el vector de riesgo en `docs/SECURITY.md`. Bloquear cualquier compromiso de confidencialidad o integridad. |
| **E5** | **Contrato público o schema ambiguo** | Registrar la ambigüedad (ej. nombres de columnas en archivos Excel de SIESA o costos). Proporcionar tipado provisional y documentar el punto pendiente. |
| **E6** | **Migración destructiva de datos** | Requerir confirmación antes de aplicar migraciones que eliminen tablas, columnas con datos o modifiquen claves foráneas críticas. |
| **E7** | **Acceptance Criteria contradictorio** | Levantar la contradicción en la SPEC correspondiente y solicitar clarificación del Product Owner / Tech Lead. |

---

## 4. Estructura de Memoria y Documentación

El repositorio actúa como la memoria compartida entre sesiones de agentes humanos y de IA. Todo cambio conceptual o arquitectónico debe persistirse en los documentos de referencia:

- `docs/PRODUCT.md`: Visión del producto, módulos funcionales y alcance.
- `docs/ARCHITECTURE.md`: Arquitectura del sistema, capas y lineamientos técnicos.
- `docs/DOMAIN.md`: Modelo conceptual de dominio (Confirmed, Provisional, Open Questions).
- `docs/DECISIONS.md`: Registro de Decisiones Arquitectónicas (ADRs).
- `docs/OPEN-QUESTIONS.md`: Catálogo unificado de preguntas abiertas pendientes de Kick-Off/Cliente.
- `docs/DATA-SOURCES.md`: Documentación de insumos de datos, archivos Excel y orígenes conocidos.
- `docs/SECURITY.md`: Políticas de seguridad, sesiones, secretos y auditoría.
- `docs/specs/SPEC-XXX-*.md`: Especificaciones funcionales y técnicas ejecutables.

---

## 5. Convenciones de Trabajo

1. **Trazabilidad y Auditoría**: Toda acción crítica de negocio debe ser diseñada para dejar registro en el sistema de auditoría transversal (`AuditEvent`).
2. **Validación en Boundaries**: Toda entrada proveniente del usuario o de orígenes externos debe ser validada con **Zod** en el servidor.
3. **No filtración de secretos**: Nunca registrar contraseñas, tokens de sesión o datos sensibles en logs o eventos de auditoría.
4. **TypeScript Estricto**: No utilizar `any` no justificado. Tipar exhaustivamente todas las capas.
5. **Separación de Capas**: Mantener la lógica de negocio en servicios/dominio, no incrustada directamente en componentes de renderizado de React.
