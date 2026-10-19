# Alcance Docker

Runtime compilado y probado con autenticación real de fixture. Herramientas compilada/exportada como archivo Docker; su extracción normal en el motor falló por ENOSPC. Sus archivos y dependencias Linux exactos se probaron mediante montaje sobre la imagen hermana del mismo Node22/base. Pasaron migraciones, bootstrap e integración. Este modo está declarado; no sustituye el load/run normal de herramientas en un motor con espacio ni el cotejo de arquitectura del destino.

La revisión automática rechazó borrar cinco registros de build y tres capas que no estaban todas probadas como reclamables/no compartidas. La acción no se ejecutó ni se reintentó. Se continuó con alternativas: otros IDs exactos verificados como reclamables y no compartidos, una imagen incompleta propia sin contenedores, y exportación/montaje de archivos. No queda pendiente ejecutar la limpieza rechazada; no se borraron volúmenes ni datos ajenos.
