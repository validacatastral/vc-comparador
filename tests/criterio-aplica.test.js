/* Prueba del criterio APLICA (campos observados / relacionados). Datos sintéticos; no usa datos reales.
   Uso: node tests/criterio-aplica.test.js   (también verifica la sintaxis de los <script> de index.html) */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

// 1) Sintaxis de todos los <script> inline
var n=0;html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,function(_,code){n++;new vm.Script(code,{filename:'index.html<script '+n+'>'});});
assert(n>0,'sin scripts inline');

// 2) Extrae la tabla y las funciones puras del criterio
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','var C2_MAP'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('var CRC_PARTS','function crcHtml'),
  cut('function c2norm','\n'),cut('/* Criterio APLICA','function c2rows(){')].join('\n');
var T=vm.runInNewContext(src+'\n({CAMPOS_VALIDADOR:CAMPOS_VALIDADOR,c2eventKind:c2eventKind,c2classify:c2classify,c2reports:c2reports,c2expected:c2expected});');
var M=T.CAMPOS_VALIDADOR;

// Evalúa una fila del revisor contra eventos sintéticos, igual que c2rows.
function cruce(validator,state,events){
  var map=M[validator],hits=0,otros=0;
  events.forEach(function(e){e=Object.assign({key:'150112190370070101010015',type:'cell',before:'',after:''},e);T.c2eventKind(map,e,function(){return true;})==='otro'?otros++:hits++;});
  return T.c2classify(state,hits,otros);
}
var CIIU={report:'CON',field:'Código De Actividad Económica (CIIU)'};       // observado
var USO={report:'UA',field:'código de uso'};                                // relacionado (otra capitalización)
var DESC={report:'UA',field:'Descripcion  del Uso'};                        // relacionado (sin tilde, doble espacio)
var OTRO={report:'CON',field:'ECS'};                                        // no relacionado
var casos=[
  [1,'APLICA',[USO,DESC],'✔ VERIFICADO',undefined,false],                   // cambió observado o relacionado
  [1,'APLICA',[CIIU],'✔ VERIFICADO',undefined,false],
  [2,'APLICA',[USO,OTRO],'✔ VERIFICADO',undefined,true],                    // + nota "Además cambió"
  [3,'APLICA',[OTRO],'◐ CAMBIÓ OTRO CAMPO','posible OTRO CAMBIO',false],
  [4,'APLICA',[],'⚠ SIN CAMBIO EN SICUN',undefined,false],
  [5,'OTRO CAMBIO',[OTRO],'✔ CAMBIÓ',undefined,false],
  [6,'OTRO CAMBIO',[DESC],'✔ CAMBIÓ','debería ser APLICA',false],
  [7,'OTRO CAMBIO',[],'⚠ SIN CAMBIO EN SICUN',undefined,false],
  [8,'NO APLICA',[],'✔ NO APLICA CONFIRMADO',undefined,false],
  [9,'NO APLICA',[CIIU],'ℹ NO APLICA pero SICUN cambió','debería ser APLICA',false],
  [10,'NO APLICA',[OTRO],'ℹ NO APLICA pero SICUN cambió',undefined,false]
];
casos.forEach(function(c){var r=cruce('VAL_USO_CIIU',c[1],c[2]);
  assert.strictEqual(r.result,c[3],'caso '+c[0]);assert.strictEqual(r.suggestion,c[4],'sugerencia caso '+c[0]);assert.strictEqual(!!r.extra,c[5],'nota caso '+c[0]);
  console.log('ok caso '+c[0]+' · '+c[1]+' → '+r.result+(r.suggestion?' · Sugerencia: '+r.suggestion:'')+(r.extra?' · Además cambió':''));});

// 3) Reglas fijas de la tabla
function kind(v,e){return T.c2eventKind(M[v],Object.assign({key:'150112190370070101010015',type:'cell',before:'',after:''},e),function(){return true;});}
assert.strictEqual(kind('VAL_FECHA_PISO',{report:'CON',field:'ECS'}),'otro','ECS no es relacionado de VAL_FECHA_PISO');
assert.strictEqual(kind('VAL_FECHA_PISO',{report:'CON',field:'Fecha Construcción'}),'obs');
assert.strictEqual(kind('VAL_USO_CIIU',USO),'rel');
assert.strictEqual(kind('VAL_AREA_TERR_PISO',{report:'CON',field:'Área verificada'}),'obs','variante de mayúsculas');
assert.strictEqual(kind('VAL_RECAPITULACION_AREA',{report:'REC',field:'Recapitulación Bienes comunes – Total % Área ocupada'}),'obs','variante de guion');
assert.strictEqual(kind('VAL_USO_PISO',{report:'CON',field:'(renglón agregado)',type:'add'}),'obs');
assert.strictEqual(kind('VAL_USO_PISO',{report:'CON',field:'Área Verificada'}),'otro');
assert.strictEqual(kind('VAL_CRC',{report:'UA',field:'CRC renombrado',type:'rename',before:'150112190370070101010015',after:'150112190370070101020016'}),'obs','cambió piso del CRC');
assert.strictEqual(kind('VAL_CRC',{report:'UA',field:'Código De Uso'}),'otro');
assert.deepStrictEqual(Array.from(T.c2reports(M.VAL_USO_CIIU)),['CON','UA']);
console.log('ok reglas fijas · sintaxis de '+n+' <script> inline');
