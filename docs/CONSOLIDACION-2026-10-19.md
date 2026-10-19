# Consolidación vigente — 19 octubre 2026

La guía vigente es [ESTADO-VIGENTE-ENTREGA.md](ESTADO-VIGENTE-ENTREGA.md). Los informes anteriores están en `historico/` y en `materiales`; conservan evidencia, no instrucciones actuales.

Junio (1).xlsx es el último archivo confirmado por el usuario, más correcciones posteriores documentadas. La app permite conciliar variantes en copias DRAFT y tramitar aprobación operativa. No se pide otro manifiesto o historial general para desarrollar o preparar datos.

La precisión se conserva como cadenas decimales y DECIMAL(38,24). No se normaliza la composición para llegar a100. Las identidades ambiguas se revisan por fila, sin contaminar perfiles globales. Las fuentes originales y sus hashes se conservan.

La clasificación grasa/especie se conserva por versión y llega al snapshot/documento preliminar. Faltando clasificación o nutrientes, no se permite guardar/imprimir. El criterio de Joan del1oct no sustituye los umbrales nutricionales ni afirma equivalencia legal. La etiqueta agregada de combinados está bloqueada: aprobar miembros/pesos no acredita nutrición global.

Antes de cargar: el team lead debe cotejar respaldo real, migraciones, colisiones y adaptador de destino. Los fixtures locales no son importadores de producción. La publicación del código no ejecuta importación ni despliegue; su SHA se confirma en el recibo posterior.

El código está listo para entrega única; ver [gate del team lead](ENTREGA-TEAM-LEAD.md). Compose construye en destino. La arquitectura desconocida del servidor no bloquea subir código fuente; su construcción y comprobación nativas corresponden al operador.
