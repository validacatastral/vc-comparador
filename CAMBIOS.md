# Cambios

- 2026-11-13: carga de múltiples archivos por fecha, universo de polígonos y filtros por ubicación y CRC; entrega de trabajo en revisión.
- 2026-11-14: reportes faltantes no bloquean (⏸ Sin comparar, cruce parcial), solo se publican polígonos con todos sus sectores cargados y se lee el registro de descargas para explicar los faltantes.
- 2026-11-15: publicar solo los polígonos marcados (lista con casillas, activo marcado por defecto, última publicación al lado); un sector solo cuenta si está comparado en ambas fechas y seguro del 50% de filas inválidas/no encontradas.
- 2026-11-16: "Comparar todos (revisión final)": recorre uno por uno los polígonos del distrito activo (por UBIGEO, sin mezclar distritos), Antes por polígono, publicación opcional con reintento y resumen publicados / parciales / omitidos.
- 2026-11-16: regla de estado por campos esperados fijada con pruebas (nota "También cambió: X, Y") y columna nueva al final del Excel "Observación vs Antes → Después" (no se publica).
- 2026-11-16: "Publicar pendientes" incluye como aviso las filas ◐ cambió otro campo, con etiqueta propia "◐ Cambió otro campo, no el observado" (solo nombres de campo, sin valores); los ✔ verificado no se publican.
