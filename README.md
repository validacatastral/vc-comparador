# Comparador de Reportes SICUN — VALIDA CATASTRAL

Herramienta HTML de uso interno para control de calidad catastral. Compara dos descargas del mismo reporte SICUN (una anterior y una posterior) y muestra qué cambió a nivel de predio: celdas modificadas, predios nuevos, eliminados y renombrados.

**Autor:** ValidaCatastral ©diegocampos
**Formato:** archivo HTML único, sin instalación, sin servidor. Todo el procesamiento ocurre en el navegador del usuario; ningún archivo se sube a internet.

---

## Qué problema resuelve

El equipo descarga los mismos reportes de la plataforma SICUN en distintos momentos (por ejemplo, a las 10 a.m. y a la 1 p.m.). La pregunta operativa es *"¿qué se trabajó entre una descarga y otra?"*. Revisar eso a mano, fila por fila y sobre miles de registros, es inviable. Esta herramienta lo resuelve en segundos y deja la evidencia lista para sustentar un informe.

---

## Principio central de comparación

La unidad de comparación es el **predio (el CRC)**, no la fila. Un mismo CRC puede aparecer en varios renglones (varios titulares, varios pisos, varias obras); la herramienta agrupa todos los renglones de un CRC y compara ese bloque contra el bloque del otro archivo. Los renglones que sobran de un lado se reportan como *agregados* o *retirados*, no como predios nuevos o eliminados.

---

## Reportes soportados

La herramienta detecta automáticamente el tipo de reporte por sus encabezados y aplica la llave correcta:

| Reporte | Llave de agrupación | Firma de detección |
|---|---|---|
| Unidades Administrativas | Código de Referencia Catastral | `Código Predial de Rentas` |
| Titulares | Código de Referencia Catastral | `% de Cotitular` |
| Construcciones | Código de Referencia Catastral | `Muros y Columna` |
| Obras Complementarias | Código de Referencia Catastral | `Producto Total` |
| Recapitulaciones | Código de Referencia Catastral | `crcUa` |
| Ingresos por Lote | Código del Lote (14 díg.) | `Número Orden` |

Cada reporte tiene su propia fila de carga en la pantalla. Si se sube un archivo a la fila equivocada, esa fila lo advierte sin afectar a las demás.

---

## Estructura del CRC

El Código de Referencia Catastral de 24 dígitos se descompone así:

```
UBIGEO(6) · SECTOR(2) · MANZANA(3) · LOTE(3) · EDIFICACIÓN(2) · ENTRADA(2) · PISO(2) · UNIDAD(3) · DV(1)
```

El *Código del Lote* de 14 dígitos es ese mismo código cortado hasta el nivel de lote. La herramienta usa esta estructura para el resaltado por colores y para el filtro por ubicación.

---

## Flujo de uso

1. **Distrito** — arriba, se crea un distrito escribiendo su nombre. Cada distrito tiene su propio juego independiente de los seis reportes. Se cambia de distrito con las pestañas; el estado (archivos cargados y comparaciones) de cada uno se conserva por separado dentro de la sesión.
2. **Cargar** — dentro del distrito activo, cada reporte en su fila, con su par ANTES (descarga anterior) y DESPUÉS (descarga nueva).
3. **Comparar** — botón individual por fila, o "Comparar todo" para correr los que tengan sus dos archivos.
4. **Resumen de la jornada** — tablero con una línea por reporte: predios, modificados, nuevos, eliminados, renombrados y semáforo (avanzó / sin cambios / pendiente).
5. **Detalle** — al tocar una línea del tablero se abre el detalle de ese reporte: conteos, tabla de cambios celda por celda, filtro por ubicación y exportación.

El tema visual por defecto es **Cálido**; se puede cambiar desde la barra superior (Cálido, Neon, Oscuro VC, Claro).

---

## Funcionalidades clave

### Organización por distrito
Como los reportes salen por distrito, la herramienta agrupa todo bajo un selector de distritos en la parte superior. El usuario crea los distritos que necesite (escribiendo su nombre); cada uno contiene su propio juego completo de los seis reportes, con carga, comparación y detalle independientes. Cambiar de distrito no mezcla ni pierde el trabajo del otro. La comparación dentro de un distrito no cambia: se asume que cada par ANTES/DESPUÉS de un reporte pertenece al mismo distrito.

### Detección de cambios
- Comparación celda por celda dentro de cada bloque de CRC.
- Emparejamiento de renglones por similitud (greedy global): cuando un CRC tiene varios renglones, se aparean los más parecidos entre las dos descargas.
- Resumen por campo: cuántos cambios hubo en cada columna (área verificada, forma de adquisición, etc.).
- Campos críticos priorizados: los que sustentan observaciones salen primero en la tabla.

### Detección de CRC renombrados
Si un predio cambia de código entre descargas, un comparador ingenuo lo reportaría como un eliminado + un nuevo. La herramienta cruza eliminados contra nuevos y, si comparten ≥80% de los campos, los marca como *renombrado* en un panel aparte.

### Avance por ubicación (consolidado del distrito)
Sección aparte que cruza **todos los reportes comparados** de un distrito para una misma ubicación. Se filtra por Sector · Manzana · Lote · … (casillas encadenadas) y muestra:
- Una tabla con los seis reportes: predios, modificados, nuevos, eliminados y % de avance de esa ubicación, con fila TOTAL.
- El detalle de los cambios de esa ubicación, reporte por reporte (celda por celda).
- Un **conteo catastral** calculado sobre Unidades Administrativas, con comparación ANTES vs DESPUÉS y Δ: unidades, lotes, lotes edificados, edificas y excluidos. Regla de conteo: se excluye todo CRC con Edificación = 99 o Unidad = 999; unidades = renglones válidos; lotes = combinaciones sector·mz·lote distintas (lote ≠ 999); edificas = sector·mz·lote·edifica distintas (edifica ≠ 99).
- Botón para exportar todo el consolidado de esa ubicación a Excel (hojas AVANCE, CAMBIOS, CONTEO).

Importante: el consolidado solo suma los reportes ya comparados en el distrito; los no cargados aparecen como "sin comparar". El total es "de lo comparado", no del universo completo.

### Carga masiva
Además de las seis filas manuales, una zona superior acepta todos los archivos de una vez: los clasifica por sus encabezados, los reparte a la fila que corresponde y decide ANTES/DESPUÉS por el sello de descarga de `Nombre Backup` (el más antiguo va a ANTES; si falta, usa la fecha del archivo). Muestra el reparto resultante para poder corregirlo.

### Terminología
La columna que cuenta CRC distintos se llama **Registros**, no "predios": un CRC de 24 dígitos identifica hasta el nivel de unidad, no un predio en sentido catastral. Las **Unidades** son un conteo aparte, con la regla de exclusión 99/999.

### Reporte por manzana (diario)
Sección aparte pensada para el parte diario. Recorre todos los reportes comparados del distrito y arma **una fila por manzana** con: unidades catastrales, modificados, nuevos, eliminados, el % de avance de cada uno de los seis reportes y un % total, más una columna **Técnico**.
- Lista todas las manzanas del reporte (no solo las trabajadas), con filtro "solo manzanas con avance".
- El avance de cada reporte va en su propia columna (UA · TIT · CON · OBR · REC · ING); el guion indica "sin comparar".
- La columna de unidades muestra el cambio: valor actual, delta y valor anterior.
- Orden por cualquier columna en ambos sentidos: clicando el encabezado (alterna ↓/↑) o desde el desplegable, que quedan sincronizados.
- Clic en una fila abre esa manzana en la sección de avance por ubicación, con su antes→después celda por celda.
- Asignación de técnicos por tres vías: escribiendo en la celda, pegando líneas `sector,manzana,técnico` (admite varios separados por `;`), o cargando un Excel con esas columnas. También asignación masiva a todas las manzanas de un sector.
- Botón de exportación del parte diario, con distrito y fecha.

Los técnicos se guardan por distrito durante la sesión; al recargar la página se pierden (la herramienta no almacena datos por diseño).

### Formato de las exportaciones
Todos los Excel se generan con ExcelJS y salen formateados: encabezado con fondo oscuro y texto blanco, filas alternadas, fila TOTAL resaltada, anchos de columna calculados, autofiltro, panel congelado y porcentajes con formato numérico real (no texto). Si la librería no cargara, la herramienta cae automáticamente a una exportación plana en vez de fallar.

### CRC en columnas (opcional)
Dos controles opcionales, independientes del resto:
- **Vista:** un botón junto a las pestañas alterna el CRC entre pegado (un código de 24 dígitos) y separado en siete columnas (Sector · Manzana · Lote · Edificación · Entrada · Piso · Unidad). No afecta la comparación, solo cómo se ve.
- **Exportación:** un botón adicional ("Exportar con CRC descompuesto") genera un Excel donde todas las hojas (MODIFICADOS, NUEVOS, ELIMINADOS, RENOMBRADOS) traen el CRC completo más sus siete columnas separadas. Los dos botones de exportación normales se mantienen sin cambios.

### Filtro por ubicación catastral
Siete casillas encadenadas (Sector → Manzana → Lote → Edificación → Entrada → Piso → Unidad). Al filtrar, las tablas se recortan y aparece un mini-resumen de avance de esa ubicación con su porcentaje y semáforo. Responde directo a *"¿esta manzana se avanzó?"*.

### Normalización (para evitar falsos positivos)
- **Espacios y mayúsculas:** `'PRINCIPAL '` y `'principal'` se tratan como iguales.
- **Tolerancia numérica (0.001):** `116.29` y `116.290` no cuentan como cambio.
- **Campos de trámite ignorables:** firmas, supervisor y técnico catastral (cambian al reprocesar aunque el predio no cambie). Interruptor global.

### Columnas siempre ignoradas
`Nombre Backup` (trae el sello de la descarga, distinto en cada archivo), `Departamento`, `Provincia`, `Distrito`, `Ubigeo` (constantes). De no ignorarse, marcarían el 100% de los registros como modificados.

---

## Exportaciones (por reporte, desde el detalle)

1. **Reporte de cambios** — Excel nuevo con hojas `RESUMEN`, `MODIFICADOS` (CRC + despiece + campo + antes/después), `NUEVOS`, `ELIMINADOS`, `RENOMBRADOS`. No toca los archivos originales.
2. **Copia marcada** — copia del reporte DESPUÉS con dos columnas añadidas: `ESTADO` (NUEVO / MODIFICADO / SIN CAMBIO) y `CAMPOS_CAMBIADOS`. Para filtrar directamente en Excel.

Los nombres de archivo incorporan el sello de descarga de ambos reportes para trazabilidad (ej. `COMPARA_Titulares_0807_2306_vs_0807_1315.xlsx`).

---

## Puntos de atención conocidos

- **Renglones duplicados exactos:** algunos reportes (Obras, Titulares) traen renglones idénticos repetidos en el mismo CRC. La herramienta los aparea por similitud; el neto es correcto, pero el número de fila reportado puede no ser el esperado. Se avisan en un panel.
- **La copia marcada rehace el archivo:** sale sin formato. Los códigos con ceros a la izquierda se escriben como texto para preservarlos.
- **Sin persistencia:** al recargar la página se limpia todo. No guarda nada en disco por diseño.
- **Ingresos por Lote** no tiene CRC de 24 dígitos sino Código del Lote de 14; se agrupa por ese código.

---

## Recomendación de proceso (fuera de la herramienta)

Guardar las descargas originales sin renombrar, en carpetas por fecha y hora. La herramienta compara lo que se le entregue, pero no puede reconstruir un archivo que ya no existe.

---

## Estado técnico

- **Dependencia única:** SheetJS (XLSX) vía CDN, para leer y escribir los .xlsx.
- **Temas visuales:** cuatro (Neon, Oscuro VC, Claro, Cálido), conmutables desde la barra superior.
- **Probado** con datos reales de los seis reportes: los conteos de modificados, nuevos, eliminados, renombrados y el avance por ubicación salen exactos frente a cambios sembrados de control.

---

## Pendientes / posibles mejoras

- Calibrar la firma de reportes adicionales si aparecen nuevos tipos.
- Definir una fórmula de *completitud real* (qué campos marcan que un predio está "terminado") para complementar el indicador de avance, que hoy mide "cuánto se movió", no "cuánto falta".
- Opción de que las exportaciones respeten el filtro por ubicación activo (exportar solo la manzana en pantalla).
- Resaltado de celdas en color dentro de la copia marcada (requeriría cambiar de SheetJS a ExcelJS).
