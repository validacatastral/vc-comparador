/* "◐ Cambió otra unidad del lote" solo cuenta si la otra unidad cambió los MISMOS campos esperados de la fila (observados y relacionados).
   Si las otras unidades solo cambiaron campos no relacionados, la fila se queda como estaba. Motor real (compareCtx + c2rows), datos sintéticos.
   Uso: node tests/otra-unidad-campos.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx,OTRA:C2_OTRA_UNIDAD});');

var KEY='Código de Referencia Catastral', COND='Condición del Titular', USO='Código De Uso';
var HUA=[KEY,'Área De Terreno Verificada (M2)',USO,'Número Municipal',COND];
var HCON=[KEY,'N° Piso','Área Verificada','Techo'];
function o(h,v){var r={};h.forEach(function(c,i){r[c]=v[i];});return r;}
/* u: {cond, techo, area} = cambios en UA · Condición del Titular, CON · Techo (piso 1), CON · Área Verificada (piso 1). */
function unidad(k,u){u=u||{};return {UA:[o(HUA,[k,'120.50','010101','123',u.cond||'PROPIETARIO'])],CON:[o(HCON,[k,'1',u.area||'80.00',u.techo||'C']),o(HCON,[k,'2','60.00','C'])]};}
function board(antes,despues){
  return [['UA',HUA],['CON',HCON]].map(function(p){var c={preset:{id:p[0],key:KEY},A:{headers:p[1],rows:[]},B:{headers:p[1],rows:[]}};
    antes.forEach(function(u){c.A.rows=c.A.rows.concat(u[p[0]]);});despues.forEach(function(u){c.B.rows=c.B.rows.concat(u[p[0]]);});c.RES=T.compareCtx(c);return c;});
}
function fila(validator,code,state,piso){return {tecnico:'TEC SINTETICO',polygon:'260210019',sheet:validator,validator:validator,rawCode:code,partial:'',numeric:false,piso:piso||'',state:state,observation:'',message:'',noState:false};}
function run(b,rows){T.set(b,[{rows:rows}]);return T.c2rows();}
var L='15011235007009', U1=L+'0101010013', U3=L+'0101030011', U4=L+'0101040015';
var VAL='VAL_TITULAR_INSCRIPCION';   /* observa UA · Condición del Titular (y otros de UA); no observa CON · Techo */

// (a) Otra unidad cambió un campo NO relacionado (CON · Techo) → la fila sigue ⚠ SIN CAMBIO (pendiente real, no se esconde)
var r=run(board([unidad(U1),unidad(U3)],[unidad(U1),unidad(U3,{techo:'D'})]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','a: '+r[0].result);assert.strictEqual(r[0].otraUnidad,'');assert.strictEqual(r[0].campos,'');
// …y una fila ? NO ENCONTRADO se queda ? NO ENCONTRADO
r=run(board([unidad(U3)],[unidad(U3,{techo:'D'})]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,'? NO ENCONTRADO','a no encontrado: '+r[0].result);
console.log('ok a · otra unidad con campo no relacionado → ⚠ SIN CAMBIO / ? NO ENCONTRADO');

// (b) Otra unidad cambió el MISMO campo esperado → ◐ otra unidad; el detalle lista solo los campos que coinciden
r=run(board([unidad(U1),unidad(U3),unidad(U4)],[unidad(U1),unidad(U3,{cond:'POSEEDOR',techo:'D'}),unidad(U4,{techo:'D'})]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,T.OTRA,'b: '+r[0].result);
assert.strictEqual(r[0].otraUnidad,U3+' (UA · '+COND+')','solo campos que coinciden; U4 (solo Techo) no aparece');
assert.strictEqual(r[0].campos,'UA · '+COND);
console.log('ok b · mismo campo esperado → '+r[0].result+' · '+r[0].otraUnidad);

// (c) Lo mismo con ID de lote de 8 dígitos (validador CRC+PISO, piso 2; los cambios de otras unidades son del piso 1)
var ID='35007009', CIIU='VAL_PISO_CATEGORIA_TECHO';
assert(T&&html.indexOf(CIIU+":{level:'CRC+PISO'")>=0,'validador CRC+PISO');
var map=/VAL_PISO_CATEGORIA_TECHO:\{[^}]*\}[^}]*\}/.exec(html)[0];assert(/CON:\[[^\]]*'Techo'/.test(map),'Techo es campo esperado: '+map);
r=run(board([unidad(U1),unidad(U3)],[unidad(U1),unidad(U3,{techo:'D'})]),[fila(CIIU,ID,'APLICA','2')]);
assert.strictEqual(r[0].result,T.OTRA,'c mismo campo: '+r[0].result);assert.strictEqual(r[0].otraUnidad,U3+' (CON · Techo)');
r=run(board([unidad(U1),unidad(U3)],[unidad(U1),unidad(U3,{area:'85.00'})]),[fila(CIIU,ID,'APLICA','2')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','c campo no relacionado (CON · Área Verificada) sigue ⚠: '+r[0].result);assert.strictEqual(r[0].otraUnidad,'');
console.log('ok c · ID de lote '+ID+' → mismo campo ◐ otra unidad · no relacionado no');
