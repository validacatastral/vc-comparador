/* VAL_CRC: Tipo/Número de Interior como campos esperados; "CRC renombrado (solo DV)" neutro (DV recalculado por SICUN).
   Corre c2rows real con el motor real (matchBlock/eqVal) y stubs mínimos (sin DOM). Datos sintéticos. Uso: node tests/valcrc-interior-y-dv.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
var n=0;html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,function(_,code){n++;new vm.Script(code,{filename:'index.html<script '+n+'>'});});
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('function normVal','function normKey'),cut('function normKey','\n'),
  cut('function rowScore','function findRenames'),cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2rows(){'),cut('function c2rows(){','function c2summary'),
  cut('function c2bucket','function c2summary'),cut('var PUB_LABELS','/* Prepara la publicación')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,pubPublica:pubPublica,c2expected:c2expected,M:CAMPOS_VALIDADOR});');

var KEY='Código de Referencia Catastral', TI='Tipo de Interior', NI='Número de Interior', USO='Código De Uso', PISO='N° Piso';
var HUA=[KEY,TI,NI,USO], HTIT=[KEY,'Nro. Documento Identidad'], HCON=[KEY,PISO,'Área Verificada'];
function side(h,rows){return {headers:h,rows:rows};}
/* Un contexto renombrado de→a por reporte (como en SICUN); ua = [filaAntes, filaDespués] del reporte UA. */
function board(de,a,ua){
  function rowsOf(h,key,vals){var o={};h.forEach(function(c,i){o[c]=i?vals[i-1]:key;});return o;}
  function ctx(id,h,ra,rb){return {preset:{id:id,key:KEY},A:side(h,[ra]),B:side(h,[rb]),
    RES:{mods:[],nuevos:[],eliminados:[],renombrados:[{de:de,a:a,row:rb}],diffCols:h.slice(1)}};}
  return [ctx('UA',HUA,rowsOf(HUA,de,ua[0]),rowsOf(HUA,a,ua[1])),
    ctx('TIT',HTIT,rowsOf(HTIT,de,['40000001']),rowsOf(HTIT,a,['40000001'])),
    ctx('CON',HCON,rowsOf(HCON,de,['1','80']),rowsOf(HCON,a,['1','80']))];
}
function fila(validator,code,state,extra){return Object.assign({tecnico:'TEC SINTETICO',polygon:'',sheet:validator,validator:validator,rawCode:code,partial:'',numeric:false,piso:'',state:state,observation:'',message:'',noState:false},extra||{});}
function run(b,rows){T.set(b,[{rows:rows}]);return T.c2rows();}
var SIN=['CASA / CHALET','S/N','010101'];

// 0) VAL_CRC lista Tipo/Número de Interior como campos esperados
var exp=T.c2expected(T.M.VAL_CRC);
assert(exp.indexOf('(rel.) UA · Tipo de Interior')>=0&&exp.indexOf('(rel.) UA · Número de Interior')>=0,exp.join(' | '));
console.log('ok 0 · VAL_CRC espera: '+exp.slice(-2).join(' | '));

// 1) Caso real (sintético): lote 22-070-019, "Inconsistencia por estructura", CRC …020010 → …020019 (solo DV) + interior vaciado
var A='150112220700190101020010', B='150112220700190101020019';
var b1=board(A,B,[SIN,['','','010101']]);b1[0].B.rows.push({[KEY]:'150112220700190101010013',[TI]:'',[NI]:'',[USO]:'010101'});   /* la edificación también tiene piso 01 (si no, R3 de VAL_CRC: sigue mal) */
var r1=run(b1,[fila('VAL_CRC',A,'APLICA',{message:'Inconsistencia por estructura'})])[0];
assert.strictEqual(r1.result,'✔ VERIFICADO','caso real');
assert.strictEqual(r1.campos,'UA · Tipo de Interior | UA · Número de Interior','sin "(solo DV)" en campos');
assert(/(^| · )DV recalculado por SICUN( · |$)/.test(r1.note)&&!/solo DV/.test(r1.note),'nota: '+r1.note);
assert(!/solo DV/.test(r1.change),'cambios sin el DV: '+r1.change);
assert.strictEqual(T.pubPublica(r1),false,'✔ no se publica');
console.log('ok 1 · caso real → '+r1.result+' · campos: '+r1.campos+' · nota: '+r1.note);

// 2) Solo DV, sin otro cambio (datos idénticos: se empareja por huella) → ◐ con nota "solo DV recalculado por SICUN"; "(solo DV)" sí aparece en campos
var r2=run(board(A,B,[SIN,SIN]),[fila('VAL_CRC',A,'APLICA',{message:'Inconsistencia por estructura'})])[0];
assert.strictEqual(r2.result,'◐ CAMBIÓ OTRO CAMPO','solo DV');
assert(/(^| · )solo DV recalculado por SICUN/.test(r2.note),r2.note);
assert.strictEqual(r2.campos,'CRC · CRC cambió (solo DV)','datos idénticos → emparejado por huella; "(solo DV)" sí aparece en campos');
console.log('ok 2 · solo DV → '+r2.result+' · nota: '+r2.note);

// 2b) Otros validadores: el DV no es esperado ni "otro campo"
var u=run(board(A,B,[SIN,['CASA / CHALET','S/N','020202']]),[fila('VAL_USO_PISO',A,'APLICA')])[0];
assert.strictEqual(u.result,'✔ VERIFICADO');assert.strictEqual(u.campos,'UA · Código De Uso');assert(/DV recalculado por SICUN/.test(u.note)&&!/También cambió/.test(u.note),u.note);
var t=run(board(A,B,[SIN,['CASA / CHALET','S/N','020202']]),[fila('VAL_TITULAR_INSCRIPCION',A,'APLICA')])[0];
assert.strictEqual(t.result,'◐ CAMBIÓ OTRO CAMPO');assert.strictEqual(t.campos,'UA · Código De Uso','el DV no cuenta como otro campo');
var na=run(board(A,B,[SIN,SIN]),[fila('VAL_TITULAR_INSCRIPCION',A,'NO APLICA')])[0];
assert.strictEqual(na.result,'✔ NO APLICA CONFIRMADO');assert(!/También cambió/.test(na.note)&&/solo DV recalculado por SICUN/.test(na.note),na.note);
console.log('ok 2b · VAL_USO_PISO → '+u.result+' ('+u.campos+') · VAL_TITULAR_INSCRIPCION → '+t.result+' ('+t.campos+') · NO APLICA solo DV → '+na.result);

// 3) Renombre de código (primeros 23 dígitos) sigue ✔ VERIFICADO, sin nota de DV
var C='150112220700190101010015', D='150112220700190101020016';
var r3=run(board(C,D,[SIN,SIN]),[fila('VAL_CRC',C,'APLICA')])[0];
assert.strictEqual(r3.result,'✔ VERIFICADO','renombre de código');
assert(/CRC cambió/.test(r3.change)&&!/DV/.test(r3.note),r3.note);
var r4=run(board(C,D,[SIN,['','','010101']]),[fila('VAL_CRC',C,'APLICA')])[0];
assert.strictEqual(r4.result,'✔ VERIFICADO');assert.strictEqual(r4.campos,'UA · CRC renombrado | TIT · CRC renombrado | CON · CRC renombrado | UA · Tipo de Interior | UA · Número de Interior');
console.log('ok 3 · renombre de código → '+r3.result+' · con interior → '+r4.campos);
