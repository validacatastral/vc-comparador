/* VAL_CRC con CRC renombrado (código vs solo DV; el DV es neutro) y NO APLICA con solo campos no esperados.
   Corre c2rows real con stubs mínimos (sin DOM). Datos sintéticos. Uso: node tests/renombre-y-noaplica.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
var n=0;html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,function(_,code){n++;new vm.Script(code,{filename:'index.html<script '+n+'>'});});
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('function toNum','function eqVal'),cut('function normKey','\n'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2rows(){'),cut('function c2rows(){','function c2summary'),cut('var PUB_LABELS','/* Prepara la publicación')].join('\n');
var stubs='var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}'+
  'function $(id){return {checked:true,value:""};}var HUELLAS=null;function matchBlock(){return {pairs:[],soloA:[],soloB:[]};}function eqVal(a,b){return a===b;}';
// c2huellas real se reemplaza (va después de src): huella sintética o vacía.
var T=vm.runInNewContext(stubs+src+'\nvar c2huellasReal=c2huellas;c2huellas=function(b){return HUELLAS||c2huellasReal(b);};\n({set:function(b,f,h){BOARD=b;FILES=f;HUELLAS=h||null;},c2rows:c2rows,c2bucket:c2bucket,pubPublica:pubPublica,c2eventKind:c2eventKind,M:CAMPOS_VALIDADOR});');

var KEY='Código de Referencia Catastral', PISO='N° Piso';
function ctx(id,rowsA,rowsB,res){return {preset:{id:id,key:KEY},A:{headers:[KEY,PISO],rows:rowsA},B:{headers:[KEY,PISO],rows:rowsB},
  RES:Object.assign({mods:[],nuevos:[],eliminados:[],renombrados:[],diffCols:[]},res)};}
function fila(validator,code,state,extra){return Object.assign({tecnico:'TEC SINTETICO',polygon:'',sheet:validator,validator:validator,rawCode:code,partial:'',numeric:false,piso:'',state:state,observation:'',message:'',noState:false},extra||{});}
function run(board,rows,h){T.set(board,[{rows:rows}],h);return T.c2rows();}
// Renombre: un evento por reporte (UA, TIT, CON), como en el caso real.
function renombre(de,a){var r={};r[KEY]=a;return ['UA','TIT','CON'].map(function(id){return ctx(id,[{[KEY]:de}],[{[KEY]:a}],{renombrados:[{de:de,a:a,row:r}]});});}

// 1) Cambió el código (primeros 23 dígitos) → CRC renombrado es esperado → ✔ VERIFICADO
var A1='150112190370070101010015', B1='150112190370070101020016';
var r1=run(renombre(A1,B1),[fila('VAL_CRC',A1,'APLICA')])[0];
assert.strictEqual(r1.result,'✔ CAMBIÓ (renombrado)','renombre de código');
assert.strictEqual(r1.campos,'UA · CRC renombrado | TIT · CRC renombrado | CON · CRC renombrado');
console.log('ok 1 · renombre de código → '+r1.result+' · campos: '+r1.campos);

// 2) Solo cambió el DV (lo recalcula SICUN) → ◐ con nota "solo DV recalculado por SICUN"
var A2='150112990370190101020010', B2='150112990370190101020019';
var r2=run(renombre(A2,B2),[fila('VAL_CRC',A2,'APLICA',{message:'VAL_CRC: código no coincide',observation:'se corrigió en SICUN'})])[0];
assert.strictEqual(r2.result,'⚠ SIN CAMBIO EN SICUN','solo DV sin mención');
assert(/(^| · )solo DV recalculado por SICUN/.test(r2.note),'nota solo DV: '+r2.note);
assert.strictEqual(r2.campos,'');assert.strictEqual(r2.crcNuevo,B2);
assert.strictEqual(T.pubPublica(r2),true,'◐ sigue publicándose como aviso');
console.log('ok 2 · solo DV → '+r2.result+' · nota: '+r2.note);

// 3) Regla vieja retirada: mencionar "DV"/"dígito verificador" ya no cambia el estado (sigue ◐)
['corregir dígito verificador','Digito  Verificador mal','DV incorrecto','el dv no cuadra'].forEach(function(obs,i){
  var r=run(renombre(A2,B2),[fila('VAL_CRC',A2,'APLICA',i%2?{message:obs}:{observation:obs})])[0];
  if(i%2)assert.match(r.result,/^◐ Cambió pero sigue mal: .*\(R3\)/);else assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN');assert(/solo DV recalculado por SICUN/.test(r.note));
  if(!(i%2))assert.strictEqual(r.campos,r2.campos);});
console.log('ok 3 · mención de "DV" en obs o mensaje ya no cuenta → ◐ CAMBIÓ OTRO CAMPO');

// 4) NO APLICA con solo campos no esperados (mismo piso) → ✔ NO APLICA CONFIRMADO, nota "también cambió", no se publica
var C='150112190370070101010015';
function celda(rep,campo,piso){return {key:C,campos:[],cambios:[{tipo:'celda',campo:campo,antes:'x',despues:'y',filaA:2,filaB:2}],_p:piso,_r:rep};}
function board4(cambios){var ids=['UA','CON','TIT'];return ids.map(function(id){var mods=cambios.filter(function(m){return m._r===id;}),p=(mods[0]||{})._p||'1';
  return ctx(id,[{[KEY]:C,[PISO]:p}],[{[KEY]:C,[PISO]:p}],{mods:mods.map(function(m){return {key:m.key,cambios:m.cambios};})});});}
var casos4=[
  ['VAL_CATEGORIAS-AREAS_2',[celda('UA','Tipo de Interior','1'),celda('UA','Número de Interior','1')],'UA · Tipo de Interior | UA · Número de Interior'],
  ['VAL_USO_CIIU',[celda('UA','Tipo de Interior','1'),celda('UA','Número de Interior','1'),celda('CON','ECS','1')],'UA · Tipo de Interior | UA · Número de Interior | CON · ECS']];
casos4.forEach(function(c){
  var r=run(board4(c[1]),[fila(c[0],C,'NO APLICA',{piso:'1'})])[0];
  assert.strictEqual(r.result,'✔ NO APLICA CONFIRMADO',c[0]);
  assert.strictEqual(r.campos,c[2],'campos = lo usado para el estado');
  assert(r.note.indexOf('También cambió: '+c[2].split(' | ').join(', '))>=0,'nota: '+r.note);
  assert.strictEqual(T.pubPublica(r),false,'confirmado no se publica');
  console.log('ok 4 · '+c[0]+' NO APLICA → '+r.result+' · nota: '+r.note+' · no publicado');});
// Control: si cambió un campo esperado del mismo piso → sigue ℹ y se publica
var rc=run(board4([celda('CON','Código De Actividad Económica (CIIU)','1')]),[fila('VAL_USO_CIIU',C,'NO APLICA',{piso:'1'})])[0];
assert.strictEqual(rc.result,'ℹ NO APLICA pero SICUN cambió');assert.strictEqual(T.pubPublica(rc),true);
// Control: esperado de OTRO piso (CRC+PISO) → confirmado
var ro=run(board4([celda('CON','Código De Actividad Económica (CIIU)','2')]),[fila('VAL_USO_CIIU',C,'NO APLICA',{piso:'1'})]);
assert.strictEqual(ro.length,0,'esperado de otro piso → confirmado sin cambios propios (se omite, como antes)');
console.log('ok controles · esperado mismo piso → ℹ publicado · esperado de otro piso → confirmado');

// 5) Emparejado por huella ("CRC cambió"), sin evento de renombre: el DV también es neutro
function huella(a,b){return {A:new Map([[a,'titular=X']]),B:new Map([[b,'titular=X']]),campos:['titular']};}
function soloHuella(a,b){return ['UA','TIT','CON'].map(function(id){return ctx(id,[{[KEY]:a}],[{[KEY]:b}],{});});}
var h1=run(soloHuella(A1,B1),[fila('VAL_CRC',A1,'APLICA')],huella(A1,B1))[0];
assert.strictEqual(h1.result,'✔ CAMBIÓ (renombrado)','huella con cambio de código');assert(/CRC cambió/.test(h1.change));
var h2=run(soloHuella(A2,B2),[fila('VAL_CRC',A2,'APLICA')],huella(A2,B2))[0];
assert.strictEqual(h2.result,'⚠ SIN CAMBIO EN SICUN','huella solo DV');assert(/solo DV recalculado por SICUN/.test(h2.note),h2.note);
assert.strictEqual(h2.campos,'');assert.strictEqual(h2.crcNuevo,B2);
var h3=run(soloHuella(A2,B2),[fila('VAL_CRC',A2,'APLICA',{observation:'corregir dígito verificador'})],huella(A2,B2))[0];
assert.strictEqual(h3.result,'⚠ SIN CAMBIO EN SICUN','mención solo en observación no cuenta');assert.strictEqual(h3.campos,h2.campos);
console.log('ok 5 · huella: código → '+h1.result+' · solo DV → '+h2.result+' ('+h2.note+') · con mención → '+h3.result);
