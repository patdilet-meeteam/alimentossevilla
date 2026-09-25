# DATA-SOURCES.md — Fuentes de Datos e Insumos Técnicos

Este documento detalla los orígenes de datos, archivos de muestra y fuentes de información identificadas para la **Plataforma Centralizada de Gestión Técnica y Nutricional** de **Alimentos Sevilla S.A.S.**

---

## 1. Catálogo de Fuentes de Datos Conocidas

### 1. Banco de Información Nutricional.xlsx
- **Tipo:** Hoja de cálculo Excel (.xlsx).
- **Propósito:** Fuente de referencia para la composición nutricional de las materias primas y aditivos utilizados en formulaciones.
- **Contenido:** Contiene tablas de nutrientes (proteína, grasa total, grasa saturada, carbohidratos, azúcares totales, azúcares añadidos, sodio, fibra dietaria, vitaminas y minerales) por 100 gramos de ingrediente.
- **Implementación vigente:** La carga protegida lee la hoja `TN OFICIAL` (123 filas verificadas el 23 de septiembre de 2026). El archivo no contiene códigos SIESA: solo puede versionar perfiles de ingredientes maestros activos que coincidan de forma única por nombre o nombre genérico; no crea ingredientes.
- **Trazabilidad:** Cada perfil importado conserva la referencia de fuente de la fila, se registra en auditoría y crea una nueva versión. Un perfil activo de laboratorio o literatura no se sustituye automáticamente.

---

### 2. CTN - Salchicha Desayuno Premium - v11.xlsx
- **Tipo:** Hoja de cálculo de Control Técnico Nutricional (.xlsx).
- **Propósito:** Archivo de referencia utilizado actualmente por el equipo técnico para el cálculo y balance nutricional de productos cárnicos procesados.
- **Contenido:** Lista de ingredientes de la formulación con sus porcentajes de participación, peso en batch, balance de nutrientes ponderado, factores de rendimiento por cocción y cálculo de sellos de advertencia.
- **Observaciones y Ambigüedad:** Representa un comportamiento histórico de cálculo en Excel. La hoja `CTN`, titulada “SALCHICHAS DESAYUNO PREMIUM”, toma códigos desde la hoja oculta `Chorizo con ternera (3)`; por ello no se usa como fixture canónico ni como fuente de carga hasta que el cliente confirme el caso, las hojas y los códigos correctos.
- **Open Questions Asociadas:** [OQ-022](OPEN-QUESTIONS.md#oq-022), [OQ-023](OPEN-QUESTIONS.md#oq-023) y [OQ-024](OPEN-QUESTIONS.md#oq-024). OQ-006 y OQ-008 confirman que la base Excel debe replicarse, pero no sustituyen la identificación explícita del caso patrón ni el contrato matemático.

---

### 3. TL - Salchicha desayuno Premium x 480 g
- **Tipo:** Documento de muestra de Textos Legales (.docx / .pdf).
- **Propósito:** Ejemplo del documento técnico y legal requerido para la aprobación de rótulos ante entidades sanitarias y clientes comerciales.
- **Contenido:** Denominación legal del alimento, lista descendente de ingredientes, declaración cuantitativa de ingredientes (QUID si aplica), advertencias de alérgenos, tabla de información nutricional en formato normativo, modo de conservación y vida útil.
- **Observaciones:** El archivo físico `TL - Salchicha desayuno Premium x 480 g - v4.doc.pdf` fue revisado visualmente. Contiene cara frontal, cara posterior, lista legal, alérgenos, conservación, uso, registro sanitario, tabla nutricional, dimensiones, tipografía, código de barras y responsable de elaboración. Presenta una diferencia de valores y sellos frente al cálculo vigente de `TN OFICIAL`; ver OQ-030.
- **Open Question Asociada:** [OQ-016](OPEN-QUESTIONS.md#oq-016) está confirmada como guía estructural; la discrepancia de contenido queda en [OQ-030](OPEN-QUESTIONS.md#oq-030).

---

### 4. AR - Salchicha Desayuno Premium 480 g (Arte Final)
- **Tipo:** Archivo de diseño gráfico / arte de empaque.
- **Propósito:** Referencia visual del empaque final impreso en planta o por la agencia de diseño.
- **Frontera de Alcance:** **FUERA DEL ALCANCE.** La plataforma no es una herramienta de diseño gráfico vectorial (Adobe Illustrator/Corel). La plataforma genera los datos estructurados, tablas nutricionales y textos legales validados que la agencia de diseño utilizará para confeccionar el arte final.

---

### 5. Archivos de Costos de Junio (Reportes Financieros)
- **Tipo:** Archivos de exportación contable / financiera (.xlsx / .csv).
- **Propósito:** Insumo para el módulo de costeo de formulaciones que se actualizará mensualmente.
- **Contenido:** Listado de cuentas contables, códigos de materia prima, descripciones y costo promedio o estándar por kilogramo.
- **Frontera de Alcance:** **NO existe integración API directa con el ERP SIESA.** SIESA únicamente aporta el identificador alfanumérico (Código de Materia Prima) que permite cruzar los costos del archivo mensual con los ingredientes registrados en la plataforma.
- **Open Questions Asociadas:**
  - [OQ-012](OPEN-QUESTIONS.md#oq-012): Estructura oficial y delimitación del archivo mensual.
  - [OQ-013](OPEN-QUESTIONS.md#oq-013): Nombre exacto y formato de la columna con el código SIESA.
  - [OQ-014](OPEN-QUESTIONS.md#oq-014): Política de manejo ante códigos SIESA no encontrados en el catálogo.

---

## 2. Matriz de Trazabilidad de Fuentes de Datos

| Identificador | Archivo / Fuente | Módulo Destino en la Plataforma | Frecuencia de Actualización | Estado de Definición |
|---|---|---|---|---|
| **DS-01** | Banco Nutricional.xlsx | Módulo de Ingredientes (Semana 2) | Esporádica / Bajo demanda | Pendiente resolución OQ-001 |
| **DS-02** | CTN v11.xlsx | Motor de Cálculo Nutricional (Semana 4) | Candidato a caso de calibración | Pendiente resolución OQ-022/023/024 |
| **DS-03** | TL 480g | Módulo de Documentos Técnicos (Semana 6) | Plantilla base de salida | Revisada; discrepancia de contenido pendiente OQ-030 |
| **DS-04** | AR 480g | N/A (Referencia visual) | N/A | Fuera de alcance |
| **DS-05** | Costos Junio | Módulo de Costos (Semana 5) | Mensual (Carga de archivo) | Pendiente resolución OQ-012/13/14 |
