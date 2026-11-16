/* "Publicar pendientes" incluye como AVISO las filas ◐ cambió otro campo (APLICA sin ningún campo esperado), con etiqueta propia.
   Los ✔ verificados (esperado + extra) no se publican; el JSON no lleva valores SICUN, DNI ni la columna "Observación vs Antes → Después".
   Datos sintéticos. Uso: node tests/publicar-otro-campo.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var KEY='150112190370070101010015', OTRA='150112190370080101010001', DNI='45678912', TITULAR='PEREZ QUISPE JUAN SINTETICO';
// Eventos del cruce con valores sensibles (nombre y DNI): solo deben publicarse los nombres de campo.
var EVENTS=[{key:KEY,type:'cell',report:'TIT',field:'Nombres',before:TITULAR,after:'OTRO NOMBRE SINTETICO'},{key:KEY,type:'cell',report:'TIT',field:'Número De Documento',before:DNI,after:'40302010'},
  {key:OTRA,type:'cell',report:'UA',field:'Código De Uso',before:'010101',after:'020202'},{key:OTRA,type:'cell',report:'CON',field:'Área Verificada',before:'50',after:'60'}];
var stubs='function c2assign(r){return r;}function c2keys(){return [];}function c2resolve(row){return row.code;}function c2map(){return null;}'+
  'function BOARD_(){return [{RES:{},A:{name:"a"},B:{name:"b"}}];}function c2events(){return EVENTS;}function fileDate(f){return {day:f.name==="a"?"2026-11-10":"2026-11-14"};}';
var src=[cut('function txt(v){','function normVal'),cut('function c2bucket','\n'),cut('var PUB_LABELS','/* Prepara la publicación'),stubs].join('\n');
var T=vm.runInNewContext(src+'\n({pubPayload:pubPayload,pubPublica:pubPublica,pubResultado:pubResultado,PUB_OTRO_CAMPO:PUB_OTRO_CAMPO,c2bucket:c2bucket});',{EVENTS:EVENTS});
function row(code,state,result,extra){return Object.assign({tecnico:'TEC SINTETICO',sheet:'VAL_USO_CIIU',validator:'VAL_USO_CIIU',fi:'FI-01',code:code,piso:'01',state:state,result:result,
  observation:'titular con DNI '+DNI+' corregir uso',note:'',message:'mensaje '+DNI,change:'TIT · Nombres: '+TITULAR+' → X',changeView:'Otro campo: TIT · Número De Documento: '+DNI+' → 40302010',
  obsChange:'Observación: titular con DNI '+DNI+' ‖ Otro campo: TIT · Nombres: '+TITULAR+' → X'},extra||{});}
var rows=[
  row(KEY,'APLICA','◐ CAMBIÓ OTRO CAMPO',{note:'Sugerencia: posible OTRO CAMBIO'}),
  row(OTRA,'APLICA','✔ VERIFICADO',{note:'También cambió: CON · Área Verificada'}),   // esperado + extra
  row('150112190370090101010002','APLICA','⚠ SIN CAMBIO EN SICUN'),
  row('150112190370100101010003','NO APLICA','ℹ NO APLICA pero SICUN cambió'),
  row('150112190370110101010004','OTRO CAMBIO','✔ CAMBIÓ'),
  row('150112190370120101010005','APLICA','? NO ENCONTRADO')];
var p=T.pubPayload('260210019',rows,'clave',true), json=JSON.stringify(p), res=p.filas.map(function(f){return f.resultado;});

// 1) ◐ se publica con su etiqueta propia; ⚠ e ℹ siguen igual; los tres se distinguen entre sí
assert.strictEqual(T.PUB_OTRO_CAMPO,'◐ Cambió otro campo, no el observado');
assert.deepStrictEqual(res,['◐ Cambió otro campo, no el observado','⚠ SIN CAMBIO EN SICUN','ℹ NO APLICA pero SICUN cambió']);
assert.strictEqual(new Set(res).size,3);
var aviso=p.filas[0];
assert.strictEqual(aviso.codigo,KEY);assert.strictEqual(aviso.estado,'APLICA');assert.strictEqual(aviso.smz,'19-037-007');
assert.strictEqual(aviso.campos,'TIT · Nombres | TIT · Número De Documento','solo nombres de campo');
assert.strictEqual(aviso.obs,'titular con DNI •••• corregir uso','números de 8+ dígitos tapados');
assert.strictEqual(aviso.nota,'Sugerencia: posible OTRO CAMBIO');
assert.deepStrictEqual(Object.keys(aviso),['poligono','tecnico','hoja','validador','fi','codigo','smz','piso','estado','resultado','campos','obs','nota'],'mismas columnas publicadas que antes');

// 2) Los ✔ verificado (esperado + extra), ✔ cambió y no encontrados NO se publican
assert.strictEqual(p.filas.length,3);
assert(!p.filas.some(function(f){return /VERIFICADO|✔|NO ENCONTRADO/.test(f.resultado)||f.codigo===OTRA;}),'verificado no se publica');
[['✔ VERIFICADO',false],['✔ CAMBIÓ',false],['◐ CAMBIÓ OTRO CAMPO',true],['⚠ SIN CAMBIO EN SICUN',true],['ℹ NO APLICA pero SICUN cambió',true],['? NO ENCONTRADO',false],['ESTADO INVÁLIDO',false],['⏸ Sin comparar (x)',false]]
  .forEach(function(c){assert.strictEqual(T.pubPublica({result:c[0]}),c[1],c[0]);});
assert.strictEqual(T.pubResultado({result:'⚠ SIN CAMBIO EN SICUN'}),'⚠ SIN CAMBIO EN SICUN');

// 3) Sin valores SICUN, DNI ni nombres de titulares en el JSON; la columna "Observación vs Antes → Después" no va
[DNI,'40302010',TITULAR,'OTRO NOMBRE SINTETICO','020202','→','Observación:','obsChange','changeView','mensaje'].forEach(function(x){assert(json.indexOf(x)<0,'no debe publicarse: '+x);});
assert(!/\d{8,}/.test(json.replace(/"(codigo|poligono)":"\d+"/g,'')),'sin números de 8+ dígitos fuera de los identificadores');
var sinObs=T.pubPayload('260210019',rows,'clave',false);assert(!sinObs.filas.some(function(f){return 'obs' in f;}),'observación solo si se elige');

// 4) Los conteos no cambian: las seis categorías de siempre
assert.deepStrictEqual(JSON.parse(JSON.stringify(p.totales)),{filas:6,verificado:2,otroCampo:1,sinCambio:1,noEncontrado:1,invalido:0,noAplicaConCambio:1});
console.log('ok publicar ◐ cambió otro campo como aviso · verificado no · sin valores ni DNI');
