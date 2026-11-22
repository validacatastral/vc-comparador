# Equivalencia de reglas del cruce C2

Auditoría inicial sobre main (6ba3208). La columna de cobertura describe el comparador antes del portado. Referencias de Rodrigo (©diegocampos) en `validadores_ref/`.

## VAL_TITULAR_INSCRIPCION

| Validador | Regla | Qué revisa | ¿Está en el comparador? | Diferencia inicial |
|---|---|---|---|---|
| VAL_TITULAR_INSCRIPCION | R1 | Forma de adquisición sin documento sustentatorio | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R2 | Se declara inscripción con bloque registral incompleto | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R2P | POSEEDOR con escritura pública | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R3A | Código de Predio con formato inválido | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R3B | Partida Electrónica con formato inválido | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R3C | Ficha con formato inválido | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R3F | Ficha de 8 dígitos: posible Partida Electrónica | No | Sin evaluación de esta regla. |
| VAL_TITULAR_INSCRIPCION | R4 | Sucesión intestada con forma distinta de OTROS | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R5 | Forma POSESIÓN sin condición POSEEDOR | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R5C | Constancia de posesión fuera de contexto de posesión | Sí | Mismo criterio. |
| VAL_TITULAR_INSCRIPCION | R13 | Forma de adquisición vacía. | Sí | regla vigente no presente en el HTML de referencia |
| VAL_TITULAR_INSCRIPCION | R4H | Sucesión intestada con documento de herederos. | Sí | regla vigente no presente en el HTML de referencia |
| VAL_TITULAR_INSCRIPCION | R6O | Condición OTROS y forma OTROS con documento, tipo o número de partida. | Sí | regla vigente no presente en el HTML de referencia |
| VAL_TITULAR_INSCRIPCION | E1 | CRC con longitud distinta de 24 dígitos | No | no se publica: CRC ilegible = problema de lectura del Excel |

## VAL_USO_CIIU

| Validador | Regla | Qué revisa | ¿Está en el comparador? | Diferencia inicial |
|---|---|---|---|---|
| VAL_USO_CIIU | R1 | Sin Código de Uso | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R2 | Código de Uso fuera del glosario | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R3A | El uso exige CIIU y ninguna línea de la unidad lo tiene | Parcial | Se decide por presencia, piso o exención general sin validar la línea contra el catálogo. |
| VAL_USO_CIIU | R3B | Línea sin CIIU; otras líneas de la unidad sí lo tienen | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R3C | Línea sin CIIU en obra no terminada (ECC) | Parcial | Se decide por presencia, piso o exención general sin validar la línea contra el catálogo. |
| VAL_USO_CIIU | R3D | Línea con CIIU en obra no terminada (ECC) | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R4A | CIIU no corresponde al uso (unidad de una línea) | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R4B | CIIU no corresponde al uso (unidad de varias líneas) | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R5 | CRC no encontrado en Unidades | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R6 | CRC con usos distintos en Unidades | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R7 | Comercial no identificado (local desocupado) | Parcial | Se decide por presencia, piso o exención general sin validar la línea contra el catálogo. |
| VAL_USO_CIIU | R8A | Uso comercial no especificado: ninguna línea con CIIU | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R8B | Uso comercial no especificado con CIIU — revisar | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R8C | Uso comercial no especificado: línea sin CIIU, otras sí | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R9 | Comercial no identificado con CIIU — revisar | No | Sin evaluación de esta regla. |
| VAL_USO_CIIU | R10 | CIIU inexistente en la Rev. 4 | No | Sin evaluación de esta regla. |

## VAL_COND_PREDIO_EN

| Validador | Regla | Qué revisa | ¿Está en el comparador? | Diferencia inicial |
|---|---|---|---|---|
| VAL_COND_PREDIO_EN | R1 | Predio en edificio en un solo campo | Sí | Mismo criterio. |
| VAL_COND_PREDIO_EN | R2 | Terreno / parque distinto de predio independiente | Sí | Mismo criterio. |
| VAL_COND_PREDIO_EN | R3 | Clasificación o predio catastral en vacíos | Sí | Mismo criterio. |
| VAL_COND_PREDIO_EN | R4 | Predio catastral en OTROS o fuera de la tabla | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R5 | Predio comercial con clasificación no comercial | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R6 | Predio en edificio con una sola unidad en el lote | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R7 | Predio independiente en edificación de más de 10 unidades | No | excluida por decisión de Diego |
| VAL_COND_PREDIO_EN | R8 | Clasificación OTROS con uso de clasificación propia | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R9 | Clasificación sin construcción con tipo de edificación | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R10 | Tipo de edificación vacío | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R10C | Cementerio sin tipo de edificación | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R11 | Predio en edificio sin tipo EDIFICIO o BLOCK | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R12 | Casa habitación en EDIFICIO o BLOCK | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R13 | Tipo de edificación PABELLÓN | No | Sin evaluación de esta regla. |
| VAL_COND_PREDIO_EN | R14 | Terreno / parque con uso distinto al suyo | No | excluida por decisión de Diego |

## VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO)

| Validador | Regla | Qué revisa | ¿Está en el comparador? | Diferencia inicial |
|---|---|---|---|---|
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R1 | Producto total = 1 en m², m³ o ml | Parcial | El lector anterior aceptaba un prefijo numérico seguido de texto. |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R2 | Unidad de medida distinta al Anexo III.1 | Parcial | La comparación no reconocía pza como equivalente a und para códigos con unidad oficial pza. |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R3 | Capacidad que no corresponde al código | No | Sin evaluación de esta regla. |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R4 | Obra repetida idéntica en el predio | No | Sin evaluación de esta regla. |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R5 | MEP que no corresponde al material | Sí | Mismo catálogo y normalización de MEP. |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R6 | ECC distinto de terminado en tanque de plástico | No | Sin evaluación de esta regla. |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R7 | Tanque elevado anterior al último piso | No | excluida por decisión de Diego |
| VAL_OBRAS_COMPLEN (VAL_PRODUCTO y VAL_MEP_MEDIDA_PRODUCTO) | R7P | Parapeto anterior al piso 1 | No | Sin evaluación de esta regla. |

## VAL_CRC

| Validador | Regla | Qué revisa | ¿Está en el comparador? | Diferencia inicial |
|---|---|---|---|---|
| VAL_CRC | R1 | Entrada inicia en 01 | Parcial | Agrupación, atribución de saltos o cruce con construcciones incompletos. |
| VAL_CRC | R2 | Entradas correlativas | Parcial | Agrupación, atribución de saltos o cruce con construcciones incompletos. |
| VAL_CRC | R3 | Piso = 01 (edificación de una fila) | Parcial | Agrupación, atribución de saltos o cruce con construcciones incompletos. |
| VAL_CRC | R4 | Unidad inicia en 001 | Parcial | Agrupación, atribución de saltos o cruce con construcciones incompletos. |
| VAL_CRC | R5 | Unidades correlativas | Parcial | Agrupación, atribución de saltos o cruce con construcciones incompletos. |
| VAL_CRC | R6 | Sótano inicia en 81 | Parcial | Agrupación, atribución de saltos o cruce con construcciones incompletos. |
| VAL_CRC | R6A | Sótano 81 vs construcción desde piso 01 | No | Sin evaluación de esta regla. |
| VAL_CRC | R6B | Piso inferior con construcción principal | No | Sin evaluación de esta regla. |
| VAL_CRC | R6C | Sin líneas constructivas en el piso del CRC | No | Sin evaluación de esta regla. |
| VAL_CRC | LON | CRC con longitud distinta de 24 | No | no se publica: CRC ilegible = problema de lectura del Excel |

## VAL_FECHA_PISO

Fuente de esta tanda: `validadores_ref/VAL_FECHA_PISO.html` (©diegocampos). El HTML usa únicamente Construcciones. No contiene una regla de tanque elevado ni un cruce con Obras Complementarias. La exclusión de R7 de obras sigue vigente.

| Regla | Qué revisa | Severidad | Reportes que usa | Catálogos | Estado en C2 |
|---|---|---|---|---|---|
| R1 | El año de la línea es anterior al de la referencia acumulada de los niveles inferiores. | ERROR | Construcciones | Niveles y fechas | portada |
| R1M | La fecha es anterior a la referencia inferior dentro del mismo año. | ADVERTENCIA | Construcciones | Niveles y fechas | excluida por decisión de Diego (solo se compara el año) |
| R1Z | El año de la línea es anterior al nacimiento de un mezanine inferior pendiente de aviso. | ADVERTENCIA | Construcciones | Mezanines 71–79 | excluida por decisión de Diego (solo se compara el año) |
| R2 | La fecha supera el día actual del navegador. | ERROR | Construcciones | Fechas | excluida por decisión de Diego (solo se compara el año) |
| R3 | La fecha supera la fecha de descarga extraída de Nombre Backup. | ADVERTENCIA | Construcciones | Primer bloque de ocho dígitos AAAAMMDD | excluida por decisión de Diego (solo se compara el año) |
| R4 | La fecha de una línea con nivel reconocido está vacía o no se puede interpretar. | ADVERTENCIA | Construcciones | Fechas | excluida por decisión de Diego (solo se compara el año) |
| R5 | Salto mayor que uno entre dos niveles consecutivos de tipo piso con fecha válida. | ADVERTENCIA | Construcciones | Niveles | excluida por decisión de Diego (solo se compara el año) |
| R6 | El valor de N° Piso no se puede convertir a un nivel. | ADVERTENCIA | Construcciones | Niveles | excluida por decisión de Diego (solo se compara el año) |

**Catálogo de niveles.** 81–89 representan sótanos −1 a −9. 71–79 representan mezanines 1,5 a 9,5. Para los demás valores, el motor acepta cualquier entero escrito con dígitos y signo menos opcional como piso, incluidos 0, 70, 80 y 90. No limita ese último caso a 1–70.

**Fechas.** Se admite AAAA-MM-DD o DD-MM-AAAA, también con barras y con mes o día de un dígito. Las expresiones aceptan texto posterior a la fecha. Un serial Excel mayor que 20000 y menor que 80000 se trunca al día entero con base 1899-12-30. Para las fechas de construcción se admiten años 1800–2200, meses 1–12 y días 1–31. JavaScript puede normalizar combinaciones como 31 de abril. Nombre Backup usa el primer bloque AAAAMMDD y el constructor de fecha del original.

**Universo y exenciones.** Se agrupa por los 16 primeros dígitos del CRC. Cada nivel nace en la fecha más antigua de sus líneas. Pisos y sótanos sostienen a los superiores con el nacimiento más tardío acumulado. Un mezanine se compara con el nivel inferior que lo sostiene y no aporta referencia para los niveles superiores. Las líneas sin fecha legible o sin nivel reconocido quedan fuera de la secuencia. Entrada 99, piso 99 o unidad 999 del CRC eximen de las ocho reglas y tampoco sirven de referencia para otras líneas. Área Verificada solo se muestra. La longitud del CRC es un aviso de carga del original.

**Selección en C2.** El contexto abarca la edificación completa del DESPUÉS. Se devuelven las observaciones del piso solicitado dentro del CRC de la fila, o de ese piso en el lote si el identificador es de lote. Toda fila de VAL_FECHA_PISO se evalúa con R1, aunque el mensaje hable de mes, día, año o nivel anterior, o cite un código antiguo. Solo se observa una línea si su año es anterior al año de referencia. Dentro del mismo año, cualquier mes o día cumple R1. Se conserva la condición general de mensaje presente para evaluar «Cambió pero sigue mal». Una columna obligatoria ausente impide evaluar esa línea. La salida de publicación usa códigos fijos. Si varias líneas del piso tienen fechas distintas, C2 recoge todas las infracciones y evita atribuir a la fila del revisor la fecha inicial de una línea elegida arbitrariamente.

**Límite de entrada.** El original lee el texto que Excel muestra. C2 recibe el valor ya cargado por el comparador. Una celda de fecha con un formato personalizado que oculte parte del día, mes o año puede llegar como fecha completa a C2 y como texto ilegible al original. La prueba de equivalencia contrasta R1 con las mismas filas de entrada en ambos motores.


## Sin referencia

| Validador | Estado | Pendiente |
|---|---|---|
| VAL_CATEGORIAS-AREAS (incluidas variantes) | sin referencia | Obtener el HTML original para auditar reglas y catálogos. |
| VAL_PISO_CATEGORIA_TECHO | sin referencia | Obtener el HTML original para auditar reglas y catálogos. |
| VAL_TITULARES-DNI / VAL_TITULARES (incluidas variantes) | sin referencia | Obtener el HTML original para auditar reglas y catálogos. |
| VAL_RECAPITULACION_AREA | sin referencia | Obtener el HTML original para auditar reglas y catálogos. |
| VAL_AREA_TERR_PISO | sin referencia | Obtener el HTML original para auditar reglas y catálogos. |
| VAL_USO_PISO | sin referencia | Obtener el HTML original para auditar reglas y catálogos. |

## Catálogo uso → clases CIIU admitidas

| Uso | Clases |
|---|---|
| 010101 | Sin lista |
| 010102 | Sin lista |
| 010103 | Sin lista |
| 010201 | Sin lista |
| 020101 | 4711 |
| 020102 | 4781, 4782, 4789, 6810, 6820, 4721, 4722, 4723, 4741, 4742, 4751, 4752, 4753, 4759, 4761, 4762, 4763, 4764, 4771, 4772, 4773, 4774, 5610, 5629, 5630, 9601, 9602, 9609, 9511, 9512, 9523, 9529, 8219, 7420, 8690, 8211, 6910 |
| 020103 | 5210 |
| 020104 | 4730 |
| 020105 | 4719, 4721, 4722, 4723, 4730, 4741, 4742, 4751, 4752, 4753, 4759, 4761, 4762, 4763, 4764, 4771, 4772, 4773, 4774, 4530 |
| 020106 | 4781, 4782, 4789, 4721, 4722, 4723, 4741, 4742, 4751, 4752, 4753, 4759, 4761, 4762, 4763, 4764, 4771, 4772, 4773, 4774, 5610, 5629, 5630, 9601, 9602, 9609, 9511, 9512, 9523, 9529, 8219, 7420, 8690, 8211, 6910 |
| 020199 | Sin lista |
| 020201 | 9601, 9602, 9603, 9609, 6910, 7911, 9523, 8219, 6190, 8220, 9511, 9529, 4520, 7420, 7912, 7990, 7729, 7810, 7820, 8211, 8291, 8299, 7310, 7410, 1811, 9512, 8020, 8230, 7721, 7722 |
| 020202 | 4520, 4540, 9511, 9512, 9521, 9522, 9523, 9524, 9529, 3311, 3312, 3313, 3314, 3315, 3319, 3320 |
| 020203 | 5610, 5629, 5630, 5621 |
| 020204 | 5510, 5590, 5520 |
| 020205 | 7500 |
| 020301 | 6910, 6920, 7020, 7010, 6201, 6202, 6209, 6311, 6312, 6391, 5811, 5812, 5819, 5820, 6820, 7110, 7310, 7320, 7410, 7490, 7740, 7830, 8010, 8030, 8211, 8291, 5229 |
| 020302 | Sin lista |
| 020303 | 6810, 6820 |
| 020304 | Sin lista |
| 030101 | 1010, 1020, 1030, 1040, 1050, 1061, 1062, 1071, 1072, 1073, 1074, 1075, 1079, 1080 |
| 030102 | 1101, 1102, 1103, 1104 |
| 030103 | 1200 |
| 030104 | 1311, 1312, 1313, 1391, 1392, 1393, 1394, 1399 |
| 030105 | 1410, 1420, 1430 |
| 030106 | 1511, 1512, 1520 |
| 030107 | 1610, 1621, 1622, 1623, 1629 |
| 030108 | 1701, 1702, 1709 |
| 030109 | 1811, 1812, 1820 |
| 030110 | 1910, 1920 |
| 030111 | 2011, 2012, 2013, 2021, 2022, 2023, 2029, 2030 |
| 030112 | 2100 |
| 030113 | 2211, 2219, 2220 |
| 030114 | 2310, 2391, 2392, 2393, 2394, 2395, 2396, 2399 |
| 030115 | 2410, 2420, 2431, 2432 |
| 030116 | 2511, 2512, 2513, 2520, 2591, 2592, 2593, 2599 |
| 030117 | 2610, 2620, 2630, 2640, 2651, 2652, 2660, 2670, 2680 |
| 030118 | 2710, 2720, 2731, 2732, 2733, 2740, 2750, 2790 |
| 030119 | 2811, 2812, 2813, 2814, 2815, 2816, 2817, 2818, 2819, 2821, 2822, 2823, 2824, 2825, 2826, 2829 |
| 030120 | 2910, 2920, 2930 |
| 030121 | 3011, 3012, 3020, 3040, 3091, 3092, 3099, 3030 |
| 030122 | 3100 |
| 030199 | 3211, 3212, 3220, 3230, 3240, 3250, 3290 |
| 040101 | Sin lista |
| 040102 | 9311 |
| 040103 | 9312 |
| 040104 | 9311 |
| 040105 | 8541 |
| 040199 | 9329, 9311, 9319 |
| 040201 | 9102 |
| 040202 | 9000 |
| 040203 | 9000 |
| 040204 | 9101 |
| 040205 | 9000 |
| 040206 | 9103 |
| 040299 | 9000, 8542 |
| 040301 | 9499 |
| 040302 | 5914 |
| 040303 | 9200, 9321 |
| 040304 | 9329 |
| 040305 | 9329, 5630 |
| 040306 | 9329 |
| 040307 | 9329 |
| 040399 | 9329 |
| 050101 | 8510, 8521 |
| 050102 | 8549 |
| 050103 | 8530 |
| 050104 | 8530, 8522 |
| 050105 | 8510 |
| 050199 | 8549, 8550 |
| 050201 | 8610 |
| 050202 | 8620 |
| 050203 | 9603 |
| 050204 | 9603 |
| 050299 | 8690 |
| 050301 | 4921, 4922, 4923, 5221 |
| 050302 | 4911, 4912 |
| 050303 | 5011, 5012, 5222, 5021, 5022 |
| 050304 | 5110, 5120, 5223 |
| 050305 | 5221 |
| 050401 | 5310, 5320 |
| 050402 | 6010, 6020 |
| 050403 | 5813 |
| 050404 | 6110, 6120, 6130 |
| 050499 | 6399, 6190 |
| 050501 | 3510 |
| 050502 | 3600, 3700 |
| 050503 | 3520, 4930 |
| 050504 | 3510, 6190 |
| 060101 | 8411, 8421 |
| 060199 | 8412, 8413, 8430 |
| 060201 | 8422 |
| 060202 | 8423 |
| 060203 | 8423 |
| 060204 | 8423 |
| 060301 | 6411, 6419, 6420, 6430, 6491, 6492, 6499, 6511, 6512, 6520, 6530, 6611, 6612, 6619, 6621, 6622, 6629, 6630 |
| 060302 | 6530, 6511, 6512, 6520, 6622 |
| 060303 | 6612 |
| 060399 | 6499 |
| 060401 | 9900 |
| 060501 | 7010 |
| 060601 | 9491 |
| 060602 | 9491 |
| 060603 | 9491 |
| 060604 | 9491 |
| 060699 | 9491 |
| 060701 | 8730, 8710, 8720, 8790 |
| 060799 | 8890, 8810 |
| 060801 | 9420 |
| 060802 | 9492 |
| 060803 | 9412, 9411 |
| 060899 | 9499 |
| 060901 | 9499, 7210, 7220 |
| 070101 | Sin lista |
| 070201 | Sin lista |

## Catálogos y exenciones

| Criterio | Valores |
|---|---|
| USO_CLASIF | {"010101": "CASA HABITACIÓN", "010102": "CASA HABITACIÓN o PREDIO EN EDIFICIO", "010103": "CASA HABITACIÓN o PREDIO EN EDIFICIO", "020101": "TIENDA-DEPÓSITO-ALMACÉN o MERCADO", "020102": "MERCADO", "020103": "TIENDA-DEPÓSITO-ALMACÉN", "020105": "TIENDA-DEPÓSITO-ALMACÉN", "020106": "MERCADO o TIENDA-DEPÓSITO-ALMACÉN", "020202": "TALLER", "020203": "SERVICIO DE COMIDA", "040101": "PARQUE", "040103": "CLUB DE ESPARCIMIENTO", "040301": "CLUB SOCIAL", "050203": "CEMENTERIO", "050301": "TERMINAL DE TRANSPORTE", "050302": "TERMINAL DE TRANSPORTE", "050303": "TERMINAL DE TRANSPORTE", "050304": "TERMINAL DE TRANSPORTE", "050305": "PLAYA DE ESTACIONAMIENTO", "050504": "SUB ESTACIÓN", "060301": "BANCO FINANCIERA", "060601": "IGLESIA / TEMPLO", "060603": "IGLESIA / TEMPLO", "070101": "TERRENO SIN CONSTRUIR"} |
| P_TABLA | ["GALERIA", "MERCADO", "CAMPOFERIAL", "CENTROCOMERCIAL", "QUINTA", "CALLEJON", "PREDIOINDEPENDIENTE", "SOLAR", "CORRALON", "AZOTEA", "AIRES", "PREDIOENEDIFICIO", "OTROS"] |
| P_COMERCIAL | ["GALERIA", "MERCADO", "CAMPOFERIAL", "CENTROCOMERCIAL"] |
| C_COMERCIAL | ["TIENDADEPOSITOALMACEN", "SERVICIODECOMIDA", "BANCOFINANCIERA", "MERCADO", "OTROS"] |
| SIN_CONS | ["TERRENOSINCONSTRUIR", "PARQUE", "PLAYADEESTACIONAMIENTO", "SUBESTACION"] |
| USO_PROPIO | {"TERRENOSINCONSTRUIR": "070101", "PARQUE": "040101"} |
| CIIU opcional | ["060601", "060602", "060603", "060604", "060699"] |
| CIIU Rev. 3 | {"9500": "Hogares privados con servicio doméstico (Rev. 3). En la Rev. 4 la reparación se clasifica en 9511, 9512, 9521, 9522, 9523, 9524 o 9529."} |
| Clases válidas Rev. 4 | ["0111", "0112", "0113", "0114", "0115", "0116", "0119", "0121", "0122", "0123", "0124", "0125", "0126", "0127", "0128", "0129", "0130", "0141", "0142", "0143", "0144", "0145", "0146", "0149", "0150", "0161", "0162", "0163", "0164", "0170", "0210", "0220", "0230", "0240", "0311", "0312", "0321", "0322", "0510", "0520", "0610", "0620", "0710", "0721", "0729", "0810", "0891", "0892", "0893", "0899", "0910", "0990", "1010", "1020", "1030", "1040", "1050", "1061", "1062", "1071", "1072", "1073", "1074", "1075", "1079", "1080", "1101", "1102", "1103", "1104", "1200", "1311", "1312", "1313", "1391", "1392", "1393", "1394", "1399", "1410", "1420", "1430", "1511", "1512", "1520", "1610", "1621", "1622", "1623", "1629", "1701", "1702", "1709", "1811", "1812", "1820", "1910", "1920", "2011", "2012", "2013", "2021", "2022", "2023", "2029", "2030", "2100", "2211", "2219", "2220", "2310", "2391", "2392", "2393", "2394", "2395", "2396", "2399", "2410", "2420", "2431", "2432", "2511", "2512", "2513", "2520", "2591", "2592", "2593", "2599", "2610", "2620", "2630", "2640", "2651", "2652", "2660", "2670", "2680", "2710", "2720", "2731", "2732", "2733", "2740", "2750", "2790", "2811", "2812", "2813", "2814", "2815", "2816", "2817", "2818", "2819", "2821", "2822", "2823", "2824", "2825", "2826", "2829", "2910", "2920", "2930", "3011", "3012", "3020", "3030", "3040", "3091", "3092", "3099", "3100", "3211", "3212", "3220", "3230", "3240", "3250", "3290", "3311", "3312", "3313", "3314", "3315", "3319", "3320", "3510", "3520", "3530", "3600", "3700", "3811", "3812", "3821", "3822", "3830", "3900", "4100", "4210", "4220", "4290", "4311", "4312", "4321", "4322", "4329", "4330", "4390", "4510", "4520", "4530", "4540", "4610", "4620", "4630", "4641", "4649", "4651", "4652", "4653", "4659", "4661", "4662", "4663", "4669", "4690", "4711", "4719", "4721", "4722", "4723", "4730", "4741", "4742", "4751", "4752", "4753", "4759", "4761", "4762", "4763", "4764", "4771", "4772", "4773", "4774", "4781", "4782", "4789", "4791", "4799", "4911", "4912", "4921", "4922", "4923", "4930", "5011", "5012", "5021", "5022", "5110", "5120", "5210", "5221", "5222", "5223", "5224", "5229", "5310", "5320", "5510", "5520", "5590", "5610", "5621", "5629", "5630", "5811", "5812", "5813", "5819", "5820", "5911", "5912", "5913", "5914", "5920", "6010", "6020", "6110", "6120", "6130", "6190", "6201", "6202", "6209", "6311", "6312", "6391", "6399", "6411", "6419", "6420", "6430", "6491", "6492", "6499", "6511", "6512", "6520", "6530", "6611", "6612", "6619", "6621", "6622", "6629", "6630", "6810", "6820", "6910", "6920", "7010", "7020", "7110", "7120", "7210", "7220", "7310", "7320", "7410", "7420", "7490", "7500", "7710", "7721", "7722", "7729", "7730", "7740", "7810", "7820", "7830", "7911", "7912", "7990", "8010", "8020", "8030", "8110", "8121", "8129", "8130", "8211", "8219", "8220", "8230", "8291", "8292", "8299", "8411", "8412", "8413", "8421", "8422", "8423", "8430", "8510", "8521", "8522", "8530", "8541", "8542", "8549", "8550", "8610", "8620", "8690", "8710", "8720", "8730", "8790", "8810", "8890", "9000", "9101", "9102", "9103", "9200", "9311", "9312", "9319", "9321", "9329", "9411", "9412", "9420", "9491", "9492", "9499", "9511", "9512", "9521", "9522", "9523", "9524", "9529", "9601", "9602", "9603", "9609", "9700", "9810", "9820", "9900"] |
| Excepciones R1 obras | [1, 21, 28, 33, 35, 36, 56, 78, 54, 55, 64, 65, 66] |
| Repetición R4 obras | [1, 2, 3, 4, 5, 6, 7, 8, 9, 88, 89, 90, 50, 51, 52, 53, 81, 82, 83, 84, 58, 59, 60, 61, 62, 63, 33, 34, 35, 36, 95] |
| Capacidad (mínimo excluido, máximo incluido; null = sin límite superior) | [[{"c": 21, "min": 0, "max": 1}, {"c": 18, "min": 1, "max": null}], [{"c": 28, "min": 0, "max": 1}, {"c": 22, "min": 1, "max": null}], [{"c": 17, "min": 0, "max": 5}, {"c": 19, "min": 5, "max": null}, {"c": 20, "min": 15, "max": null}], [{"c": 23, "min": 0, "max": 5}, {"c": 24, "min": 5, "max": 10}, {"c": 25, "min": 10, "max": 20}, {"c": 27, "min": 20, "max": null}], [{"c": 26, "min": 0, "max": 5}], [{"c": 29, "min": 0, "max": 5}, {"c": 30, "min": 5, "max": 10}, {"c": 31, "min": 10, "max": null}]] |

## Obras por código

| Código | Unidad | MEP |
|---|---|---|
| 1 | m² | 01 |
| 2 | m² | 01, 03 |
| 3 | m² | 02 |
| 4 | m² | 02 |
| 5 | m² | 02 |
| 6 | m² | 03 |
| 7 | m² | 02 |
| 8 | m² | 03 |
| 9 | m² | 02 |
| 10 | m² | 03 |
| 11 | m² | 03 |
| 12 | m² | 03 |
| 13 | m² | 03 |
| 14 | m² | 03 |
| 15 | m² | 03 |
| 16 | m² | 03 |
| 17 | m³ | 01 |
| 18 | m³ | 03 |
| 19 | m³ | 01 |
| 20 | m³ | 01 |
| 21 | m³ | 03 |
| 22 | m³ | 03 |
| 23 | m³ | 01 |
| 24 | m³ | 01 |
| 25 | m³ | 01 |
| 26 | m³ | 02 |
| 27 | m³ | 01 |
| 28 | m³ | 03 |
| 29 | m³ | 01 |
| 30 | m³ | 01 |
| 31 | m³ | 01 |
| 32 | m³ | 02 |
| 33 | m² | 01 |
| 34 | m² | 01 |
| 35 | m² | 01 |
| 36 | m² | 01 |
| 37 | m³ | 01 |
| 38 | m³ | 02 |
| 39 | m³ | 03 |
| 40 | und | 01 |
| 41 | und | 01 |
| 42 | m³ | 01 |
| 43 | m³ | 01 |
| 44 | und | 01, 03 |
| 45 | m³ | 01 |
| 46 | und | 01 |
| 47 | und | 01 |
| 48 | und | 01 |
| 49 | und | 01 |
| 50 | m² | 02 |
| 51 | m² | 02 |
| 52 | m² | 02 |
| 53 | m² | 02 |
| 54 | m³ | 01 |
| 55 | m³ | 01 |
| 56 | m³ | 01 |
| 57 | m³ | 01 |
| 58 | m³ | 01 |
| 59 | m³ | 01 |
| 60 | m³ | 01 |
| 61 | m³ | 01 |
| 62 | m³ | 01 |
| 63 | m³ | 01 |
| 64 | und | 03 |
| 65 | und | 03 |
| 66 | und | 03 |
| 67 | und | 03 |
| 68 | und | 03 |
| 69 | und | 03 |
| 70 | ml | 01 |
| 71 | ml | 01 |
| 72 | ml | 01 |
| 73 | ml | 01 |
| 74 | pza | 01 |
| 75 | pza | 01 |
| 76 | pza | 01 |
| 77 | pza | 01 |
| 78 | pza | 01 |
| 79 | pza | 01 |
| 80 | pza | 01 |
| 81 | m² | 03 |
| 82 | m² | 02 |
| 83 | m² | 02 |
| 84 | m² | 03 |
| 85 | ml | 03 |
| 86 | ml | 03 |
| 87 | ml | 03 |
| 88 | m² | 03 |
| 89 | m² | 03 |
| 90 | m² | 03 |
| 91 | pza | 03 |
| 92 | pza | 03 |
| 93 | ml | 01 |
| 94 | ml | 01 |
| 95 | m² | 01 |
| 96 | m³ | 01 |

## Resultado del portado


Hay 55 reglas activas del adjunto y tres reglas vigentes de titularidad recuperadas de main. Se prueban con y sin cambios. Para terreno sin construir y parque se evalúa únicamente R2. Un valor de predio catastral en vacío también incumple R2. Los demás tipos de predio conservan sus controles de clasificación y tipo de edificación.

Cuando Excel trunca el CRC, se intenta reconstruirlo con las columnas catastrales. Una coincidencia única del código parcial permite cruzar la unidad normalmente. Si la unidad sigue sin identificarse, la fila se publica en Pendientes de atención como «? NO ENCONTRADO». La nota de CRUCE_REVISOR dice «CRC ilegible en el Excel (no tiene 24 dígitos) — revisar el archivo». Los identificadores de lote de ocho dígitos siguen su cruce habitual.

Un código de regla explícito en el mensaje selecciona esa observación. Para el mensaje general de incoherencia entre clasificación y predio se mantienen R1–R3. Las demás observaciones del mismo registro pueden aparecer en «Ojo, además». VAL_PRODUCTO considera R1 y R3 (metrado y capacidad). El mensaje específico de MEP considera R5. Las dos hojas usan el mismo catálogo de obras.

Cuando falta una columna, C2 conserva la distinción entre dato ausente y celda vacía. Para R4 de obras, el comparador requiere las columnas que componen la firma del duplicado. El HTML puede agrupar filas aun cuando falte una columna opcional de esa firma. C2 conserva el código de regla en el resultado y omite los valores de la ficha que el HTML muestra en la explicación.


## Cambios de expectativas en pruebas existentes


| Caso | Resultado vigente |
|---|---|
| Uso 020105 con 4711 | 4711 da R4A. Los controles de caso conforme ahora usan 4719. El nuevo caso colegio con 4711 exige R4A. |
| Uso 020304 sin columna CIIU | Sin línea evaluable, el uso por sí solo no confirma R7 ni permite sugerir NO APLICA. |
| Forma de adquisición vacía | Se restaura R13 para unidades, con las exenciones de main. |
| OTROS + OTROS + escritura sin partida | Se restaura R6O para el mensaje de tipo de documento. R2 puede aparecer como observación adicional. |
| Sucesión intestada con declaratoria de herederos | Se restaura R4H para el mensaje de tipo de documento. |
| Parque o terreno con uso distinto o con tipo de edificación | Con PREDIO INDEPENDIENTE cumple. Con otro valor o vacío solo corresponde R2. La prueba de R9 usa SUB ESTACIÓN. |
| Predio independiente con once unidades | El conteo dejó de generar R7. |
| Tanque elevado anterior al último piso | La fecha corresponde al validador de fechas. En obras permanece la prueba R7P para parapetos. |
| CRC truncado, en notación científica o con ceros perdidos | El aviso de lectura sustituye las expectativas E1 y LON. Si la reconstrucción falla, la fila cuenta como pendiente publicado. La nota de lectura queda en CRUCE_REVISOR. |
| Obra 50 con producto 1 o MEP incorrecto | La nota contiene R1 o R5 y omite el código de obra de la ficha. |
| Interior corregido y DV renombrado en piso 02 | La construcción de la unidad nueva está solo en piso 01. R6C deja la fila pendiente de publicación. |


## Criterios del original

Titularidad exime PARQUE de las reglas R. El nivel 99-99-999 conserva las comprobaciones registrales. R13, R4H y R6O del comparador no existen en este adjunto. Las unidades repetidas son un informe aparte.
En USO_CIIU, R3C y R7 son FALSO ERROR. Una línea con CIIU en local desocupado sí puede incumplir R9. Las líneas de otros pisos aportan contexto a R3B y R8C. En uso común se siguen comprobando la existencia del código y el cruce cuando proceda.
En obras, UCA exime R1, R7 y R7P. Tanques plásticos: 18, 21, 22, 28. Tanques elevados: 18 y 21. Parapetos: 50–53. En condición, PE con AIRES está permitido por R1. Los prefijos 030 y 0501 sugieren INDUSTRIA y CENTRO DE ENSEÑANZA.
CRC deduplica el código completo. Las secuencias de entrada y unidad excluyen 99/999 por campo. El cruce por 23 dígitos suma área verificada por piso y usa un umbral de 50 % para construcción principal.
