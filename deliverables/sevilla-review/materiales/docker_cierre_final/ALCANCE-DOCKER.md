# Validación normal Docker cerrada en linux/arm64

Herramientas: docker load normal del archivo verificado; run normal con migraciones, bootstrap y tres pruebas de integración, sin montar código/dependencias desde el host. Runtime actual: imagen normal construida con las instrucciones base/runtime originales y los tres artefactos de la compilación exportada; sus2215 archivos coinciden. Ejecutada sin privilegios y en solo lectura, autenticación y18 assets/páginas correctos. Los fixtures y redes se eliminaron.

La imagen de herramientas se retiró solo después de su prueba normal para recuperar espacio; el archivo original verificado se conserva. Esto permitió construir el runtime sin reinstalar dependencias. No se borraron volúmenes, imágenes ajenas ni registros. La operación previamente denegada no se reintentó: solo se reclamaron IDs propios probados como reclamables y no compartidos.

La prueba anterior con app montado se conserva como histórica y no sustenta el cierre normal actual. No se afirma equivalencia con ese modo anterior.

Arquitectura del destino: NO CONFIRMADA. Dockerfile/Compose no especifican plataforma y no hay evidencia accesible del servidor; no se reintentó SSH denegado. Hace falta una evidencia de solo lectura (uname -m, arquitectura de la VM/proveedor o plataforma configurada) para decidir si el destino es arm64 o amd64. Ninguna prueba local certifica la DB desplegada. Sin push/deploy.
