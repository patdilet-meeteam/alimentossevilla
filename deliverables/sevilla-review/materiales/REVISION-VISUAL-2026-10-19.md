# Revisión visual interactiva local

**Resultado:15 comprobaciones PASS,8 capturas, Chrome 155.0.8059.82.** Se utilizó Chrome instalado en modo headless, control CDP 1.3 con WebSocket de Node y perfil temporal independiente. No se instaló software, no se usó IAB ni ninguna sesión personal. El servidor estuvo ligado a `http://127.0.0.1:33117`; la base fue PostgreSQL tmpfs efímero `sevilla_ready_dataset`. Todo se elimina al cerrar.

## Cobertura comprobada

Producto Schon Pollo Brakel: cambio mediante clic real de 500 g/v2 a 225 g/v1 en escritorio 1440×1000 y regreso a v2 en móvil 390×844; apertura/cierre de filas y fórmulas; fuente ySHA; advertencia de vigencia no acreditada; reproceso sin código retenido; perfiles ausentes. Selector móvil dentro de390px y cuerpo sin desbordamiento horizontal. Cabecera móvil contenida dentro de su altura fija. Las capturas fueron inspeccionadas visualmente.

Fixture sintético `FIXTURE · Control de aprobación`, sin carácter comercial: ADMIN ve Aprobar pero queda deshabilitado con explicación de fuente pendiente; el clic no cambia IN_REVIEW. R_AND_D ve la revisión pero no Aprobar. QUALITY no recibe el borrador ni sus fuentes. No se ampliaron roles. El rechazo de fuente y suma exacta del servidor sigue cubierto por las pruebas unitarias; el navegador no intenta forzar un control deshabilitado.

Es una prueba visual de las dos variantes de un producto y controles en un fixture, no una inspección visual de todos los 39 productos ni prueba del despliegue remoto. Las 606 filas del ensayo se contrastaron por separado mediante verificación de fuentes. No certifica comportamiento en Safari/Firefox ni gestos de un teléfono físico.

## Defectos comprobados y corregidos

1. Los identificadores/textos largos ensanchaban el viewport móvil: se observó ancho 465 para dispositivo 390. Ajuste de corte de palabras en evidencia/advertencias; resultado final 390/390. Las tablas anchas conservan su desplazamiento interno.
2. El nombre institucional se desbordaba verticalmente en la cabecera de 64 px. Encabezado móvil compacto, truncado y espacio mínimo adaptable; escritorio conserva el nombre completo. La cabecera ya no tapa el inicio de la sección de evidencia al desplazarla.
3. Aprobar podía intentar una fuente ya bloqueada y el build de producción mostraba error React genérico al recibir el rechazo del servidor. Aprobar yEnviar quedan deshabilitados ante bloqueos conocidos de fuente/suma, con explicación visible. Se mantiene la validación del servidor; no se expone detalle interno de errores ni se relajan reglas.

La primera ejecución tuvo además una espera insuficiente al cerrar el menú: el segundo clic era absorbido por la transición. Se corrigió la sincronización del script de pruebas; no se atribuye ese primer fallo a la aplicación. Los resultados y capturas anteriores se conservan identificados como intentos fallidos, no como resultado final.

## Evidencia

En el paquete, carpeta `visual_final/`:

| Captura | Pantalla / estado / filtro |
| --- | --- |
| desktop-producto.png | ProductoSchon Pollo Brakel; ADMIN; v2/500g; 1440×1000 |
| desktop-selector-variantes.png | Selector abierto con 225g/v1 y 500g/v2 |
| desktop-fuente-reproceso.png | v1/225g;detalle de filas abierto |
| mobile-producto.png | Producto y cabecera;v1;390×844 |
| mobile-selector-variantes.png | Selector móvil abierto; menú dentro del viewport |
| mobile-fuente-reproceso.png | v2/500g;fuente y reproceso visibles |
| desktop-aprobacion-bloqueada.png | Fixture IN_REVIEW; ADMIN;bloqueo visible y botón deshabilitado |
| desktop-rol-investigacion.png | Mismo fixture;R_AND_D;sin Aprobar |

Las rutas fueron `/productos/<id-local-del-producto>` en el origen local indicado. LosIDs son de una base desechable y no corresponden al despliegue. El reporte no contiene cookies, contraseñas ni endpoints de depuración. `resultados_visuales.json` registra15 comprobaciones, dimensiones y limpieza:0 usuarios, 0 cuentas, 0 sesiones, 0 versiones aprobadas.

Script reproducible: `scripts/review/check-visual-local.cjs`; requiere el Chrome ya instalado y una base de pruebas con fixture, y rechaza cualquier host/base distinto del destino efímero autorizado. Los secretos y credenciales temporales se generan solo en memoria. Esta utilidad no carga fuentes ni permite elegir una variante vigente.

Regresión posterior a los cambios: 149 pruebas/29 archivos, build webpack standalone, TypeScript y lint correctos. No se realizó push, despliegue, importación real, declaración de vigencia ni aprobación comercial.
