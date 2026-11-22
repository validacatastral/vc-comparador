/* c2cambioDesdeInicial: solo campos de la regla + normalización c2valCmp (ceros, código - descripción, números, vacíos).
   Uso: node tests/inicial-robusto.test.js */
'use strict';
var assert=require('assert'),vm=require('vm');
var {ctx,KEY,fila,stubs,src}=require('./estado-final-helper');
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,bucket:c2bucket,cmp:c2cambioDesdeInicial,campos:c2reglaCampos});');
function run(b,r){T.set(b,[{rows:[r]}]);return T.c2rows()[0];}
var CI='codigodeactividadeconomicaciiu',US='codigodeuso';
function c(a,b,k){var o={},p={};o[k]=a;p[k]=b;return T.cmp(o,p,[k]);}

// normalización
assert.strictEqual(c('0111','111',CI),false,'ceros iniciales');
assert.strictEqual(c('8510','8510 - ENSEÑANZA PREPRIMARIA',CI),false,'código vs código - descripción');
assert.strictEqual(c('8510 - Enseñanza preprimaria','8510',CI),false,'al revés');
assert.strictEqual(c('8510','8521 - ENSEÑANZA SECUNDARIA',CI),true,'otro código');
assert.strictEqual(c('120','120,00','productototal'),false,'120 = 120,00');
assert.strictEqual(c('120.0','120','productototal'),false,'120.0 = 120');
assert.strictEqual(c('120','121','productototal'),true,'número distinto');
assert.strictEqual(c('','-',US),false,'vacío vs -');
['—','NULL','N/A','0'].forEach(function(v){assert.strictEqual(c('',v,CI),false,'vacío vs '+v);});
assert.strictEqual(c('','4711',CI),true,'vacío vs código');
assert.strictEqual(c('01 - CASA HABITACION','CASA HABITACION','clasificaciondelpredio'),false,'descripción con y sin código');
assert.strictEqual(c('15/06/2020','2020-06-15','fechaconstruccion'),false,'fecha con fechaComparable');
assert.strictEqual(c('8510','ENSEÑANZA PREPRIMARIA',CI),null,'solo código vs solo descripción → no se sabe');
assert.strictEqual(c('ENSEÑANZA SECUNDARIA','4711',CI),null,'al revés → no se sabe');
console.log('ok normalización');

// solo campos de la regla
assert.strictEqual(T.cmp({[CI]:'8510',[US]:'020105'},{[CI]:'8510',[US]:'050101'},[CI]),false,'campo fuera de la regla no cuenta');
assert.strictEqual(T.cmp({[CI]:'8510',[US]:'020105'},{[CI]:'8510',[US]:'050101'},[CI,US]),true);
assert.strictEqual(T.cmp({[CI]:'8510'},{[CI]:'8510'},[]),null,'sin campos de la regla → null');
assert.strictEqual(T.cmp({otro:'1'},{[CI]:'8510'},[CI]),null,'sin valor inicial del campo → null');
assert.strictEqual(JSON.stringify(T.campos('USO',['R3A'])),JSON.stringify([CI]));assert.strictEqual(JSON.stringify(T.campos('OBR',['R4'])),'[]');
console.log('ok campos de la regla');

// integración (paso 3)
var K='150110680440060102010015';
var HUA=[KEY,'Código De Uso','Clasificación Del Predio','Predio Catastral En'], HCON=[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'];
function uso(u,ci){return [ctx('UA',HUA,[[K,u,'CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1',ci,'TERMINADO']])];}
// R3A evalúa solo el CIIU: el uso inicial distinto no hace "cambió" → ⚠ (b)
var r=run(uso('050101',''),fila('VAL_USO_CIIU',K,'APLICA','[R3A]','1',{[US]:'020105',[CI]:'-'}));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert.strictEqual(r.paso3.caso,'sigueMal');
// ceros y código - descripción en el inicial → no cambió → ⚠ falso error, no ✔
r=run(uso('050101','8510'),fila('VAL_USO_CIIU',K,'APLICA','[R4A]','1',{[US]:'50101',[CI]:'08510 - ENSEÑANZA PREPRIMARIA'}));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert.strictEqual(r.paso3.caso,'falsoError');
// cambió de verdad el CIIU → ◐ (a) con el nombre del campo en la nota, sin valores
r=run(uso('050101','4711'),fila('VAL_USO_CIIU',K,'APLICA','[R4A]','1',{[US]:'050101',[CI]:'4520 - MANTENIMIENTO'}));
assert(r.result.indexOf('◐ Cambió pero sigue mal: ')===0,r.result);
assert(/cambió antes de la descarga ANTES: CIIU/.test(r.note),r.note);assert(!/4520|MANTENIMIENTO/.test(r.note),r.note);
// sin campos comparables → null: queda ⚠ (ni ◐ ni ✔) con nota
[['4711','[R4A]'],['8510','[R4A]']].forEach(function(x){
  var s=run(uso('050101',x[0]),fila('VAL_USO_CIIU',K,'APLICA',x[1],'1',{}));
  assert.strictEqual(s.result,'⚠ SIN CAMBIO EN SICUN',s.result);assert.strictEqual(T.bucket(s.result),2);
  assert(/sin valor inicial comparable/.test(s.note),s.note);
});
// solo código vs solo descripción → null: queda ⚠ con nota, ni ◐ ni ✔
[['4711',{[CI]:'VENTA AL POR MENOR'}],['8510',{[CI]:'ENSEÑANZA PREPRIMARIA'}]].forEach(function(x){
  var s=run(uso('050101',x[0]),fila('VAL_USO_CIIU',K,'APLICA','[R3A]','1',x[1]));
  assert.strictEqual(s.result,'⚠ SIN CAMBIO EN SICUN',s.result);assert(/sin valor inicial comparable/.test(s.note),s.note);
});
console.log('ok paso 3 (b / c / a / null → ⚠)');
console.log('inicial-robusto: ok');
