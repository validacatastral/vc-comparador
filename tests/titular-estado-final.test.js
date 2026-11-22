/* VAL_TITULAR_INSCRIPCION: si el cruce queda ⚠ SIN CAMBIO, se aplican las reglas del validador (R1–R5C, R13) a la
   fila DESPUÉS de UA. Si la regla de la observación ya no se cumple → ✔ CUMPLE EN SICUN (bucket 0); si sigue → ⚠ con nota.
   Caso real: 150110040500960101010015 corregido antes de la descarga ANTES (OTROS/ESCRITURA → POSESIÓN/sin documento).
   Uso: node tests/titular-estado-final.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx,bucket:c2bucket,reglas:c2titularReglas});');

var KEY='Código de Referencia Catastral';
var H=[KEY,'Condición del Titular','Forma de Adquisición','Tipo de Documento','Tipo de Partida Registral','Número de Partida Registral','Clasificación Del Predio'];
function o(v){var r={};H.forEach(function(c,i){r[c]=v[i];});return r;}
function board(antes,despues){var c={preset:{id:'UA',key:KEY},A:{headers:H,rows:antes.map(o)},B:{headers:H,rows:despues.map(o)}};c.RES=T.compareCtx(c);return [c];}
var MSG_TD='Inconsistencia, condición de titular incongruente con tipo de documento (FI.12.04)';
var INI={condiciondeltitular:'POSEEDOR',formadeadquisicion:'OTROS',tipodedocumento:'ESCRITURA PÚBLICA'};   /* lo que vio el validador */
function fila(code,state,msg,ini){return {tecnico:'NIKOL',polygon:'260710146',sheet:'VAL_TITULAR_INSCRIPCION',validator:'VAL_TITULAR_INSCRIPCION',rawCode:code,partial:'',numeric:false,piso:'',state:state,observation:'',message:msg||MSG_TD,noState:false,inicial:ini||INI};}
function run(b,rows){T.set(b,[{rows:rows}]);return T.c2rows();}
var K='150110040500960101010015';

// (a) Caso real: ANTES y DESPUÉS ya corregidos (POSEEDOR/POSESIÓN/sin documento) → ✔ CUMPLE EN SICUN
var bien=[K,'POSEEDOR','POSESIÓN','','','','CASA HABITACION'];
var r=run(board([bien],[bien]),[fila(K,'APLICA')])[0];
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN','a: '+r.result);assert.strictEqual(T.bucket(r.result),0);
assert(/Cumple en SICUN/.test(r.note)&&/corregido antes de la descarga ANTES/.test(r.note),r.note);
console.log('ok a · corregido antes del ANTES → '+r.result+' · '+r.note);

// (b) Sigue con POSEEDOR + ESCRITURA PÚBLICA en el DESPUÉS → ⚠ con nota R2P
var mal=[K,'POSEEDOR','OTROS','ESCRITURA PÚBLICA','','','CASA HABITACION'];
r=run(board([mal],[mal]),[fila(K,'APLICA')])[0];
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN','b: '+r.result);assert(/Sigue en SICUN: R2P/.test(r.note),r.note);
console.log('ok b · sigue R2P → ⚠ · '+r.note);

// (c) Mensaje de forma de adquisición: POSESIÓN con PROPIETARIO sigue mal (R5) → ⚠
var MSG_FA='Inconsistencia, condición de titular incongruente con forma de adquisición (FI.12.04)';
var r5=[K,'PROPIETARIO','POSESIÓN','','','','CASA HABITACION'];
r=run(board([r5],[r5]),[fila(K,'APLICA',MSG_FA)])[0];
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN','c: '+r.result);assert(/R5/.test(r.note),r.note);
console.log('ok c · sigue R5 → ⚠');

// (d) PARQUE exento → cumple
var parque=[K,'','','','','','PARQUE'];
r=run(board([parque],[parque]),[fila(K,'APLICA',MSG_FA)])[0];
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN','d: '+r.result);
console.log('ok d · PARQUE exento → ✔');

// (e) Formatos: partida electrónica de 7 dígitos → R3B (mensaje de partida)
var MSG_TP='Inconsistencia, tipo de partida registral (FI.15.03)';
var p7=[K,'PROPIETARIO','COMPRA VENTA','ESCRITURA PÚBLICA','PARTIDA ELECTRONICA','1234567','CASA HABITACION'];
r=run(board([p7],[p7]),[fila(K,'APLICA',MSG_TP)])[0];
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN','e: '+r.result);assert(/R3B/.test(r.note),r.note);
console.log('ok e · partida de 7 dígitos → ⚠ R3B');

// (f) Reglas directas (puerto del validador)
assert.strictEqual(JSON.stringify(T.reglas({condiciondeltitular:'SUCESION INTESTADA',formadeadquisicion:'COMPRA VENTA',tipodedocumento:'MINUTA DE COMPRA VENTA'},K)),JSON.stringify(['R4']));
assert.strictEqual(JSON.stringify(T.reglas({condiciondeltitular:'POSEEDOR',formadeadquisicion:'',tipodedocumento:''},K)),JSON.stringify(['R13']));
assert.strictEqual(JSON.stringify(T.reglas({condiciondeltitular:'',formadeadquisicion:'',tipodedocumento:''},'150110040500969999999995')),JSON.stringify([]),'nivel lote exento de R13');
console.log('ok f · reglas R4 / R13 / nivel lote');

// (g) Si SICUN sí cambió el campo, manda el cruce normal (✔ VERIFICADO), no el estado final
r=run(board([mal],[bien]),[fila(K,'APLICA')])[0];
assert.strictEqual(r.result,'✔ VERIFICADO','g: '+r.result);
console.log('ok g · con cambio → ✔ VERIFICADO');

// (h) Sin cambio desde la validación (el validador ya vio POSEEDOR/POSESIÓN/sin documento) → NO pasa como bien: ⚠ + posible falso error
r=run(board([bien],[bien]),[fila(K,'APLICA',MSG_TD,{condiciondeltitular:'POSEEDOR',formadeadquisicion:'POSESIÓN',tipodedocumento:''})])[0];
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN','h: '+r.result);assert(/Sin cambio desde la validación/.test(r.note)&&/NO APLICA/.test(r.note),r.note);
console.log('ok h · sin cambio desde la validación → ⚠ posible falso error');
// (i) Sin valores iniciales en el Excel → no se puede afirmar que cambió → ⚠ (conservador)
r=run(board([bien],[bien]),[fila(K,'APLICA',MSG_TD,{})])[0];
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN','i: '+r.result);
console.log('ok i · sin valores iniciales → ⚠');
// (j) Cumple lo de la UE pero hay otro error (escritura sin partida, R2) → ✔ + "Ojo, además"
var esc=[K,'OTROS','OTROS','ESCRITURA PÚBLICA','','','CASA HABITACION'];
r=run(board([esc],[esc]),[fila(K,'APLICA',MSG_TD,{condiciondeltitular:'POSEEDOR',formadeadquisicion:'OTROS',tipodedocumento:'ESCRITURA PÚBLICA'})])[0];
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN','j: '+r.result);assert(/Sigue en SICUN: R6O/.test(r.note),r.note);
console.log('ok j · OTROS + OTROS + escritura pública → ⚠ R6O');
// (k) OTROS + OTROS sin nada más, corregido desde la validación → ✔
var oo=[K,'OTROS','OTROS','','','','CASA HABITACION'];
r=run(board([oo],[oo]),[fila(K,'APLICA',MSG_TD,{condiciondeltitular:'OTROS',formadeadquisicion:'OTROS',tipodedocumento:'ESCRITURA PÚBLICA'})])[0];
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN','k: '+r.result);
console.log('ok k · OTROS + OTROS sin documento → ✔');
// (l) "Ojo, además": cumple lo de la UE pero queda otro error (PROPIETARIO + compra venta + escritura sin partida → R2 fuera del mensaje)
var r2=[K,'PROPIETARIO','COMPRA VENTA','ESCRITURA PÚBLICA','','','CASA HABITACION'];
r=run(board([r2],[r2]),[fila(K,'APLICA',MSG_TD,{condiciondeltitular:'POSEEDOR',formadeadquisicion:'COMPRA VENTA',tipodedocumento:'ESCRITURA PÚBLICA'})])[0];
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN','l: '+r.result);assert(/Ojo, además: R2/.test(r.note),r.note);
console.log('ok l · cumple lo de la UE + ojo, además R2');
