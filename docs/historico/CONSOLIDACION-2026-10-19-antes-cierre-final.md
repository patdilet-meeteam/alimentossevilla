> HISTÓRICO. No usar como instrucciones vigentes. Consulte docs/ESTADO-VIGENTE-ENTREGA.md.

> Estado vigente: consulte `docs/ESTADO-VIGENTE-ENTREGA.md`. Junio (1).xlsx fue confirmado como último archivo; no se solicita otro historial general. Prueba final: 182 tests, 13 migraciones y navegador PASS.

# Sevilla: candidato consolidado para revisión local

Base publicada: `e891300`. Estos cambios posteriores están en el checkout local y todavía no se han publicado ni desplegado. La validación de fuentes y de ejecución aislada está consolidada; **no se certifica una migración productiva final ni un catálogo vigente completo**.

## Resuelto con evidencia disponible

- Se documentaron13 identidades literales completas entre maestro, recetas y `TN OFICIAL`, sin eliminar calificadores comerciales ni fusionar códigos. El plan consolidado contiene66 perfiles:53 anteriores más13 nuevos. Las1121 cifras del plan coinciden con las celdas XML originales. El archivo/hash/hoja/fila mantienen procedencia aunque falte bibliografía.
- Se reprodujeron17 diferencias en los275 porcentajes del fixture por parámetros numéricos JavaScript enviados a Prisma. Se escriben decimales como texto. El piloto fuente suma exactamente100 y el nuevo ensayo también; el fallo anterior no era una diferencia de receta.
- Una migración amplía únicamente `nutrient_values.value` a `DECIMAL(38,24)`. Se comprobó que preserva íntegramente1206 filas preexistentes de prueba. Los valores fuente con más de cuatro decimales se conservan, sin reparación automática de datos históricos.
- La edición admite texto decimal conservando hasta24 decimales; el contrato numérico anterior sigue aceptado. Editar solo un porcentaje ya no borra la cantidad canónica omitida. `null` explícito conserva su significado de borrado de esa cantidad. Los formularios nutricionales conservan cero explícito, cifras completas y ausencia al vaciar un campo.
- El importador CTN suma porcentajes mediante aritmética decimal exacta, acepta precisión representable y rechaza cantidades/porcentajes que el almacenamiento truncaría. No distribuye residuos ni normaliza.
- ArconT se retira del listado obsoleto de pendientes: ya estaba identificado por comentario original. Su anomalía grasa total0/saturada0.2 se mantiene como fuente, no se inventa una corrección.
- No hay que volver a preguntar las reglas ya documentadas: suma exacta100 sin normalización, merma solo en cantidades, suma de saturadas y algoritmo del diagrama grasa/especie. ROJOAC150 y HUMOTRUSMOKEOILEX están identificados para el piloto; eso no aprueba su receta completa.

## Qué falta y qué población afecta

Las cifras siguientes son del fixture de39 productos, no una medición del despliegue real:

| Población | Cantidad | Estado |
|---|---:|---|
| Piloto Salchicha Desayuno Premium |1| Cobertura computacional; receta vigente/aprobación y paridad aceptada no acreditadas |
| Recetas base con perfiles incompletos |14|13 identidades aún sin vínculo nutricional inequívoco |
| Combos modelados erróneamente como ingredientes |2| Su cálculo se bloquea;4 conjuntos fuente separados siguen borrador |
| Productos con recetas candidatas recuperadas |21|33 bloques conservados, ninguna vigencia elegida |
| Libro de explosión de materiales |1|No acredita receta alimentaria |

Entre las14 recetas base incompletas,13 además tienen suma fuente distinta de100; Chorizo de Cerdo suma100 pero sigue sin su perfil comercial faltante. No se atribuyen al cliente los residuos introducidos por el ensayo anterior.

Las13 identidades base pendientes son BurgerMeat80BNAT, Carnal961, KCl, HemoglobinaI-Red, hielo en escamas, MDMnacional, preparados sabor chorizo cerdo/ternera, proteína colagénica de alta funcionalidad, recorte70/30, recorte80/20 emulsificado, recorte80/20 importado y SolutexGrasasNeutro. Se necesita una ficha o un vínculo explícito de la variante/código a su perfil; no se sustituye por otra marca, mezcla o proporción.

En las33 recetas candidatas, la cobertura del ensayo66 deja65 códigos sin perfil cerrado, frente a78 anteriores. Incluyendo los7 bloques adicionales inventariados quedan71 de84 códigos sin correspondencia; esos bloques no fueron cargados como recetas vigentes. **No sumar estas cifras con las13 anteriores ni presentarlas como faltantes del catálogo actual.** El denominador vigente sigue desconocido.

La matriz `materiales/consolidacion_resoluciones_y_limites.json` identifica cada código, producto, hoja y fila. Conserva las9 filas con código0/vacío,3 rangos de suma porcentual y6 de cantidad que omiten materiales. Las26 diferencias superiores al residuo diagnóstico y7 compatibles con serialización no autorizan ninguna tolerancia. El caso Cervecero500 enfrenta D13/E13/K13 contradictorios; falta determinar el dato de receta autorizado. Los conjuntos conservan una variante sin peso completo y otra con675 frente a900 declarados; no se calcula un peso ausente como cero.

El CTN histórico permite reproducir y explicar diferencias:100.005, ajuste posmerma, saturadas solo del tocino, sodio de laboratorio y códigos ligados a otra hoja. No se ocultan para simular paridad. Falta acreditar la receta completa vigente y disponer del TLv4 original para cotejar su salida; sus cifras no reemplazan perfiles del banco.

El criterio grasa/especie es una previsualización manual. No hay catálogo persistente de clasificaciones ni emisión oficial certificada; falta evidencia por ingrediente y definición de integración en el documento. No se inventaron permisos ni un flujo de aprobación nuevo.

## Una ejecución local consolidada

```sh
node scripts/review/run-consolidated-local.cjs \
  deliverables/sevilla-review/materiales /ruta/escribible/salida-vacia
```

Requiere dependencias instaladas, Docker y la imagen local oficial `postgres:16-alpine`. Crea una base efímera en127.0.0.1, aplica las12 migraciones, carga el fixture, prueba66 perfiles dos veces, compara275 porcentajes/1121 nutrientes, verifica221 cifras candidatas con rollback y precisión24, ensaya el lote33+4 con16 casos PostgreSQL, restaura su backup, verifica fuentes, ejecuta suite/tipos/lint/build webpack y elimina el contenedor. La huella de todos los archivos de código debe ser idéntica antes y después. No conecta a una base configurada externamente.

El resultado completo está bajo `materiales/ensayo_consolidado_revision/`. Las pruebas no constituyen aprobaciones de negocio. Los53/66 perfiles se activan solo en el fixture aislado; no se envían a producción. La revisión visual anterior se conserva como histórica: no se afirma una nueva validación visual del despliegue remoto.

## Lo que requiere al team lead

Restaurar un respaldo autorizado de la base real; verificar esquema, datos, colisiones, destino e imágenes Docker; validar el adaptador operativo de datos sobre esa copia. Nunca ejecutar el seed de fixture en producción ni quitar la guarda local como atajo. La migración de precisión no repara porcentajes ya alterados ni activa recetas/perfiles. No hay carga productiva ejecutada, adaptador productivo nuevo certificado ni acceso real a esa base.

Para una solicitud documental final al cliente, pedir primero el manifiesto de recetas vigentes por producto. Después limitar fichas/identidades a los códigos que realmente use ese manifiesto y consultar las celdas contradictorias concretas, los miembros/pesos de combos y la clasificación grasa/especie. No enviarle una lista indiscriminada de78/84 supuestos faltantes actuales.

## Cierre posterior por aparición de origen

Esta sección y `materiales/ensayo_consolidado_filas/` prevalecen sobre los conteos anteriores de componentes vinculados y sobre `ensayo_consolidado_revision/`.

Se documentan85 valores fuente para cinco apariciones, sin añadir perfiles globales: tres filas deMPPA144/papa→TN46, una deMPPA144/yuca→TN47 y JMN SDW Éxito225 fila29/1260025→TN61. El plan global continúa en66 perfiles. `SUPRAMEAT PLUS` de Mortadela no demuestra ni equivalencia con874 ni contradicción: queda sin resolver. No usar TN91/fosfato como sustituto. TN61 contiene azúcares38.25 frente aCHO33.21; la identidad de la fuente queda sustentada, su inconsistencia no se corrige ni se certifica.

Las guardas aíslan11 filas de8 variantes/6 productos: los cinco casos anteriores, la descripción corta de1260025, tres usos deMPCP031 con fabricantesTyson/GoldCreek y dos usos de1121009 como tocino foráneo/sin origen. Conservan descripción, código, cantidades, porcentajes, fórmulas y evidencia por fila enJSON; no crean/reutilizan unaFK de ingrediente ni un perfil global para resolverlos. Las fuentes nutricionales de las cinco apariciones quedan en la captura revisable, no se activan como perfiles generales ni habilitan cálculo/aprobación.

Se mantienen606 filas fuente, con586 componentes vinculados y20 filas de identidad pendiente:9 con código0/vacío más11 aisladas por estas guardas. La reducción de597 a586 enlaces evita asociaciones incorrectas; no elimina filas de receta. La verificación distingue cobertura nutricional por aparición de cobertura de perfiles globales.

La unión de códigos con alguna aparición aún sin fuente nutricional sigue en65, pero su composición cambia:MPPA144 sale de la falta nutricional al tener fuente por fila, y1121009 entra por los dos usos cuyo origen no acredita el perfil nacional. El código deMPPA144 todavía requiere aclaración/corrección del maestro; no confundir identidad de código pendiente con nutrientes ausentes. Los7 bloques adicionales inventariados no tienen una cobertura recalculada certificada por estas guardas.

El peso675g deMega675GX3 se documenta como reconstrucción candidata por títuloB2, tres miembros225g y empaqueC24. Se conserva la contradicción900g deC14/costos y la identidad30018 pendiente. No se asigna vigencia ni aprobación. Mega900 sigue sin peso completo acreditado;10090O no permite transferir225g desde otra hoja porque allí designa salchicha, aquí mortadela.

La suite posterior pasa172 pruebas/36 archivos; hay18 casos PostgreSQL, incluidas la ausencia de11 enlaces indebidos y de perfiles globales contaminados. Continúan correctos migraciones, rollback/restauración, repetición, tipos, lint y build. La huella del código se conserva antes/después. No se publicaron cambios ni se accedió a producción.

### Datos mínimos que aún requieren confirmación

|Dato exacto|Impacto observado|Quién puede confirmarlo|
|---|---|---|
|Manifiesto de receta/variante vigente por producto|33 candidatas/21 productos; ningún bloque aprobado por las fuentes disponibles|Director Técnico del cliente|
|Ficha o vínculo de las13 identidades base pendientes|14 recetas base del fixture; no se sustituyen marcas o proporciones|Director Técnico/proveedor de cada material|
|Código correcto para papa/yuca, fabricante deMPCP031, significado dePLUS enMortadela y perfil de tocino foráneo/sin origen|11 filas aisladas/8 variantes/6 productos; nutrientes ya documentados para5 filas|Responsable del maestroSIESA y Director Técnico/proveedores|
|Porcentajes autorizados enSanta yCervecero500|Tres variantesSanta y unaCervecero; corregir rango o recalcularD13/K4 no cierra100|Director Técnico|
|Peso/identidad/surtido y presentación deMega900/Mega675|Dos variantes deMegaCombo;675 es reconstrucción,900 completo no calculable|Director Técnico/maestro de producto terminado|
|Clasificación grasa/especie y documento técnico vigente, incluidoTLv4 si se exige cotejo|Salida oficial no certificada; no hay cifra por catálogo vigente sin manifiesto|Director Técnico/responsable funcional|
|Esquema/datos y respaldo restaurable de la base real, colisiones y adaptador operativo|Todo el despliegue; el ensayo no acredita producción|Team lead/operador autorizado|

No volver a solicitar reglas de merma, suma de saturadas o composición ya recibidas; tampoco pedir un perfil global deMPPA144 o1260025 para tapar un problema de identidad por aparición.

Si el destino ya contiene versiones de la primera recuperación con el mismoSHA/hoja y enlaces anteriores, el importador rechaza la colisión: no reescribe esas versiones ni sus snapshots. La revisión del respaldo real debe determinar si hace falta una migración de datos dirigida que preserve ese historial. No se declara resuelto ese caso operativo con un fixture limpio.
