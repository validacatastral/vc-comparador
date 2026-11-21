/* Estado final en SICUN para USO_CIIU, COND_PREDIO_EN, VAL_PRODUCTO / MEP_MEDIDA_PRODUCTO y VAL_CRC (filas ⚠ SIN CAMBIO).
   Uso: node tests/estado-final-otros.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx,bucket:c2bucket});');
var KEY='Código de Referencia Catastral';
function ctx(id,H,rows){var o=function(v){var r={};H.forEach(function(c,i){r[c]=v[i];});return r;};var c={preset:{id:id,key:KEY},A:{headers:H,rows:rows.map(o)},B:{headers:H,rows:rows.map(o)}};c.RES=T.compareCtx(c);return c;}
function fila(val,code,state,msg,piso){return {tecnico:'T',polygon:'260510081',sheet:val,validator:val,rawCode:code,partial:'',numeric:false,piso:piso||'',state:state,observation:'',message:msg||'',noState:false};}
function run(b,r){T.set(b,[{rows:[r]}]);return T.c2rows()[0];}
var K='150110680440060102010015';
var HUA=[KEY,'Código De Uso','Clasificación Del Predio','Predio Catastral En'], HCON=[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'];
var MSG_CIIU='Inconsistencia, código de actividad económica (CIIU) no debe estar vacío (FI.32.03)';

// USO_CIIU
var r=run([ctx('UA',HUA,[[K,'020304','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','    ','TERMINADO']])],fila('VAL_USO_CIIU',K,'OTRO CAMBIO',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);assert(/NO APLICA/.test(r.note),r.note);console.log('ok ciiu 020304 → ✔ + nota NO APLICA');
r=run([ctx('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','    ','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/R3A/.test(r.note));console.log('ok ciiu 020105 sin CIIU → ⚠ R3A');
r=run([ctx('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','4711','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu con CIIU → ✔');
r=run([ctx('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu vivienda → ✔');
r=run([ctx('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','','02 - EN CONSTRUCCIÓN']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu obra no terminada → ✔');

// COND_PREDIO_EN
var MSG_CP='Inconsistencia, la clasificación del predio no coincide con predio catastral en (FI.24.03)';
r=run([ctx('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO EN EDIFICIO']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_CP));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/R1/.test(r.note));console.log('ok predio R1 → ⚠');
r=run([ctx('UA',HUA,[[K,'010101','PREDIO EN EDIFICIO','PREDIO EN EDIFICIO']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_CP));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok predio coherente → ✔');

// OBRAS
var HOBR=[KEY,'Código','Descripción','MEP','Producto Total','Unidad de Medida','UCA'];
r=run([ctx('OBR',HOBR,[[K,'50','PARAPETO','02','1','m²','']])],fila('VAL_PRODUCTO',K,'APLICA','Verificar producto de obra complementaria'));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/R1 obra 50/.test(r.note),r.note);console.log('ok producto = 1 → ⚠');
r=run([ctx('OBR',HOBR,[[K,'50','PARAPETO','02','12.5','m²','']])],fila('VAL_PRODUCTO',K,'APLICA','Verificar producto de obra complementaria'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok producto corregido → ✔');
r=run([ctx('OBR',HOBR,[[K,'50','PARAPETO','01','12.5','m²','']])],fila('VAL_MEP_MEDIDA_PRODUCTO',K,'APLICA','Verificar MEP (FI.29.03)'));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/R5 obra 50/.test(r.note),r.note);console.log('ok MEP mal → ⚠ R5');

// VAL_CRC
var E='1501106804400601';   // ubigeo+sec+mz+lote+edif 01
var bien=[E+'0101001'+'5',E+'0101002'+'5',E+'0102001'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,bien)],fila('VAL_CRC',E+'01010015','APLICA','Verificar estructura del CRC (FI.02.04)'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok crc correlativo → ✔');
var salto=[E+'0101001'+'5',E+'0101003'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,salto)],fila('VAL_CRC',E+'01010035','APLICA','Salto de numeración (FI.02.04)'));   /* el salto se marca en la unidad siguiente al hueco (003), como VAL_CRC.html */
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/R5/.test(r.note),r.note);console.log('ok crc salto → ⚠ R5');
// VAL_CRC como el validador: entrada 99 / unidad 999 se excluyen por campo; sótanos 81 correlativos
var conComun=[E+'0101001'+'5',E+'0101002'+'5',E+'9999999'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,conComun)],fila('VAL_CRC',E+'01010025','APLICA','Verificar estructura del CRC (FI.02.04)'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok crc con 99/999 excluidos → ✔');
var sot=[E+'0101001'+'5',E+'0182001'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,sot)],fila('VAL_CRC',E+'01820015','APLICA','Verificar estructura del CRC (FI.02.04)'));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/R6/.test(r.note),r.note);console.log('ok crc sótano 82 sin 81 → ⚠ R6');
// POSEEDOR + OTROS es válido (R5 solo aplica a POSESIÓN sin POSEEDOR)
var Tt=vm.runInNewContext(stubs+src+'\n({reglas:c2titularReglas});');
assert.strictEqual(JSON.stringify(Tt.reglas({condiciondeltitular:'POSEEDOR',formadeadquisicion:'OTROS',tipodedocumento:''},K)),'[]');
assert.strictEqual(JSON.stringify(Tt.reglas({condiciondeltitular:'PROPIETARIO',formadeadquisicion:'POSESIÓN',tipodedocumento:''},K)),JSON.stringify(['R5']));
console.log('ok titular POSEEDOR+OTROS → sin error · PROPIETARIO+POSESIÓN → R5');
