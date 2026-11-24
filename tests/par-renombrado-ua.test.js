/* CRC renombrado (código o solo DV): los campos esperados se comparan entre el CRC viejo (Antes) y el nuevo (Después) en TODOS los reportes,
   aunque ese reporte no haya emparejado el par (varios renglones por CRC en TIT/CON/OBR) y aunque ningún reporte lo haya emparejado.
   Corre el motor real (compareCtx/findRenames/matchBlock/eqVal) + c2rows real, con stubs mínimos (sin DOM). Datos sintéticos con los CRC de los casos reales.
   Uso: node tests/par-renombrado-ua.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
var n=0;html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,function(_,code){n++;new vm.Script(code,{filename:'index.html<script '+n+'>'});});
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx});');

var KEY='Código de Referencia Catastral', COND='Condición del Titular', FORMA='Forma de Adquisición', TDOC='Tipo de Documento';
var HUA=[KEY,'Código Predial de Rentas','Tipo de Edificación','Área De Terreno Verificada (M2)','Código De Uso','Clasificación Del Predio','Número Municipal',COND,FORMA,TDOC,'Tipo de Partida Registral','Número de Partida Registral','Fecha de Adquisición','Nombre Backup'];
var HTIT=[KEY,'Tipo de Titular','Nro. Documento Identidad','Apellido Paterno','Apellido Materno','Nombres','% de Cotitular'];
var HCON=[KEY,'N° Piso','Área Verificada','Muros y Columna','Techo','Puertas y Ventanas'];
var HOBR=[KEY,'Código','Descripción','Producto Total','Unidad de Medida'];
function o(h,v){var r={};h.forEach(function(c,i){r[c]=v[i];});return r;}
function ua(k,cond,forma,doc,bk){return o(HUA,[k,'P'+k.slice(11,14),'CASA / CHALET','120.50','010101','PREDIO INDEPENDIENTE','123',cond,forma,doc,'PARTIDA ELECTRONICA','P0'+k.slice(11,14),'2001-05-10',bk]);}
/* Unidad k en una fecha: 1 renglón UA, 2 titulares, 2 pisos, 2 obras (TIT/CON/OBR no emparejan por findRenames: varios renglones por CRC).
   Mismos titulares/áreas/uso/N° municipal en todas las unidades del lote → la huella empata y no empareja (caso real: lo resuelve el par renombrado). */
function unidad(k,cond,forma,doc,bk){return {UA:[ua(k,cond,forma,doc,bk)],
  TIT:[o(HTIT,[k,'PERSONA NATURAL','40000001','PEREZ','LOPEZ','JUAN','50']),o(HTIT,[k,'PERSONA NATURAL','50000001','RAMOS','DIAZ','ANA','50'])],
  CON:[o(HCON,[k,'1','80.00','C','D','E']),o(HCON,[k,'2','60.00','C','D','E'])],
  OBR:[o(HOBR,[k,'0101','MURO PERIMETRICO','12.5','ML']),o(HOBR,[k,'0201','PORTON','2','UND'])]};}
function board(antes,despues){
  var b=[['UA',HUA],['TIT',HTIT],['CON',HCON],['OBR',HOBR]].map(function(p){var c={preset:{id:p[0],key:KEY},A:{headers:p[1],rows:[]},B:{headers:p[1],rows:[]}};
    antes.forEach(function(u){c.A.rows=c.A.rows.concat(u[p[0]]);});despues.forEach(function(u){c.B.rows=c.B.rows.concat(u[p[0]]);});c.RES=T.compareCtx(c);return c;});
  return b;
}
function fila(validator,code,state){return {tecnico:'TEC SINTETICO',polygon:'',sheet:validator,validator:validator,rawCode:code,partial:'',numeric:false,piso:'',state:state,observation:'',message:'',noState:false};}
function run(b,rows){T.set(b,[{rows:rows}]);return T.c2rows();}
function sinEliminado(r,msg){assert(!/\(registro (eliminado|nuevo)\)/.test(r.campos+' '+r.change+' '+r.note),msg+': '+r.campos+' ‖ '+r.change+' ‖ '+r.note);}
var BA='20261110_08_00', BB='20261116_08_00';

// Caso 1 real: 150112350070090101010013 → …012 (solo DV). Condición POSEEDOR→OTROS, Tipo de Documento ESCRITURA PÚBLICA→vacío.
var A1='150112350070090101010013', B1='150112350070090101010012';
// 1a) Un solo CRC en el lote: UA empareja el par (findRenames), TIT/CON/OBR no.
var b1=board([unidad(A1,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA)],[unidad(B1,'OTROS','POSESIÓN','',BB)]);
assert.strictEqual(b1[0].RES.renombrados.length,1,'UA empareja el par');
assert(b1.slice(1).every(function(c){return !c.RES.renombrados.length;}),'TIT/CON/OBR no emparejan (varios renglones)');
var r=run(b1,[fila('VAL_TITULAR_INSCRIPCION',A1,'APLICA'),fila('VAL_TITULAR_INSCRIPCION',B1,'APLICA'),fila('VAL_TITULARES',A1,'APLICA')]);
assert.strictEqual(r[0].result,'✔ CAMBIÓ (renombrado)','1a CRC viejo: '+r[0].result+' ‖ '+r[0].campos);
assert.strictEqual(r[0].campos,'UA · '+COND+' | UA · '+TDOC);
assert(/POSEEDOR → OTROS/.test(r[0].change)&&/ESCRITURA PÚBLICA → /.test(r[0].change),r[0].change);
assert(/DV recalculado por SICUN/.test(r[0].note)&&!/solo DV/.test(r[0].note),r[0].note);
sinEliminado(r[0],'1a');
assert.strictEqual(r[1].result,'✔ VERIFICADO','1a CRC nuevo');sinEliminado(r[1],'1a nuevo');
assert.strictEqual(r[2].result,'✔ CAMBIÓ (renombrado)','VAL_TITULARES: cambió UA · Condición del Titular (relacionado)');assert.strictEqual(r[2].campos,'UA · '+COND+' | UA · '+TDOC);sinEliminado(r[2],'1a VAL_TITULARES');
console.log('ok 1a · '+A1+' → '+B1+' · '+r[0].result+' · '+r[0].campos+' · nota: '+r[0].note);

// 1b) Lote con otra unidad idéntica (la huella empata) → pasa por el par renombrado y no por la huella.
var S1='150112350070090101020017', S1b='150112350070090101020016';
var b1b=board([unidad(A1,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA),unidad(S1,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA)],[unidad(B1,'OTROS','POSESIÓN','',BB),unidad(S1b,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BB)]);
r=run(b1b,[fila('VAL_TITULAR_INSCRIPCION',A1,'APLICA'),fila('VAL_TITULAR_INSCRIPCION',S1,'NO APLICA')]);
assert.strictEqual(r[0].result,'✔ CAMBIÓ (renombrado)','1b: '+r[0].result+' ‖ '+r[0].campos);assert.strictEqual(r[0].campos,'UA · '+COND+' | UA · '+TDOC);sinEliminado(r[0],'1b');
assert.strictEqual(r[1].result,'ℹ NO APLICA pero SICUN cambió','1b unidad vecina solo DV: '+r[1].campos+' ‖ '+r[1].change+' ‖ '+r[1].note);sinEliminado(r[1],'1b vecina');
console.log('ok 1b · huella empatada → '+r[0].result+' · '+r[0].campos);

// Caso 2 real: 150112350440030101010015 → …016. Condición POSEEDOR→OTROS, Forma POSESIÓN→OTROS, Tipo de Documento ESCRITURA PÚBLICA→vacío.
var A2='150112350440030101010015', B2='150112350440030101010016', S2='150112350440030101020011', S2b='150112350440030101020010';
// 2a) UA no empareja bien el par (además cambió Fecha/Partida; por parecido cruza con la vecina o no empareja) y la huella empata → par por el DV.
var u2a=unidad(A2,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA), u2b=unidad(B2,'OTROS','OTROS','',BB);u2b.UA[0]['Fecha de Adquisición']='';u2b.UA[0]['Número de Partida Registral']='';
var b2=board([u2a,unidad(S2,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA)],[u2b,unidad(S2b,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BB)]);
var ren2=b2[0].RES.renombrados.map(function(x){return x.de+'→'+x.a;});assert(ren2.indexOf(A2+'→'+B2)<0,'2a: UA no empareja bien el par: '+ren2.join(', '));
r=run(b2,[fila('VAL_TITULAR_INSCRIPCION',A2,'APLICA'),fila('VAL_TITULAR_INSCRIPCION',B2,'APLICA')]);
assert.strictEqual(r[0].result,'✔ CAMBIÓ (renombrado)','2a: '+r[0].result+' ‖ '+r[0].campos);
assert.strictEqual(r[0].campos,'UA · '+COND+' | UA · '+FORMA+' | UA · '+TDOC+' | UA · Número de Partida Registral | UA · Fecha de Adquisición');
assert(/También cambió: UA · Fecha de Adquisición/.test(r[0].note)&&/DV recalculado por SICUN/.test(r[0].note),r[0].note);
sinEliminado(r[0],'2a');assert.strictEqual(r[1].result,'✔ VERIFICADO','2a CRC nuevo');sinEliminado(r[1],'2a nuevo');
console.log('ok 2a · '+A2+' → '+B2+' (par por DV; UA emparejó: '+(ren2.join(', ')||'nada')+') · '+r[0].result+' · '+r[0].campos);
// 2b) Mismo caso con UA emparejado y unidad sola en el lote.
var b2b=board([unidad(A2,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA)],[unidad(B2,'OTROS','OTROS','',BB)]);
r=run(b2b,[fila('VAL_TITULAR_INSCRIPCION',A2,'APLICA')]);
assert.strictEqual(r[0].result,'✔ CAMBIÓ (renombrado)');assert.strictEqual(r[0].campos,'UA · '+COND+' | UA · '+FORMA+' | UA · '+TDOC);sinEliminado(r[0],'2b');
console.log('ok 2b · '+r[0].result+' · '+r[0].campos);

// 3) Cambio real en TIT/CON del par renombrado (no emparejado en esos reportes) se ve como celda, no como "(registro eliminado)".
var u3b=unidad(B2,'OTROS','OTROS','',BB);u3b.CON[1]['Área Verificada']='75.00';
r=run(board([unidad(A2,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA)],[u3b]),[fila('VAL_CATEGORIAS-AREAS',A2,'APLICA'),fila('VAL_TITULAR_INSCRIPCION',A2,'APLICA')]);
assert.strictEqual(r[0].result,'✔ CAMBIÓ (renombrado)','CON Área Verificada del par renombrado');assert(/CON · Área Verificada: 60.00 → 75.00/.test(r[0].change),r[0].change);sinEliminado(r[0],'3');
assert(/También cambió: CON · Área Verificada/.test(r[1].note),r[1].note);
console.log('ok 3 · CON del par renombrado → '+r[0].result+' · '+r[0].campos);

// 4) Renombre de CÓDIGO (no DV) emparejado en UA: TIT/CON/OBR se comparan contra el CRC nuevo.
var C4='150112350070090101010013', D4='150112350070090101020014';
function rekey(u,k){var o2={};Object.keys(u).forEach(function(rep){o2[rep]=u[rep].map(function(x){return Object.assign({},x,{'Código de Referencia Catastral':k});});});return o2;}
var u4=rekey(unidad(C4,'OTROS','POSESIÓN','',BA),D4);
r=run(board([unidad(C4,'POSEEDOR','POSESIÓN','ESCRITURA PÚBLICA',BA)],[u4]),[fila('VAL_TITULAR_INSCRIPCION',C4,'APLICA'),fila('VAL_CRC',C4,'APLICA')]);
assert.strictEqual(r[0].result,'✔ CAMBIÓ (renombrado)');assert.strictEqual(r[0].campos,'UA · '+COND+' | UA · '+TDOC);sinEliminado(r[0],'4');
assert.strictEqual(r[1].result,'✔ CAMBIÓ (renombrado)','VAL_CRC renombre de código');assert(/CRC (renombrado|cambió)/.test(r[1].campos+' '+r[1].change),r[1].change);
console.log('ok 4 · renombre de código → '+r[0].result+' · VAL_CRC '+r[1].result+' ('+r[1].campos+')');
