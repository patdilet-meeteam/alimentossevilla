> INFORME HISTÓRICO: conserva evidencia del momento. No usar sus solicitudes generales ni conteos como estado vigente. Consulte `proyecto/docs/ESTADO-VIGENTE-ENTREGA.md` en el ZIP y el ensayo final.

# Conciliación de vigencia y cierre de porcentajes

Este informe sustituye las conclusiones de cobertura vigente del ensayo anterior. Requisito confirmado: cargar solo información vigente (OQ-015/P-15); una fórmula por producto, con cambios de gramaje/empaque por presentación (OQ-002/P-04). No se seleccionó ninguna versión ni se realizaron nuevas cargas, aprobaciones o conexiones a DB. La base temporal anterior ya fue eliminada.

## Vigencia de las 33 versiones

Las 33 tienen estado **VIGENCIA_NO_ACREDITADA**. Cero cuentan con fecha efectiva/liberación o indicación inequívoca de ser la formulación vigente, y cero pueden declararse históricas definitivamente solo por su posición. Están vinculadas a 21 productos activos en el ZIP auditado; `isActive` del producto no acredita la vigencia de una fórmula. Todas son datos revisables, no un plan de carga vigente.

El CSV `clasificacion_33_vigencia_sumas.csv` contiene la decisión individual, título/celda fuente, suma corregida, totalizador y causa de diferencia. El JSON conserva encabezados de costos, versiones literales, fórmulas compartidas originales y su expansión por fila, códigos, cantidades, porcentajes y formatos numéricos originales. No se recalculó ni modificó Excel.

En las mismas pestañas se identificaron siete bloques adicionales: cuatro alternativas explícitas de versión y tres ensamblajes de subfórmulas de Milanesa. Solo se inventariaron; no se cargaron. Las tres recetas iniciales de Milanesa son `PP MEZCLA MILANESA`, no la formulación completa apanada; el bloque `PP APANADO MILANESA` incorpora MILANESA más batido y apanado. No deben contarse esos componentes por capas como versiones competidoras.

V1/V2 indica coexistencia de variantes; no acredita cuál fue liberada. Tampoco lo hacen JUN/SEP/OCT/NOV/DIC en costos, el número de unidades, sufijo RX ni orden de filas. Mortadela Viandé tiene versiones internas adicionales; Salchicha Viandé tiene variantes internas y una V2 de225g dentro de la pestaña450g. Esas discrepancias impiden elegir la última automáticamente.

## Por qué las sumas no son 100

La afirmación previa de “todas las filas fuente contrastadas” era demasiado amplia: el ensayo verificaba las601filas seleccionadas, pero la extracción omitía cinco reprocesos sin código. Se corrigió el inventario revisable a **606filas**, de las cuales nueve carecen de identidad de código válida (cuatro0 y cinco vacías). Ninguna se elimina de la evidencia. El ensayo anterior se conserva como antecedente técnico, no prueba de integridad de la receta ni de carga vigente.

| Hallazgo | Evidencia y alcance |
| --- | --- |
| Cinco filas omitidas por el recuperador | MORTA JAMONADA400!C7:E7 y cuatro SCHON!C7:E7: reprocesos con código vacío. Brakel225 cambia de89.94 a99.90; Brakel500 y SchonPollo225 de89.97 a99.93; TradViand500 de89.91999 a99.91999; MortaJamonada400 de93.19959 a100.19959. Los totales originales ya incluían esas filas. |
| Siete sumas compatibles con cola numérica a escala diagnóstica | MortadelaViandé14V1, tres PPmezclaMilanesa y tres SalchichaViandé tienen diferencias de orden10^-14. Cuatro usan porcentajes con fórmula compartida `Dfila*100/SUM(D)` en la propia fuente. Tres Milanesa contienen valores literales compatibles con la misma representación. Los formatos visuales de2/3decimales ocultan esas colas. No se deduce tolerancia de negocio ni se normaliza. |
| Tres rangos de porcentaje incompletos | ChorizoSantaCóctel1000, Corto480 y Largo1200: E21=`SUM(E5:E19)`, pero E20 añade ProvianK0.001%. El total cacheado parece100; las filas completas suman100.001. La fila no es empaque. |
| Seis rangos de cantidad incompletos | Esos tres chorizos más Cóctel300, JamónPremium400 y MortadelaJamón225. Ejemplo JamónPremium: D25=`SUM(D5:D23)` omite la transglutaminasaD24; E25 sí incluyeE24. El recuperador además confundía el total sin rótulo con la siguiente fila de merma: ya se corrige por fórmula, no por etiqueta. |
| Cantidades y porcentajes contradictorios | Cervecero500!E13=12% para SUPRAMEAT; D13=0.0002558365, mientras K13=K4×12%=0.06174. No se puede elegir cuál corregir técnicamente. Otras discrepancias por fila quedan enJSON. |
| Otras diferencias de porcentajes | 26 de33 tienen diferencia mayor que la cola diagnóstica, incluidas las que tienen rangos o columnas contradictorios. No significa26errores de negocio equivalentes: hay0.001%,0.0043%,0.01995%, etc., y otras mayores. El formato visible no establece precisión de captura. |
| Empaques y repetidos | Se separaron33tablas de costos/empaque por encabezado y sección. Cero códigos13/empaques entran en las33tablas de receta auditadas. No hay códigos repetidos en esas33; sí MPCP044 dos veces en la alternativa interna deSalchichaViandé450, que queda pendiente sin deduplicación automática. |

El umbral numérico10^-10 se utiliza exclusivamente para describir la escala del residuo en este diagnóstico, no para aceptar ni aprobar fórmulas. La regla implementada de cierre exacto permanece intacta. Una representación racional basada en cantidades puede probar algebraicamente el cierre cuando la propia fuente lo define, pero no debe usarse para ocultar cifras ingresadas ni para resolver columnas contradictorias.

## Cobertura recalculada por producto

`cobertura_candidata_vs_vigente_por_producto.csv` contiene21filas y separa conjuntos candidatos y subfórmulas. La cobertura **vigente** y su número de faltantes son **no determinables** hasta acreditar la receta vigente; no son0% ni78fallos confirmados de carga.

Los78son códigos distintos sin perfil crítico completo usados por la unión de las33tablas candidatas iniciales, excluyendo empaques. Esa cifra sigue siendo78 al añadir los cinco reprocesos, porque estos no tienen código; se informan aparte. Al inventariar también las otras alternativas/subfórmulas hay84códigos conocidos candidatos, no84faltantes vigentes. Se excluye el marcador literalCREAR y se conserva como identidad pendiente. No deben sumarse78+13: los13pertenecen al conjunto previo de correspondencias nutricionales revisadas y hay solapamientos.

No se fusionaron identidades entre códigos numéricos, operativos y descriptivos. Por eso MortadelaViandé tiene0códigos faltantes comunes entre todas las alternativas y39en su unión; eso no prueba que una versión esté completa, sino que usan maestros distintos. ParaMilanesa no se informa intersección entre etapas como si fueran variantes: base y apanado deben expandirse según la composición fuente y el vínculo de subfórmula.

## Impedimentos reales y solución posible

1. **Falta selección vigente demostrable para21productos.** Preparar manifiesto por producto con hash del archivo, hoja, bloque/rango, versión y evidencia de liberación; seleccionar solo esas recetas. La confirmación corresponde a la autoridad de negocio. Las demás quedan en repositorio de revisión, fuera de la carga vigente.
2. **Receta fuente ambigua o contradictoria.** Mantener todas las filas de ingrediente aunque falte código; separar empaque por sección; corregir el recuperador para detectar totalizadores por fórmula. Generar propuesta explícita de corrección para rangos incompletos, reprocesos y columnas contradictorias, con antes/después. No corregir E13 deCervecero500 ni porcentajes por inferencia. Para colas numéricas, acordar una representación exacta (p.ej. cantidades/racionales cuando la fuente lo define) o cifras fuente corregidas; no introducir tolerancia silenciosa.
3. **Identidad nutricional y dependencias del producto final.** Resolver códigos/reprocesos/subfórmulas solo para las recetas seleccionadas. Recalcular entonces los nutrientes faltantes, propagando perfiles únicamente con correspondencia explícita. Completar también miembros/gramajes pendientes de combos. El universo78/84 es inventario candidato, no backlog confirmado vigente.

Se corrigió el preparador y el recuperador rechaza reutilizar silenciosamente un borrador local si cambian sus filas fuente. Verificación de conciliación: ocho aserciones sobre los casos fuente, regresión del preparador sobre33bloques/606filas y validación sintáctica Python/Node correctas. No se repitió la carga local ni se amplió la recuperación; las143pruebas/compilación anteriores corresponden al código de aplicación, no certifican vigencia ni exactitud de los datos del ensayo anterior.
