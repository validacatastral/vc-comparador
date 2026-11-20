/* "◐ Cambió otra unidad del lote": la fila quedaría ⚠ SIN CAMBIO o ? NO ENCONTRADO, pero en SICUN cambió OTRA unidad (CRC) del mismo lote.
   Corre el motor real (compareCtx + c2rows) con stubs mínimos (sin DOM) y la publicación (pubPayload). Datos sintéticos.
   Uso: node tests/otra-unidad-lote.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
var n=0;html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,function(_,code){n++;new vm.Script(code,{filename:'index.html<script '+n+'>'});});
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary'),cut('var PUB_COUNTS','\n'),cut('function pubCounts','\n'),
  cut('var PUB_OTRO_CAMPO','function pubPayload')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx,c2bucket:c2bucket,pubCounts:pubCounts,pubPublica:pubPublica,pubResultado:pubResultado,c2otraUnidad:c2otraUnidad,c2lotIndex:c2lotIndex,OTRA:C2_OTRA_UNIDAD});');

var KEY='Código de Referencia Catastral', COND='Condición del Titular';
var HUA=[KEY,'Área De Terreno Verificada (M2)','Código De Uso','Número Municipal',COND,'Forma de Adquisición','Tipo de Documento'];
var HTIT=[KEY,'Nro. Documento Identidad','Apellido Paterno','Nombres'];
var HCON=[KEY,'N° Piso','Área Verificada'];
function o(h,v){var r={};h.forEach(function(c,i){r[c]=v[i];});return r;}
/* Unidad k: 1 renglón UA, 1 titular, 2 pisos en CON. Todas iguales (misma huella): cambiar Condición del Titular no mueve la huella. */
function unidad(k,cond,area1){return {UA:[o(HUA,[k,'120.50','010101','123',cond||'PROPIETARIO','COMPRA VENTA','ESCRITURA PÚBLICA'])],
  TIT:[o(HTIT,[k,'40000001','PEREZ','JUAN'])],CON:[o(HCON,[k,'1',area1||'80.00']),o(HCON,[k,'2','60.00'])]};}
function board(antes,despues){
  return [['UA',HUA],['TIT',HTIT],['CON',HCON]].map(function(p){var c={preset:{id:p[0],key:KEY},A:{headers:p[1],rows:[]},B:{headers:p[1],rows:[]}};
    antes.forEach(function(u){c.A.rows=c.A.rows.concat(u[p[0]]);});despues.forEach(function(u){c.B.rows=c.B.rows.concat(u[p[0]]);});c.RES=T.compareCtx(c);return c;});
}
function fila(validator,code,state,piso){return {tecnico:'TEC SINTETICO',polygon:'260210019',sheet:validator,validator:validator,rawCode:code,partial:'',numeric:false,piso:piso||'',state:state,observation:'',message:'',noState:false};}
function run(b,rows){T.set(b,rows.length?[{rows:rows}]:[]);return T.c2rows();}

// Lote 15011235007009 (UBIGEO 150112 · S35 · Mz 007 · Lt 009) con varias unidades. Otro lote 010 en la misma manzana.
var L='15011235007009', U1=L+'0101010013', U2=L+'0101020017', U3=L+'0101030011', U4=L+'0101040015', U5=L+'0101050019', U6=L+'0101060012', OTRO_LOTE='150112350070100101010014';
var VAL='VAL_TITULAR_INSCRIPCION';   /* nivel CRC; observa UA · Condición del Titular */

// (a) Se corrigió OTRA unidad del lote (U2), no la del cruce (U1) → ◐ otra unidad, con CRC y campo (sin valores)
var r=run(board([unidad(U1),unidad(U2),unidad(OTRO_LOTE)],[unidad(U1),unidad(U2,'POSEEDOR'),unidad(OTRO_LOTE)]),[fila(VAL,U1,'APLICA'),fila(VAL,U1,'OTRO CAMBIO')]);
assert.strictEqual(r[0].result,T.OTRA,'a APLICA: '+r[0].result);assert.strictEqual(r[1].result,T.OTRA,'a OTRO CAMBIO: '+r[1].result);
assert.strictEqual(T.c2bucket(r[0].result),7);
assert.strictEqual(r[0].otraUnidad,U2+' (UA · '+COND+')');
assert.strictEqual(r[0].campos,'UA · '+COND);
assert(/^Cambió otra unidad del lote: /.test(r[0].change)&&/^Cambió otra unidad del lote: /.test(r[0].changeView),r[0].changeView);
assert(!/POSEEDOR|PROPIETARIO/.test(r[0].otraUnidad+r[0].campos),'sin valores SICUN en el detalle');
console.log('ok a · otra unidad → '+r[0].result+' · '+r[0].otraUnidad);

// (b) No cambia nada en el lote (solo cambió otro lote) → sigue ⚠ SIN CAMBIO
r=run(board([unidad(U1),unidad(U2),unidad(OTRO_LOTE)],[unidad(U1),unidad(U2),unidad(OTRO_LOTE,'POSEEDOR')]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','b: '+r[0].result);assert.strictEqual(r[0].otraUnidad,'');assert.strictEqual(r[0].campos,'');
console.log('ok b · nada en el lote → '+r[0].result);

// (c) Cambia la propia unidad → igual que hoy (aunque también cambie otra unidad del lote)
r=run(board([unidad(U1),unidad(U2)],[unidad(U1,'POSEEDOR'),unidad(U2,'OTROS')]),[fila(VAL,U1,'APLICA'),fila(VAL,U1,'NO APLICA'),fila(VAL,U2,'APLICA')]);
assert.strictEqual(r[0].result,'✔ VERIFICADO','c: '+r[0].result);assert.strictEqual(r[0].otraUnidad,'');
assert.strictEqual(r[1].result,'ℹ NO APLICA pero SICUN cambió','c NO APLICA: '+r[1].result);
assert.strictEqual(r[2].result,'✔ VERIFICADO');
// …y la propia unidad que solo cambió en OTRO piso (CRC+PISO) no cuenta como "otra unidad": sigue ⚠ SIN CAMBIO
r=run(board([unidad(U1),unidad(U2)],[unidad(U1,null,'85.00'),unidad(U2)]),[fila('VAL_USO_CIIU',U1,'APLICA','2')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','c otro piso propio: '+r[0].result);assert(/otro piso cambió/.test(r[0].note),r[0].note);
console.log('ok c · propia unidad → como hoy (✔ / ℹ / ⚠ con otro piso propio)');

// (d) Renumeración: el CRC pedido no está en DESPUÉS (ni en ANTES: no encontrado) y en el lote aparece un CRC nuevo
r=run(board([unidad(U2)],[unidad(U2),unidad(U3)]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,T.OTRA,'d: '+r[0].result);assert.strictEqual(r[0].otraUnidad,'Posible renumeración: '+U3);
assert.strictEqual(T.pubResultado(r[0]),'◐ Cambió otra unidad del lote · Posible renumeración: '+U3);
// sin CRC nuevo pero con otra unidad cambiada: ? NO ENCONTRADO → ◐ otra unidad; sin cambios en el lote → sigue ? NO ENCONTRADO
r=run(board([unidad(U2)],[unidad(U2,'POSEEDOR')]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,T.OTRA);assert.strictEqual(r[0].otraUnidad,U2+' (UA · '+COND+')');
r=run(board([unidad(U2)],[unidad(U2)]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].result,'? NO ENCONTRADO');
console.log('ok d · renumeración → Posible renumeración: '+U3+' · no encontrado con otra unidad / sin cambios');

// Máx. 3 CRC en el detalle, luego "+N"
r=run(board([unidad(U1),unidad(U2),unidad(U3),unidad(U4),unidad(U5),unidad(U6)],[unidad(U1),unidad(U2,'X'),unidad(U3,'X'),unidad(U4,'X'),unidad(U5,'X'),unidad(U6,'X')]),[fila(VAL,U1,'APLICA')]);
assert.strictEqual(r[0].otraUnidad,[U2,U3,U4].map(function(k){return k+' (UA · '+COND+')';}).join(', ')+' +2');
console.log('ok máx. 3 CRC · +2');

// (e) Fila con ID de lote de 8 dígitos (Comas): el lote es ese ID con el UBIGEO del sector cargado. El cruce ya mira todo el lote:
//     un cambio de cualquier unidad sigue como hoy (◐ otro campo / ✔); solo cambia otra unidad en OTRO piso → ◐ otra unidad; nada → ⚠ sin cambio.
var ID='35007009';
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2,'POSEEDOR')]),[fila('VAL_USO_CIIU',ID,'APLICA','2'),fila(VAL,ID,'APLICA')]);
assert.strictEqual(r[0].result,'◐ CAMBIÓ OTRO CAMPO','e lote con cambio (otro campo): '+r[0].result);assert.strictEqual(r[1].result,'✔ VERIFICADO','e lote con cambio: '+r[1].result);
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2,null,'85.00')]),[fila('VAL_USO_CIIU',ID,'APLICA','2')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','e otro piso, campo no esperado (fix/otra-unidad-campos): '+r[0].result);assert.strictEqual(r[0].otraUnidad,'');assert.strictEqual(r[0].code,ID);
r=run(board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2)]),[fila('VAL_USO_CIIU',ID,'APLICA','2')]);
assert.strictEqual(r[0].result,'⚠ SIN CAMBIO EN SICUN','e nada: '+r[0].result);
// índice por lote: el ID de 8 dígitos se arma con el UBIGEO (lote de 14 dígitos)
var idx=T.c2lotIndex(BOARD_e(),[]);function BOARD_e(){return board([unidad(U1),unidad(U2)],[unidad(U1),unidad(U2)]);}
assert(idx.has(L)&&idx.get(L).A.size===2&&idx.get(L).B.size===2,'Map lote → CRC de ANTES y DESPUÉS');
console.log('ok e · ID de lote '+ID+' → lote '+L);

// Publicación: la fila ◐ otra unidad se publica (detalle en "resultado"), total aparte; no cuenta como verificado ni pendiente
var filas=[{result:'✔ VERIFICADO'},{result:'⚠ SIN CAMBIO EN SICUN'},{result:'? NO ENCONTRADO'},{result:T.OTRA,otraUnidad:U2+' (UA · '+COND+')'},{result:'⏸ Sin comparar (x)'}];
var c=T.pubCounts(filas);
assert.deepStrictEqual(JSON.parse(JSON.stringify(c)),{filas:4,verificado:1,otroCampo:0,sinCambio:1,noEncontrado:1,invalido:0,noAplicaConCambio:0,otraUnidad:1});
assert.strictEqual(T.pubPublica(filas[3]),true);
assert.strictEqual(T.pubResultado(filas[3]),'◐ Cambió otra unidad del lote · '+U2+' (UA · '+COND+')');
// Sin este caso, los totales son idénticos a los de antes (sin la clave otraUnidad) → "SICUN confirma" no cambia
var sin=T.pubCounts(filas.filter(function(f){return f.result!==T.OTRA;}));
assert(!('otraUnidad' in sin));assert.deepStrictEqual(JSON.parse(JSON.stringify(sin)),{filas:3,verificado:1,otroCampo:0,sinCambio:1,noEncontrado:1,invalido:0,noAplicaConCambio:0});
console.log('ok publicación · totales.otraUnidad aparte · sin el caso, totales idénticos');

// Publicación completa (pubPayload): mismas columnas por fila que siempre (el Apps Script descarta campos nuevos)
var P=vm.runInNewContext([cut('function txt(v){','function normVal'),cut('function c2bucket','\n'),cut('var PUB_LABELS','/* Prepara la publicación'),
  'function c2assign(r){return r;}function c2keys(){return [];}function c2resolve(row){return row.code;}function c2map(){return null;}function BOARD_(){return [{RES:{},A:{name:"a"},B:{name:"b"}}];}function c2events(){return [];}function fileDate(f){return {day:f.name==="a"?"2026-11-10":"2026-11-14"};}'].join('\n')+'\n({pubPayload:pubPayload});');
var pay=P.pubPayload('260210019',[{tecnico:'T',sheet:'S',validator:VAL,fi:'FI',code:U1,piso:'',state:'APLICA',result:T.OTRA,otraUnidad:U2+' (UA · '+COND+')',campos:'UA · '+COND,note:'',observation:''}],'clave',false);
assert.deepStrictEqual(Object.keys(pay.filas[0]),['poligono','tecnico','hoja','validador','fi','codigo','smz','piso','estado','resultado','campos','nota']);
assert.strictEqual(pay.filas[0].resultado,'◐ Cambió otra unidad del lote · '+U2+' (UA · '+COND+')');assert.strictEqual(pay.totales.otraUnidad,1);assert.strictEqual(pay.totales.verificado,0);
console.log('ok pubPayload · mismas columnas · resultado con detalle · sintaxis '+n+' <script>');
