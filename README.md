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

## Modo polígono y filtros múltiples

Cada casilla admite varios archivos del mismo reporte; la carga masiva los agrupa por día y permite elegir fechas cuando hay más de dos. Carga un Excel con una hoja por polígono y columnas SECTOR y MANZANA para recortar las comparaciones. Los filtros de detalle y avance permiten seleccionar varios sectores, manzanas y lotes o pegar códigos CRC y de lote. Todo permanece en memoria durante la sesión.

## C2 — Cruce con Excel del revisor

Dentro del distrito de trabajo, carga uno o varios `.xlsx` de revisores mediante **Excel del revisor** y compara los pares de reportes SICUN. Los archivos se procesan en memoria, sin escribir en las hojas originales. El nombre del archivo aporta el código de polígono; se leen únicamente las hojas `VAL_`. La tarjeta de carga muestra filas válidas, revisadas, estados y hojas sin columna de estado. Las observaciones sin estado cuentan como no revisadas.

La sección **Cruce revisor** agrupa titulares y muestra la hoja original, la regla FI, el código, los cambios y el resultado. `APLICA` se contrasta con los campos de `C2_MAP`; `OTRO CAMBIO` considera cualquier campo y el aviso de `NO APLICA` puede desactivarse. Las diferencias, altas, bajas y renombres provienen de los resultados existentes del comparador. Se pueden filtrar por validador y resultado, además de los filtros de ubicación y polígono activos. Los códigos numéricos o ambiguos se indican como incompletos. Se indica en la nota cuándo hay reportes sin comparar o no se puede comprobar el piso.

Cada exportación formateada agrega `CRUCE_REVISOR` y `CRUCE_RESUMEN` mientras haya archivos de revisor cargados. Las columnas de código se escriben como texto. El mapeo editable `C2_MAP` está al inicio del script; usa las cabeceras SICUN facilitadas el 13/11/2026, con `OBR` y `REC` como identificadores internos para obras y recapitulaciones. La comparación de nombres ignora tildes, mayúsculas y diferencias de espacios múltiples, y equipara guiones largos y cortos.

Para comprobarlo sin datos reales: crear en memoria un libro con hojas `VAL_CRC-X`, `VAL_FECHA_PISO` y `VAL_TITULARES_1-Y`, incluir estados válidos, vacío y selección múltiple, y cargar pares sintéticos UA, CON y TIT con cambios conocidos. Ejecutar **Comparar todo**, revisar conteos y resultados, y exportar para comprobar ambas hojas. La comprobación con `260210019.xlsx` y los reportes reales queda a cargo de quien tenga acceso autorizado a esos archivos.

## Publicar pendientes del cruce revisor

El cruce añade **Técnico** después de Hoja en el detalle y en `CRUCE_REVISOR`, con filtro independiente. Se toma `ENCARGADO` de cada fila (sin espacios ni saltos, en mayúsculas); si está vacío o falta, se usa el sufijo después del último `-` de la hoja, excepto `VAL_*` y `TODOS`. Sin candidato válido: `SIN ASIGNAR`.

### Configurar ⚙ Publicación

1. En **Cruce revisor**, abrir **⚙ Publicación**.
2. Introducir la URL HTTPS del despliegue de Apps Script terminada en `/exec` y la **Clave de escritura**. La clave se muestra como contraseña.
3. La URL se conserva en `localStorage['vc-cmp-pub-url']`. La clave de escritura usa `sessionStorage` por defecto; solo pasa a `localStorage['vc-cmp-pub-key']` al marcar Recordar. Si el almacenamiento está bloqueado, se pueden usar los campos durante la sesión.
4. Pulsar **Publicar pendientes**. Se prepara el cruce completo: se quitan los filtros de polígono y ubicación y se activan los avisos NO APLICA. Los filtros de Validador, Técnico y Resultado solo afectan el detalle, no la publicación.
5. Se abre una lista con casillas de los polígonos cargados. Por defecto solo viene marcado el polígono activo (o el único cargado); los demás quedan desmarcados. Cada uno muestra pendientes, los seis conteos, fechas ANTES → DESPUÉS y su **última publicación** (fecha/hora y pendientes), leída del servidor con `GET ?api=pendientes` (lo mismo que muestra vc-pendientes); si el servidor no responde se usa como respaldo lo guardado en este navegador (`localStorage['vc-cmp-pub-last']`) y se indica. Aparecen deshabilitados, con el motivo, los que no tienen todos sus sectores comparados (`faltan S38, S39`) y los que no pasan el seguro del 50% (`857 de 860 inválidas o no encontradas`). **Publicar marcados** hace un POST por cada polígono marcado; nunca se envía uno no marcado. **Cancelar** o Escape cierra sin publicar.

Se requiere una única fecha ANTES y una única fecha DESPUÉS entre los reportes comparados. Las fechas provienen de `fileDate`, igual que las fechas de descarga del comparador, en `dd/mm/aaaa`. Los archivos del revisor deben contener el polígono de nueve dígitos en su nombre. Los archivos de un mismo polígono se agrupan en un único envío.

El endpoint recibe JSON con `accion: 'publicarPendientes'`, `k`, `poligono`, `antes`, `despues`, `totales`, `porValidador`, `porTecnico` y `filas`, mediante POST con `Content-Type: text/plain;charset=utf-8`. Los conteos usan las mismas seis categorías de las tarjetas C2. Debe responder JSON de éxito (por ejemplo `{"ok":true}`); `error`, `ok:false`, `success:false` o un estado HTTP fallido se muestran en la página y detienen los envíos restantes. El despliegue debe permitir leer su respuesta desde el origen del HTML (CORS).

**Filas publicadas:** `⚠ SIN CAMBIO EN SICUN`, `ℹ NO APLICA pero SICUN cambió` y, como aviso, las `◐ CAMBIÓ OTRO CAMPO` (APLICA, SICUN cambió pero ningún campo esperado del validador), que salen con `resultado: "◐ Cambió otro campo, no el observado"` para distinguirlas. Los `✔ VERIFICADO` (esperado + extra) no se publican. En el diálogo, lo nuevo y la última publicación se comparan con el mismo criterio: *pendientes* = ⚠ + ℹ, con el desglose `⚠ X · ℹ Y · ◐ Z` en ambas líneas.

**Datos publicados:** identificadores de polígono y código, técnico, hoja, validador, FI, sector-manzana-lote, piso, estado, resultado, nombres de campos cambiados y observación saneada. `campos` contiene exclusivamente `REPORTE · Campo`, sin valores; `obs` sustituye secuencias de ocho o más dígitos por `••••` y se limita a 500 caracteres. No se publican Mensaje validador, Qué cambió ni valores SICUN antes/después. Los códigos y el polígono conservan sus dígitos porque son identificadores requeridos. La exportación Excel conserva su contenido previo, con la única adición de Técnico.

La publicación es opcional y envía estos datos al endpoint configurado únicamente tras confirmar. Los archivos Excel completos siguen procesándose localmente. La URL y clave sí persisten al recargar, a diferencia de los archivos y resultados.

### Cómo probar con datos sintéticos

- Cargar filas APLICA en hojas `VAL_CRC-CRISTINA`, `VAL_TITULARES_2-HENRY` y `VAL_CRC-TODOS`. Probar `ENCARGADO = " he n\nry "` → `HENRY`, celda vacía → sufijo de hoja y `TODOS` sin encargado → `SIN ASIGNAR`. Comprobar filtro y columna Técnico en pantalla y Excel.
- Comparar dos reportes con un cambio en Área Verificada (por ejemplo `11111111` → `99999999`). Usar observación `DNI 12345678` y otra de más de 500 caracteres. Incluir estados APLICA, OTRO CAMBIO y NO APLICA con cambio.
- Para interceptar sin publicar, ejecutar en la consola del navegador antes de confirmar:

  ```js
  window.enviosPrueba = [];
  window.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    window.enviosPrueba.push(payload);
    console.assert(options.headers['Content-Type'] === 'text/plain;charset=utf-8');
    for (const fila of payload.filas) {
      console.assert(!/\d{8,}/.test(fila.obs));
      console.assert(fila.obs.length <= 500);
      console.assert(!/11111111|99999999|→/.test(fila.campos));
      console.assert(!('message' in fila) && !('change' in fila));
    }
    return {ok: true, text: async () => JSON.stringify({ok: true})};
  };
  ```

- Cargar dos polígonos, confirmar ambos y comprobar dos entradas en `enviosPrueba`, fechas correctas y suma de filas/conteos. Antes de confirmar no debe haber envíos. Comprobar `obs === 'DNI ••••'` y campos como `CON · Área Verificada`. Recargar restaura `fetch` real.
- Simular un error devolviendo `{"error":"Clave inválida"}` y verificar que aparece en la página. Probar cancelar, URL/clave vacías y filtros de detalle activos.
- Comparar contra `main`: mismos conteos del motor y C2, misma hoja `CRUCE_RESUMEN` y mismo `CRUCE_REVISOR` al retirar la nueva columna Técnico.

Validación realizada con Chromium/Playwright y workbooks sintéticos en memoria: prioridad y alternativas de técnico, filtro, modal, dos POST simulados por polígono, fechas, saneamiento, respuesta de error y regresión contra `main` de los resultados del motor y ambas hojas C2. Ningún envío real durante las pruebas.

### Asignar técnicos por validador y polígono

En Cruce revisor, abrir **👤 Asignar técnicos**, junto a **⚙ Publicación**, y elegir un polígono cargado. El panel muestra los validadores y el número de filas del Excel, incluidas las pendientes que todavía no aparecen en el cruce. Cada entrada sugiere técnicos conocidos de los archivos y de las asignaciones de los polígonos cargados.

Las asignaciones se guardan al cambiar el campo, en mayúsculas y sin espacios extremos, en `localStorage['vc-cmp-asig-<poligono>']`, como `{validador: 'TECNICO'}`. Solo se aplican a filas `SIN ASIGNAR`: ENCARGADO y el sufijo de la hoja conservan prioridad. Si todas las filas del validador ya tienen técnico, se muestra `desde Excel: NOMBRE` y el campo queda deshabilitado. En grupos mixtos solo reciben la asignación las filas sin técnico.

**Limpiar asignación** elimina las asignaciones del polígono seleccionado. La asignación afecta tabla, filtro Técnico, columna Técnico de `CRUCE_REVISOR` y publicación (`filas` y `porTecnico`). No modifica archivos fuente ni Sheets de revisores. Las asignaciones persisten al recargar; hay que volver a cargar los archivos.

Prueba para Rodrigo (datos sintéticos; sin publicar a un endpoint real):

1. Cargar un Excel del polígono `123456789` con tres filas APLICA del mismo validador: una con ENCARGADO `ANA`, otra sin encargado en hoja `VAL_CRC-LUIS`, otra sin encargado en `VAL_CRC-TODOS`. Incluir otro validador que tenga técnico en todas sus filas.
2. Abrir el panel: comprobar el número de filas por validador, las sugerencias ANA/LUIS y el campo deshabilitado con `desde Excel` del otro validador. Asignar `  rodrigo  ` al primer validador y salir del campo: debe guardarse `RODRIGO`.
3. Comprobar que las tres filas mantienen ANA, LUIS y RODRIGO respectivamente. Filtrar Técnico por RODRIGO: solo aparece la fila asignada. Cargar otro polígono con el mismo validador: debe seguir SIN ASIGNAR hasta recibir su propia asignación.
4. Exportar y revisar Técnico en `CRUCE_REVISOR`. Con el interceptor `window.fetch` del apartado anterior, preparar la publicación de una fila sin cambio: comprobar `filas[].tecnico === 'RODRIGO'` y `porTecnico.RODRIGO`. No enviar a un endpoint real.
5. Recargar y volver a cargar los Excel: RODRIGO se conserva. Pulsar **Limpiar asignación** en ese polígono: vuelve a SIN ASIGNAR en tabla, filtro, exportación y nueva preparación de publicación; las asignaciones del otro polígono permanecen.

Validación de esta función: `node --check` de los scripts extraídos; comparación de las declaraciones protegidas contra `main`; pruebas sintéticas con Chromium/Playwright del panel, prioridad ENCARGADO/sufijo, copias sin mutación, separación por polígono, normalización, tabla/filtro, persistencia, limpieza, exportación y payload. Sin envíos reales.


## Cargar desde Drive en la página pública

Este repositorio y su código serán públicos en GitHub Pages: https://validacatastral.github.io/vc-comparador/. No incluir archivos catastrales, respuestas de Drive, URL de despliegue real ni claves en commits, capturas o incidencias. Las claves se introducen en la página, nunca en el HTML. La clave de lectura debe ser distinta de la clave de escritura y el servidor debe validarlas por separado.

1. Crear o seleccionar un distrito de trabajo. Abrir **⚙ Publicación / URL de Drive**, disponible sin cargar archivos, e introducir la URL HTTPS `/exec` de InformeSICUN. Es el mismo campo `pubUrl` que utiliza Publicación. Configurar la clave de escritura solo si se va a publicar.
2. Introducir **Clave de lectura** en el panel Drive. Usa `sessionStorage['vc-cmp-drv-key']` por defecto. Marcar **Recordar** la traslada a `localStorage['vc-cmp-drv-key']`; desmarcar elimina esa copia persistente y vuelve a sesión.
3. Pulsar **☁ Cargar desde Drive**. Elegir polígono y cargar su Excel del revisor. Se usa el mismo lector que el selector manual; el revisor queda en el distrito actual. Se admite `.xlsx` o Google Sheet exportado como XLSX por el servicio. Si hay varios, se elige el único cuyo nombre coincide con la carpeta; de otro modo se avisa para resolver la ambigüedad.
4. Revisar sectores deducidos de los CRC del revisor (UBIGEO+SS), marcados inicialmente. Se pueden quitar o añadir sectores de dos dígitos o UBIGEO+SS de ocho. Los códigos parciales del revisor permiten deducir SS; requieren elegir con cuidado el distrito de Drive.
5. Elegir carpeta DISTRITO y **Buscar fechas**. Se leen sus carpetas `Sxx` y se agrupan los nombres `rep_TIPO_UBIGEO+SECTOR_AAMMDD.xlsx`. Por defecto las fechas son **automáticas por sector** (ver *Fechas automáticas por sector*) y se muestra el resumen antes de cargar. Con **Elegir fechas a mano** aparecen los selects ANTES/DESPUÉS de siempre (las dos fechas más recientes propuestas; deben ser distintas y estar ordenadas), una sola pareja para todos los sectores. Un tipo ausente de ambas fechas no se inventa ni se compara.
6. **Cargar y comparar** descarga como máximo tres archivos a la vez y muestra `n de N`. Antes de incorporar los reportes se validan fecha, tipo, encabezados y ubigeo cuando el revisor lo proporciona. Se crea un distrito de trabajo nuevo con los reportes y una copia del revisor; las tarjetas anteriores se conservan. Usa `readWorkbook`, `detectPreset`, `loadInto` y `runAll`, igual que las cargas manuales. La carga manual individual y masiva sigue disponible.

Límites: 25 MiB por XLSX decodificado y 150 MiB por selección; tiempo de espera de 60 segundos por petición. Los archivos bajados se guardan en la **caché del navegador** (ver abajo); los resultados de la comparación no se persisten. Además de URL/clave, `localStorage['vc-cmp-drv-last']` recuerda la última carpeta de polígono/distrito y, tras una carga, la **última carga** (`carga`: polígono, distrito, sectores, modo de fechas y fechas usadas) para **↻ Repetir última carga**. Las preferencias y asignaciones manuales preexistentes mantienen su comportamiento.

### Caché de archivos de Drive

- **Qué guarda:** cada archivo bajado de Drive (reportes y Excel del revisor, también en *Comparar todos*) queda en IndexedDB `vc-cmp-cache` de este navegador: tienda `meta` `{clave, id, modificado, tamano, nombre, ocupa, ultimoUso}` y tienda `datos` `{clave, bytes}`. La clave es `id|modificado|tamaño` (de `listar`; `modificado` puede venir como `modificado` o `modifiedTime`).
- **Cuándo se usa:** antes de pedir `api=archivo` se busca la clave; si está, se usa y se actualiza `ultimoUso`. Si en Drive cambió la fecha de modificación o el tamaño, la clave ya no coincide: se baja de nuevo y se borra la versión vieja. Un archivo sin `modificado` en el listado no se guarda (no se podría saber si cambió).
- **Vencimiento:** al abrir la página se borra todo lo que lleva **más de 7 días sin usarse** (desde su último uso, no desde que se bajó).
- **Durante la carga** se ve `X de caché · Y bajados de Drive`.
- **Botón Borrar datos guardados** (pide confirmación) vacía la base; al lado se muestra lo ocupado (`Guardado: 85 MB`).
- **Sin IndexedDB** (modo privado, bloqueado o lleno): se sigue como antes, todo desde Drive, con un aviso pequeño. Un fallo de la caché nunca corta la carga.
- **Ojo:** son **datos catastrales reales guardados en el navegador del encargado**. No usar la caché en PCs compartidas; al terminar en un equipo ajeno, pulsar **Borrar datos guardados**.

### Fechas automáticas por sector

- **ANTES = descarga ORIGINAL de cada sector:** la fecha más antigua de su carpeta `Sxx` que tenga los tipos de reporte requeridos (todos los tipos que aparecen en esa carpeta). Si ninguna los tiene todos, la más antigua con más tipos. Un tipo nuevo que solo aparece en la última descarga no mueve el ANTES. Cada sector usa su propia fecha; pueden ser distintas entre sectores.
- **DESPUÉS = última descarga COMPLETA:** la fecha más reciente que tenga **todos** los tipos de su ANTES. Si la última está incompleta se usa la anterior completa y se avisa: `S09: 18/11 incompleto (3/6), se usa 16/11`. En DESPUÉS se bajan solo los tipos que tiene su ANTES.
- **Sin fecha completa posterior** (o una sola descarga): el sector se **excluye** y se lista como faltante, sin cortar la carga; los polígonos que lo necesitan quedan sin poder publicarse (`faltan Sxx`), como hoy.
- **Resumen antes de cargar:** `S08: 02/10 → 18/11 · S09: 25/09 → 16/11 (18/11 incompleto)`.
- **Publicación:** con fechas por sector, `antes` = la fecha más antigua usada por los sectores del polígono y `despues` = la más reciente. En `parcialDetalle` van los sectores con fecha distinta (`S09: fechas 25/09 → 16/11 (18/11 incompleto (3/6))`) y los excluidos (`S10: excluido (…)`). Un excluido marca `parcial`; una fecha distinta sola no.
- **Elegir fechas a mano** mantiene los selects `drvBefore`/`drvAfter` para casos especiales (una pareja única para todos los sectores, como antes).

### ↻ Repetir última carga

Junto a **☁ Cargar desde Drive**. Usa el polígono, la carpeta DISTRITO y los sectores de la última carga, vuelve a listar Drive, aplica siempre las **fechas automáticas por sector** y carga y compara sin pasar por los pasos del modal (el progreso y los faltantes se ven en el mismo cuadro). Deshabilitado si no hay última carga guardada. Con la caché, lo que no cambió en Drive no se vuelve a bajar.

### Contrato de InformeSICUN

Peticiones GET simples, sin cabeceras personalizadas ni preflight:

```text
<URL>/exec?api=listar&k=<claveLectura>&raiz=validaciones
<URL>/exec?api=listar&k=<claveLectura>&raiz=reportes&carpeta=<id>
<URL>/exec?api=archivo&k=<claveLectura>&id=<fileId>
```

`listar` acepta `{carpetas:[{id,nombre}], archivos:[{id,nombre,mimeType,size}]}`, o una lista mixta (array directo o `{items:[...]}`). En las listas mixtas las carpetas llevan `mimeType: 'application/vnd.google-apps.folder'`, `folder: true`, `esCarpeta: true` o `tipo: 'carpeta'`. También admite `name` en vez de `nombre`. Los Google Sheets llevan `mimeType: 'application/vnd.google-apps.spreadsheet'`. `archivo` devuelve `{nombre,base64}` con bytes XLSX, también para Google Sheets. `size` es opcional y se interpreta en bytes.

El despliegue debe permitir acceso desde Pages y devolver JSON legible tras las redirecciones de Apps Script; el cliente no puede corregir permisos o CORS del servidor. Claves inválidas: HTTP 401/403 o `{error:'clave inválida'}`. No se muestran URLs ni respuestas crudas en los errores. Al ir la clave en la query de GET, el servidor debe evitar registrarla en sus logs. La carga del revisor y la comparación son locales; Publicar pendientes sigue siendo una acción explícita independiente.

### Verificación sintética

Se verificó en Chromium con `fetch` interceptado, SheetJS y XLSX generados durante la prueba: seis tipos de reporte, dos sectores y dos fechas (24 archivos), más un revisor con dos filas. Se compararon los nombres y datos de las tarjetas, resultados del motor y hojas/resumen C2 contra la carga manual de los mismos bytes. Se comprobó también la carga manual posterior, el máximo de tres descargas concurrentes, GET simples, almacenamiento de clave con/sin Recordar y errores de clave, carpeta vacía, fecha inválida y tamaño. `node --check` se ejecuta sobre cada script inline extraído del HTML.

Las pruebas se mantienen fuera del commit para limitar el PR a `index.html` y este README. No se usaron archivos ni credenciales reales. Los pasos para Rodrigo figuran en el PR; la comprobación contra un despliegue real de InformeSICUN queda como validación de integración del servicio.

## Comparar todos (revisión final)

Botón **▶ Comparar todos (revisión final)**, junto a **☁ Cargar desde Drive**. Recorre los polígonos del distrito de trabajo **uno por uno** con el mismo flujo de **Publicar pendientes** (`pubPreparar` → `pubOpciones`/`pubSeguro` → `pubPayload` → `pubPost`); no es un camino paralelo.

- **Solo el distrito activo.** El universo guarda ahora el UBIGEO de cada polígono (columna `UBIGEO` del Excel, o los 6 primeros dígitos de las manzanas de `api=universo`). El UBIGEO del distrito se deduce de los reportes: de los nombres `rep_TIPO_UBIGEO+SECTOR_AAMMDD.xlsx` de la carpeta DISTRITO elegida (Drive) o de los CRC ya cargados (carga manual). Si aparecen dos UBIGEO se detiene sin recorrer nada. Los polígonos de otro UBIGEO nunca se recorren; uno sin UBIGEO claro va a **omitidos** con su motivo.
- **Drive** (distrito sin reportes cargados): elegir carpeta DISTRITO → **Buscar polígonos del distrito**. Por polígono se baja su Excel de `Validaciones_alfanuméricas / <pol> / <pol>.xlsx` (solo lectura) y los reportes de `DISTRITO / Sxx` de su UBIGEO, sus sectores y sus dos fechas; se cruza, se publica si corresponde y **se suelta todo** antes del siguiente (solo queda una línea de resumen). Un archivo con CRC de otro UBIGEO/sector se rechaza.
- **Fechas por sector:** cada sector del polígono usa **su** Antes (su descarga más antigua en Drive: la original, nunca la del día anterior) y **su** Después (su descarga más reciente); no hay una fecha única por polígono que deje sectores sin reporte. La lista previa y el resumen muestran las fechas por sector; si no coinciden se avisa sin bloquear (`Después mixto: 5 del 16/11, 1 del 17/11`). El Antes de cada sector se puede corregir en la lista antes de lanzar. Un sector sin reportes o con una sola descarga deja el polígono en omitidos con su motivo.
- **Carga manual** (distrito con reportes y Excel del revisor ya cargados): se usa lo cargado, sin Drive.
- **Publicar** es opcional: casilla *Publicar pendientes al terminar cada polígono* (desmarcada = solo compara). Al publicar, cada polígono reintenta con espera creciente (5 s, 15 s, 35 s) por el bloqueo de 30 s del Apps Script; un error de clave no se reintenta. Un polígono con error queda en el resumen y **no detiene** a los demás.
- **Resumen del distrito:** publicados / parciales / omitidos, con motivo (falta Antes, falta Después, sin cruce, sectores incompletos, seguro del 50 %, error).
- No escribe en los Sheets de revisores ni usa `localStorage`. Los archivos que baja pasan por la caché de Drive (IndexedDB `vc-cmp-cache`), igual que en *Cargar desde Drive*.

Pruebas con datos sintéticos: `node tests/comparar-todos.test.js` (dos distritos sin mezclar, Antes por polígono, error que no corta el lote, reintento, resumen, 40 polígonos seguidos).

## Panel Pendientes publicados

Sección plegable **Pendientes publicados**, debajo de *Universo de polígonos*. Al abrirla (no antes) se crea un iframe a `https://validacatastral.github.io/vc-pendientes/#pol=<polígono activo>` a todo el ancho y 75 % del alto de la ventana, con `title` accesible.

- Sigue al selector **Polígono activo**: al cambiarlo solo cambia el hash del iframe. Sin polígono se ve la portada de vc-pendientes.
- Tras **Publicar** con éxito se recarga el iframe para ver lo recién publicado.
- **Abrir en pestaña ↗** abre la misma vista en una pestaña nueva.
- No copia código de vc-pendientes ni lo modifica.

Pruebas con datos sintéticos (sin navegador): `node tests/cache-fechas-pendientes.test.js` (ANTES/DESPUÉS por sector con fechas distintas, último incompleto y sector excluido; publicación coherente; caché con IndexedDB simulado: clave, último uso, vencimiento, cambio en Drive y sin IndexedDB; repetir sin datos guardados; hash del iframe).

## Regla de estado por campos esperados y columna Observación vs Antes → Después

- **Regla (estado APLICA):** si cambió al menos un campo esperado del validador (observado o relacionado en `CAMPOS_VALIDADOR`), el resultado es `✔ VERIFICADO`, aunque hayan cambiado otros; los extras van en la nota `También cambió: X, Y` (solo nombres de campo). `◐ CAMBIÓ OTRO CAMPO` solo cuando ningún campo esperado cambió y sí cambió otro. `NO APLICA` y `OTRO CAMBIO` no cambian.
- **Mapeo:** `VAL_USO_CIIU` acepta `CON · Código De Actividad Económica (CIIU)` y también `UA · Código De Uso` / `UA · Descripción Del Uso`. La tabla no se modificó; `tests/regla-campos-esperados.test.js` recorre los 55 campos esperados de los 11 validadores.
- **Vista:** la celda *Qué cambió* separa `Esperado: …` (primero) de `También cambió: …` / `Otro campo: …`, con Antes → Después, al lado de *Observación*.
- **Excel descargado:** una columna nueva al final de `CRUCE_REVISOR`, `Observación vs Antes → Después` (`Observación: … ‖ Esperado: … ‖ También cambió: …`). Las 16 columnas anteriores conservan nombre, orden y contenido.
- **No se publica:** esa columna trae la observación completa y valores SICUN (pueden ser nombres o DNI); no va a *Publicar pendientes* ni a la página pública. El payload sigue llevando solo nombres de campo y la observación saneada opcional.

## Universo Drive y tabla C2

El botón **☁ Cargar universo desde Drive** usa la URL `/exec` configurada y la clave de lectura (`drvKey`): `GET ?api=universo&k=…`. Se espera `{"poligonos":{"150112001":["15011219057"]}}`, con manzanas de 11 dígitos (ubigeo + sector + manzana). Comparte estructura, resumen y selección con el Excel manual. El asistente obtiene el universo si aún no está cargado y activa el polígono elegido en A; si falta en el universo, muestra un error.

La tabla C2 presenta códigos de 24/14 dígitos agrupados, con el código íntegro en el tooltip y una columna Sec-Mz-Lt. Los valores fuente, filtros, publicación y exportaciones conservan sus códigos originales. ENCARGADO conserva prioridad; un nombre completo de validador, incluido `VAL_CATEGORIAS-AREAS_2`, no se interpreta como técnico.

### Pruebas sintéticas reproducibles

Desde la raíz del repo, ejecutar este bloque (solo usa Node; fetch simulado, sin Drive real):

```bash
node <<'JS'
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
fs.writeFileSync('/tmp/vc-index-script.js',scripts);
function fn(name){const start=scripts.search(new RegExp('(?:async )?function '+name+'\\('));assert(start>=0,name);const tail=scripts.slice(start);return tail.slice(0,tail.indexOf('\n}')+2);}
const nodes={};const $=id=>nodes[id]||(nodes[id]={value:'',innerHTML:'',selectedOptions:[{textContent:'150112001'}]});
$('pubUrl').value='https://script.google.com/macros/s/test/exec';$('drvKey').value='lectura';
let payload={poligonos:{'150112001':['15011219057','15011219057','15011220001']}};let calls=0;
const ctx=vm.createContext({$,URL,AbortSignal,Set,console,txt:v=>v==null?'':String(v),esc:v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),POLYGONS:[],POLY_ACTIVE:null,DRV_LIMIT:25*1024*1024,
applyPolygon(){ctx.POLY_ACTIVE=$('polySelect').value===''?null:ctx.POLYGONS[Number($('polySelect').value)];},
fetch:async(url,options)=>{calls++;const u=new URL(url);assert.equal(u.searchParams.get('api'),'universo');assert.equal(u.searchParams.get('k'),'lectura');assert.equal(options.method,'GET');return {ok:true,status:200,text:async()=>JSON.stringify(payload)};}});
vm.runInContext(scripts.match(/var C2_MAP = [\s\S]*?\n};/)[0],ctx);
for(const name of ['c2val','c2map'])vm.runInContext(scripts.match(new RegExp('function '+name+'\\([^\\n]+'))[0],ctx);
for(const name of ['polySet','polyFromDrive','polyDriveSelection','drvGet','c2technician','c2codeCells'])vm.runInContext(fn(name),ctx);
(async()=>{
await ctx.polyFromDrive();assert.equal(calls,1);assert.deepEqual(Array.from(ctx.POLYGONS[0].keys),['19|057','20|001']);assert.deepEqual(Array.from(ctx.POLYGONS[0].sectors),['19','20']);assert.equal(ctx.POLYGONS[0].hasCrc,false);assert.match($('polySummary').innerHTML,/2 manzanas/);
await ctx.polyDriveSelection();assert.equal(calls,1);assert.equal(ctx.POLY_ACTIVE.code,'150112001');
ctx.POLYGONS=[];await ctx.polyDriveSelection();assert.equal(calls,2);assert.equal(ctx.POLY_ACTIVE.code,'150112001');
$('drvPolygon').selectedOptions[0].textContent='ausente';await assert.rejects(ctx.polyDriveSelection(),/no está/);
for(const bad of [{},{poligonos:[]},{poligonos:{}},{poligonos:{P:['123']}},{poligonos:{P:null}}]){payload=bad;await assert.rejects(ctx.polyFromDrive());assert.equal(ctx.POLYGONS[0].code,'150112001');}
for(const [sheet,want] of [['VAL_CRC-CRISTINA','CRISTINA'],['VAL_CATEGORIAS-AREAS','SIN ASIGNAR'],['VAL_CATEGORIAS-AREAS_2','SIN ASIGNAR'],['VAL_CATEGORIAS-AREAS-PAMELA','PAMELA'],['VAL_CATEGORIAS-AREAS_2-PAMELA','PAMELA'],['VAL_CRC-VAL_USO_PISO','SIN ASIGNAR'],['VAL_CRC','SIN ASIGNAR'],['OTRA-PAMELA','SIN ASIGNAR']]){assert.equal(ctx.c2technician('',sheet),want,sheet);assert.equal(ctx.c2technician(' Ana Maria ',sheet),'ANAMARIA');}
const code='150112190570110101040026';assert.equal(ctx.c2codeCells(code),'<td title="'+code+'">150112 · 19 · 057 · 011 · 01 · 01 · 04 · 002 · 6</td><td>19-057-011</td>');
assert.equal(ctx.c2codeCells(code.slice(0,14)),'<td title="15011219057011">150112 · 19 · 057 · 011</td><td>19-057-011</td>');assert.match(ctx.c2codeCells('19057011'),/<td>19-057-011/);assert.equal(ctx.c2codeCells('<bad>'),'<td title="&lt;bad>">&lt;bad></td><td></td>');
assert.match(fn('c2render'),/c2codeCells\(r.code\)/);assert.match(html,/<th>Código<\/th><th>Sec-Mz-Lt<\/th>/);
console.log('OK: universo (fetch simulado, validación y selección), técnicos y render de códigos');
})().catch(e=>{console.error(e);process.exitCode=1;});
JS
node --check /tmp/vc-index-script.js
```

### Pasos para Rodrigo

1. Abrir `index.html`, configurar la URL de Apps Script y la clave de lectura. Pulsar **Cargar universo desde Drive** y verificar polígonos, manzanas y sectores. Seleccionar uno y comprobar el filtro.
2. Recargar la página sin cargar universo. Completar el asistente **Cargar desde Drive** con un polígono en A, sectores y dos fechas. Al completar, verificar que el universo esté cargado y que Polígono activo corresponda a A. Repetir con universo Excel ya cargado: no debe solicitarlo de nuevo.
3. Cargar manualmente el Excel de polígonos y comprobar resumen, selección y filtrado habituales. Probar clave errónea y respuesta sin universo: deben mostrar error.
4. Cargar revisor sin ENCARGADO con hojas `VAL_CRC-CRISTINA`, `VAL_CATEGORIAS-AREAS`, `VAL_CATEGORIAS-AREAS_2`, `VAL_CATEGORIAS-AREAS-PAMELA`: técnicos esperados CRISTINA, SIN ASIGNAR, SIN ASIGNAR y PAMELA. Con ENCARGADO, prevalece su valor.
5. Revisar un código de 24 dígitos y uno de 14 en C2: agrupación, tooltip íntegro y Sec-Mz-Lt. Exportar y revisar que Código conserve el valor sin separadores. Comprobar filtros y vista previa de publicación sin enviar datos.
