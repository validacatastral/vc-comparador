/* Prueba del emparejamiento por huella cuando cambia el CRC. Datos sintéticos; no usa datos reales.
   Uso: node tests/emparejamiento-crc.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','var C2_MAP'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('function toNum','function eqVal'),cut('function normKey','\n'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','\n'),cut('/* Criterio APLICA','/* Diferencias reales')].join('\n');
var T=vm.runInNewContext(src+'\n({M:CAMPOS_VALIDADOR,c2eventKind:c2eventKind,c2classify:c2classify,c2huellas:c2huellas,c2matchUnits:c2matchUnits,c2lotSummary:c2lotSummary});');

var LOT='15011219037007', L2='15011219037008';
function crc(u,lot){return (lot||LOT)+u+'0';}                       // u = edif+entrada+piso+unidad (9 dígitos)
function M(o){return new Map(Object.keys(o).map(function(k){return [k,o[k]];}));}
function types(r){return r.items.map(function(i){return i.type;}).join(',');}
var U1=crc('010101001'),U2=crc('010101002'),U3=crc('010102001'),U4=crc('010102002'), r, s;

// 1) Cambio simple: U2 desaparece y aparece U3 con la misma huella
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a',[U3]:'b'}),LOT);
assert.strictEqual(types(r),'cambio');assert.strictEqual(r.items[0].a,U2);assert.strictEqual(r.items[0].b,U3);
s=T.c2lotSummary(r,null,true);assert.strictEqual(s,'✔ CRC cambió: 01-01-01-002 → 01-01-02-001');
console.log('ok cambio simple · '+s);

// 2) Intercambio: ambos CRC existen en las dos fechas con huellas cruzadas
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b',[U3]:'c'}),M({[U1]:'b',[U2]:'a',[U3]:'c'}),LOT);
assert.strictEqual(types(r),'swap');s=T.c2lotSummary(r,null,true);assert.strictEqual(s,'✔ CRC intercambiados 01-01-01-001 ↔ 01-01-01-002');
console.log('ok intercambio · '+s);

// 3) Unidad nueva: cambia la cantidad de unidades, sin CRC cambiado
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a',[U2]:'b',[U3]:'c'}),LOT);
assert.strictEqual(types(r),'nueva');s=T.c2lotSummary(r,null,true);assert.strictEqual(s,'Lote: 2 → 3 unidades · unidad nueva: 01-01-02-001');
console.log('ok unidad nueva · '+s);

// 4) Empate: dos candidatos con la misma huella → revisar a mano, nunca adivinar
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a',[U3]:'b',[U4]:'b'}),LOT);
assert.strictEqual(r.items[0].type,'revisar');assert.strictEqual(r.items[0].reason,'empate de huella');assert(!r.items.some(function(i){return i.type==='cambio';}));
s=T.c2lotSummary(r,null,true);console.log('ok empate · '+s);
// 4b) Empate por dos orígenes con la misma huella y un solo destino
r=T.c2matchUnits(M({[U1]:'b',[U2]:'b'}),M({[U3]:'b'}),LOT);
assert.deepStrictEqual(r.items.filter(function(i){return i.type==='revisar';}).length,2);

// 5) Sin candidato / sin huella → revisar a mano
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a'}),LOT);
assert.strictEqual(r.items[0].type,'revisar');assert.strictEqual(r.items[0].reason,'sin candidato');
r=T.c2matchUnits(M({[U2]:''}),M({[U3]:''}),LOT);assert.strictEqual(r.items[0].reason,'sin huella');

// 6) Mismo CRC y misma huella → sin cambio real; mismo CRC con datos distintos → modificación normal
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a',[U2]:'b'}),LOT);assert.strictEqual(r.items.length,0);
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a',[U2]:'z'}),LOT);assert.strictEqual(r.items.length,0);

// 7) No está en el lote → se busca en toda la manzana
var V=crc('010101001',L2);
r=T.c2matchUnits(M({[U1]:'a',[U2]:'b'}),M({[U1]:'a',[V]:'b'}),LOT);
assert.strictEqual(types(r),'cambio');assert.strictEqual(r.items[0].b,V);assert.strictEqual(r.items[0].otroLote,true);
console.log('ok búsqueda en manzana · '+T.c2lotSummary(r,null,true));

// 8) Para VAL_CRC el emparejamiento cuenta como observado corregido (APLICA ✔); para otros validadores es "otro campo"
var ev={key:U2,report:'CRC',field:'CRC cambió',before:U2,after:U3,type:'crcmatch'};
assert.strictEqual(T.c2eventKind(T.M.VAL_CRC,ev,function(){return true;}),'obs');
assert.strictEqual(T.c2classify('APLICA',1,0).result,'✔ VERIFICADO');
assert.strictEqual(T.c2eventKind(T.M.VAL_USO_CIIU,ev,function(){return true;}),'otro');

// 9) Huella con encabezados reales: titular/DNI + áreas + uso + interior; detecta el CRC cambiado
function side(headers,rows){return {headers:headers,rows:rows.map(function(v){var o={};headers.forEach(function(h,i){o[h]=v[i];});return o;})};}
var K='Código de Referencia Catastral', hUA=[K,'Código De Uso','Área De Terreno Verificada (M2)','Número de Interior'], hTIT=[K,'Nro. Documento Identidad','RUC','Apellido Paterno'], hCON=[K,'N° Piso','Área Verificada'];
var board=[
  {preset:{id:'UA',key:K},A:side(hUA,[[U1,'010101','100.5','A'],[U2,'010101','100.5','B']]),B:side(hUA,[[U1,'010101',100.5,'A'],[U3,'010101','100.50','B']])},
  {preset:{id:'TIT',key:K},A:side(hTIT,[[U1,'11111111','',''],[U2,'22222222','',''],[U2,'33333333','','']]),B:side(hTIT,[[U1,'11111111','',''],[U3,'33333333','',''],[U3,'22222222','','']])},
  {preset:{id:'CON',key:K},A:side(hCON,[[U2,1,'40'],[U2,2,'35.5']]),B:side(hCON,[[U3,2,'35.5'],[U3,1,'40']])},
  {preset:{id:'OBR',key:K},A:null,B:null}
];
var H=T.c2huellas(board);
assert.deepStrictEqual(Array.from(H.campos),['titular','área terreno','área construida','uso','N° municipal / interior']);
assert.strictEqual(H.A.get(U2),H.B.get(U3));assert.notStrictEqual(H.A.get(U1),H.A.get(U2));
r=T.c2matchUnits(H.A,H.B,LOT);assert.strictEqual(types(r),'cambio');
console.log('ok huella con encabezados reales · '+H.A.get(U2));
console.log('ok emparejamiento CRC');
