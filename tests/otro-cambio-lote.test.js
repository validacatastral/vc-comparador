/* Fila marcada OTRO CAMBIO: cuenta CUALQUIER cambio real de otra unidad del lote (✔ CAMBIÓ (otra unidad del lote), verificado), salvo ruido de SICUN
   ('% de Bien Común' vacío ↔ 0, trámite). APLICA sigue exigiendo los campos esperados del validador (#26).
   Uso: node tests/otro-cambio-lote.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx,OTRA:C2_OTRO_CAMBIO_LOTE,bucket:c2bucket});');

var KEY='Código de Referencia Catastral', USO='Código De Uso', BC='% de Bien Común - Terreno Legal';
var HUA=[KEY,USO,'Tipo de Interior',BC];
var HCON=[KEY,'N° Piso','Fecha Construcción','Código De Actividad Económica (CIIU)'];
function o(h,v){var r={};h.forEach(function(c,i){r[c]=v[i];});return r;}
function unidad(k,u){u=u||{};return {UA:[o(HUA,[k,u.uso||'020304',u.tint==null?'TIENDA':u.tint,u.bc==null?'':u.bc])],
  CON:[o(HCON,[k,'1',u.fecha||'2010-01-01',u.ciiu==null?'    ':u.ciiu])]};}
function board(antes,despues){
  return [['UA',HUA],['CON',HCON]].map(function(p){var c={preset:{id:p[0],key:KEY},A:{headers:p[1],rows:[]},B:{headers:p[1],rows:[]}};
    antes.forEach(function(u){c.A.rows=c.A.rows.concat(u[p[0]]);});despues.forEach(function(u){c.B.rows=c.B.rows.concat(u[p[0]]);});c.RES=T.compareCtx(c);return c;});
}
function fila(code,state){return {tecnico:'TEC',polygon:'260810191',sheet:'VAL_USO_CIIU',validator:'VAL_USO_CIIU',rawCode:code,partial:'',numeric:false,piso:'1',state:state,observation:'',message:'CIIU no debe estar vacío',noState:false};}
function run(b,rows){T.set(b,[{rows:rows}]);return T.c2rows();}
var L='15011068044006', U1=L+'0102010015', U2=L+'0101010015';

// (a) OTRO CAMBIO + otra unidad cambia un campo no esperado (Fecha Construcción) → ◐ otra unidad
var r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2,{fecha:'2015-05-01'})]),[fila(U1,'OTRO CAMBIO')]);
assert.strictEqual(r[0].result,T.OTRA,'a: '+r[0].result);assert(r[0].otraUnidad.indexOf(U2)>=0&&/Fecha Construcción/.test(r[0].otraUnidad),r[0].otraUnidad);
assert.strictEqual(T.bucket(r[0].result),0,'a bucket verificado');
console.log('ok a · OTRO CAMBIO + otra unidad cambia fecha → ✔ CAMBIÓ (otra unidad) · '+r[0].otraUnidad);
// (b) APLICA con el mismo cambio → sigue ⚠ (regla de campos esperados intacta)
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2,{fecha:'2015-05-01'})]),[fila(U1,'APLICA')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','b: '+r[0].result);
console.log('ok b · APLICA + cambio no esperado en otra unidad → ⚠');
// (c) OTRO CAMBIO + otra unidad solo cambia % Bien Común de vacío a 0 → ⚠ (ruido de SICUN)
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2,{bc:'0'})]),[fila(U1,'OTRO CAMBIO')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','c: '+r[0].result);
console.log('ok c · OTRO CAMBIO + solo % bien común vacío→0 → ⚠');
// (d) OTRO CAMBIO + lote sin cambios → ⚠
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2)]),[fila(U1,'OTRO CAMBIO')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','d: '+r[0].result);
console.log('ok d · OTRO CAMBIO + lote sin cambios → ⚠');
// (e) OTRO CAMBIO + otra unidad borra Tipo de Interior → ◐ (cambio real)
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2,{tint:''})]),[fila(U1,'OTRO CAMBIO')]);
assert.strictEqual(r[0].result,T.OTRA,'e: '+r[0].result);
console.log('ok e · OTRO CAMBIO + otra unidad cambia tipo de interior → ✔ CAMBIÓ (otra unidad)');
