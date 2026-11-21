/* Reglas acordadas en la revisión de Comas: mapa por FI del mensaje (CAMPOS_POR_FI), VAL_PRODUCTO, VAL_COND_PREDIO_EN,
   VAL_USO_CIIU (nota 020304) y sufijo _N genérico. La lógica de marcas (c2classify) no cambia. Datos sintéticos.
   Uso: node tests/reglas-comas.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('function toNum','function eqVal'),cut('function normKey','\n'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2rows(){'),cut('function c2rows(){','function c2summary'),
  cut('function c2bucket','function c2summary'),cut('var PUB_LABELS','/* Prepara la publicación')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,c2map:c2map,c2mapRow:c2mapRow,c2val:c2val,M:CAMPOS_VALIDADOR,FI:CAMPOS_POR_FI,pubResultado:pubResultado});');

var KEY='Código de Referencia Catastral', PISO='N° Piso', CODE='150112190370070101010015';
function ctx(id,cambios,headersB,rowB){var a={},b=Object.assign({},rowB||{});a[KEY]=CODE;a[PISO]='1';b[KEY]=CODE;b[PISO]='1';
  return {preset:{id:id,key:KEY},A:{headers:[KEY,PISO],rows:[a]},B:{headers:[KEY,PISO].concat(headersB||[]),rows:[b]},
    RES:{mods:cambios.length?[{key:CODE,cambios:cambios.map(function(f){return {tipo:'celda',campo:f,antes:'x',despues:'y',filaA:2,filaB:2};})}]:[],nuevos:[],eliminados:[],renombrados:[],diffCols:[]}};}
function fila(validator,state,message){return {tecnico:'TEC SINTETICO',polygon:'',sheet:validator,validator:validator,rawCode:CODE,partial:'',numeric:false,piso:'1',state:state,observation:'',message:message||'',noState:false};}
function run(board,row){T.set(board,[{rows:[row]}]);var out=T.c2rows();assert.strictEqual(out.length,1);return out[0];}
var M2909='VAL_CATEGORIAS-AREAS_2: Verificar, ECC y categorías constructivas (FI.29.09)';
var M3102='VAL_CATEGORIAS-AREAS_2: Verificar, área construida (FI.31.02)';

// (a) CATEGORIAS-AREAS_2 + FI.29.09 + cambio CON · ECC → ✔ VERIFICADO
var a=run([ctx('CON',['ECC'])],fila('VAL_CATEGORIAS-AREAS_2','APLICA',M2909));
assert.strictEqual(a.result,'✔ VERIFICADO');assert(/CON · ECC/.test(a.expected));
console.log('ok a · FI.29.09 + ECC → '+a.result);

// (b) igual pero solo cambia ECS: APLICA → ◐ otro campo; OTRO CAMBIO → ✔ CAMBIÓ
var b1=run([ctx('CON',['ECS'])],fila('VAL_CATEGORIAS-AREAS_2','APLICA',M2909));
assert.strictEqual(b1.result,'◐ CAMBIÓ OTRO CAMPO');
var b2=run([ctx('CON',['ECS'])],fila('VAL_CATEGORIAS-AREAS_2','OTRO CAMBIO',M2909));
assert.strictEqual(b2.result,'✔ CAMBIÓ');
console.log('ok b · FI.29.09 solo ECS → APLICA '+b1.result+' · OTRO CAMBIO '+b2.result);

// (c) FI.31.02 + Área Verificada → ✔; y con FI.29.09 la misma Área no es observada (◐). Mensaje con ambas reglas → unión.
var c=run([ctx('CON',['Área Verificada'])],fila('VAL_CATEGORIAS-AREAS_2','APLICA',M3102));
assert.strictEqual(c.result,'✔ VERIFICADO');
assert.strictEqual(run([ctx('CON',['Área Verificada'])],fila('VAL_CATEGORIAS-AREAS_2','APLICA',M2909)).result,'◐ CAMBIÓ OTRO CAMPO');
var u=T.c2mapRow(fila('VAL_CATEGORIAS-AREAS_2','APLICA',M2909+' | '+M3102));
assert.deepStrictEqual(JSON.parse(JSON.stringify(u.observados)),{CON:['ECC','Muros y Columna','Techo','Puertas y Ventanas','Área Verificada']});
assert.strictEqual(run([ctx('CON',['Área Verificada'])],fila('VAL_CATEGORIAS-AREAS_2','APLICA',M2909+' | '+M3102)).result,'✔ VERIFICADO');
// sin FI en el mensaje → mapa por nombre como antes; otra hoja con mapa propio no toma el FI (VAL_MEP_MEDIDA_PRODUCTO cita FI.29.09)
assert.strictEqual(T.c2mapRow(fila('VAL_CATEGORIAS-AREAS_2','APLICA','')),T.M['VAL_CATEGORIAS-AREAS']);
assert.strictEqual(T.c2mapRow(fila('VAL_MEP_MEDIDA_PRODUCTO','APLICA','Verificar MEP (FI.29.09)')),T.M.VAL_MEP_MEDIDA_PRODUCTO);
assert.strictEqual(T.c2mapRow(fila('VAL_HOJA_NUEVA','APLICA','algo (FI.24.03)')),T.FI['FI.24.03']);
console.log('ok c · FI.31.02 + Área Verificada → '+c.result+' · unión de FI y respaldo por nombre');

// (d) USO_CIIU cambia CIIU → ✔
var d=run([ctx('CON',['Código De Actividad Económica (CIIU)'])],fila('VAL_USO_CIIU','APLICA','CIIU no debe estar vacío'));
assert.strictEqual(d.result,'✔ VERIFICADO');
console.log('ok d · USO_CIIU CIIU → '+d.result);

// (e) USO_CIIU OTRO CAMBIO + cambia UA · Código De Uso → ✔ CAMBIÓ
var e=run([ctx('UA',['Código De Uso'])],fila('VAL_USO_CIIU','OTRO CAMBIO','CIIU no debe estar vacío'));
assert.strictEqual(e.result,'✔ CAMBIÓ');
console.log('ok e · USO_CIIU OTRO CAMBIO + Código De Uso → '+e.result);

// (f) USO_CIIU sin cambio y uso 020304 en el DESPUÉS → ⚠ con nota; otro uso → sin nota
var f=run([ctx('UA',[],['Código De Uso'],{'Código De Uso':'020304'}),ctx('CON',[])],fila('VAL_USO_CIIU','APLICA','CIIU no debe estar vacío'));
assert.strictEqual(f.result,'⚠ SIN CAMBIO EN SICUN');assert(/debería ser NO APLICA \(comercial no identificado no lleva CIIU\)/.test(f.note),f.note);
var f2=run([ctx('UA',[],['Código De Uso'],{'Código De Uso':'010101'}),ctx('CON',[])],fila('VAL_USO_CIIU','APLICA','CIIU no debe estar vacío'));
assert.strictEqual(f2.result,'⚠ SIN CAMBIO EN SICUN');assert(!/NO APLICA/.test(f2.note));
assert(!/020304/.test(f.note+f.campos),'sin valores SICUN en la nota');
console.log('ok f · USO_CIIU 020304 → '+f.result+' · nota: '+f.note);

// (g) VAL_PRODUCTO cambia Producto Total → ✔; solo MEP con APLICA → ◐
var g=run([ctx('OBR',['Producto Total'])],fila('VAL_PRODUCTO','APLICA','Verificar producto de obra complementaria'));
assert.strictEqual(g.result,'✔ VERIFICADO');
var g2=run([ctx('OBR',['MEP'])],fila('VAL_PRODUCTO','APLICA','Verificar producto de obra complementaria'));
assert.strictEqual(g2.result,'◐ CAMBIÓ OTRO CAMPO');
console.log('ok g · VAL_PRODUCTO Producto Total → '+g.result+' · solo MEP → '+g2.result);

// (h) VAL_COND_PREDIO_EN cambia Predio Catastral En → ✔
var h=run([ctx('UA',['Predio Catastral En'])],fila('VAL_COND_PREDIO_EN','APLICA','La clasificación del predio no coincide con predio catastral en (FI.24.03)'));
assert.strictEqual(h.result,'✔ VERIFICADO');
var MCP='La clasificación del predio no coincide con predio catastral en (FI.24.03)';
var h2=run([ctx('UA',['Código De Uso'])],fila('VAL_COND_PREDIO_EN','APLICA',MCP)), h3=run([ctx('UA',['Descripción Del Uso'])],fila('VAL_COND_PREDIO_EN','OTRO CAMBIO',MCP));
assert.strictEqual(h2.result,'◐ CAMBIÓ OTRO CAMPO');assert.strictEqual(h3.result,'✔ CAMBIÓ');
console.log('ok h · VAL_COND_PREDIO_EN Predio Catastral En → '+h.result+' · solo uso: APLICA '+h2.result+' · OTRO CAMBIO '+h3.result);

// (i) sufijo _N genérico
assert.strictEqual(T.c2map('VAL_TITULARES_3'),T.M.VAL_TITULARES);
assert.strictEqual(T.c2map('VAL_TITULARES_4'),T.M.VAL_TITULARES);
assert.strictEqual(T.c2val('VAL_TITULARES_4'),'VAL_TITULARES');
assert.strictEqual(T.c2map('VAL_CATEGORIAS-AREAS_2'),T.M['VAL_CATEGORIAS-AREAS']);
assert.strictEqual(T.c2map('VAL_USO_CIIU_2'),T.M.VAL_USO_CIIU);
assert.strictEqual(T.c2map('VAL_INEXISTENTE_2'),null);
console.log('ok i · VAL_TITULARES_3/4, CATEGORIAS-AREAS_2, USO_CIIU_2 → mapa base');

// (j) aviso ◐ publicado usa el mapa de la fila (FI del mensaje), no el del nombre de hoja
var j=run([ctx('CON',['ECS'])],fila('VAL_CATEGORIAS-AREAS_2','APLICA',M2909)), pj=T.pubResultado(j);
assert.strictEqual(j.result,'◐ CAMBIÓ OTRO CAMPO');
assert(/se esperaba: CON · ECC/.test(pj),pj);assert(!/Área Verificada/.test(pj),pj);
console.log('ok j · pubResultado FI.29.09 solo ECS → '+pj);
