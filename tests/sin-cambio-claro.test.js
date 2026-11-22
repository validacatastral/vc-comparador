/* ⚠ Sin cambio / sigue mal: casos del paso 3 (a, b, c, d, sin tfin), qué hacer (REGLAS_ACCION) y CIIU esperado.
   Uso: node tests/sin-cambio-claro.test.js */
'use strict';
var assert=require('assert'),vm=require('vm');
var {ctx,KEY,fila,cut,stubs,src}=require('./estado-final-helper');
var html=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
var T=vm.runInNewContext(stubs+src+cut('var PUB_COUNTS','function pubFields')+cut('var PUB_OTRO_CAMPO','function pubPayload')+
  '\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,bucket:c2bucket,pubResultado:pubResultado,pubCounts:pubCounts,detalle:c2SinCambioDetalle,'+
  'RA:REGLAS_ACCION,RC:REGLAS_CORTAS,queHacer:c2queHacer,compareCtx:compareCtx});');
function run(b,r){T.set(b,[{rows:[r]}]);return T.c2rows()[0];}
var SM='◐ Cambió pero sigue mal: ', SC='⚠ Sin cambio en SICUN';
var K='150110680440060102010015';
var HUA=[KEY,'Código De Uso','Clasificación Del Predio','Predio Catastral En'], HCON=[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'];
function uso(u,ciiu,ecc){return [ctx('UA',HUA,[[K,u,'CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1',ciiu,ecc||'TERMINADO']])];}
function ini(u,ciiu){return {codigodeuso:u,codigodeactividadeconomicaciiu:ciiu};}
var MSG='[R4A] El CIIU no corresponde al uso';

// (a) incumple y cambió antes del ANTES → ◐ sigue mal (bucket 8), con nota y "debería ser"
var a=run(uso('050101','4711'),fila('VAL_USO_CIIU',K,'APLICA',MSG,'1',ini('050101','4520')));
assert(a.result.indexOf(SM+'CIIU no corresponde al uso (R4A)')===0,a.result);
assert.strictEqual(T.bucket(a.result),8);assert(/cambió antes de la descarga ANTES/.test(a.note),a.note);
assert.strictEqual(a.paso3.caso,'cambioAntes');assert.strictEqual(T.pubResultado(a),a.result);
console.log('ok a · '+a.result);

// (b) incumple y NO cambió → ⚠ (bucket 2) "no se corrigió, sigue mal"
var b=run(uso('050101','4711'),fila('VAL_USO_CIIU',K,'APLICA',MSG,'1',ini('050101','4711')));
assert.strictEqual(b.result,'⚠ SIN CAMBIO EN SICUN');assert.strictEqual(T.bucket(b.result),2);assert.strictEqual(b.paso3.caso,'sigueMal');
var tb=T.pubResultado(b);
assert(tb.indexOf(SC+' · no se corrigió, sigue mal: CIIU no corresponde al uso (R4A)')===0,tb);
console.log('ok b · '+tb);

// R4A: "debería ser:" con ≤3 CIIU del catálogo; sin CIIU actual, sin uso de la fila, sin "Uso del … en el glosario"
[a.result,tb].forEach(function(t){
  var m=t.split(' · debería ser: ');assert.strictEqual(m.length,2,t);
  var codigos=m[1].match(/\b\d{4}\b/g)||[];assert(codigos.length>=1&&codigos.length<=3,t);
  assert.deepStrictEqual(codigos,['8510','8521'],t);assert(/8510 Enseñanza preprimaria y primaria o 8521 Enseñanza secundaria de formación general/.test(t),t);
  assert(t.indexOf('4711')<0&&t.indexOf('050101')<0&&!/Educación inicial/i.test(t)&&!/glosario/i.test(t),t);
  assert(!/qué hacer/.test(t),'R4A con esperado no repite la acción genérica: '+t);
});
// > 3 CIIU → 3 primeros + "(ver catálogo)"; descripción corta
var muchos=T.queHacer({reglas:['R4A'],esperado:[{ciiu:'4711',desc:'Venta al por menor en comercios no especializados con predominio'},{ciiu:'4719',desc:'Uno'},{ciiu:'4721',desc:'Dos'},{ciiu:'4722',desc:'Tres'}]},'USO');
assert.strictEqual(muchos,' · debería ser: 4711 Venta al por menor en comercios, 4719 Uno o 4721 Dos (ver catálogo)');

// (c) cumple y NO cambió → ⚠ (bucket 2) posible falso error
var c=run(uso('050101','8510'),fila('VAL_USO_CIIU',K,'APLICA',MSG,'1',ini('050101','8510')));
assert.strictEqual(c.result,'⚠ SIN CAMBIO EN SICUN');assert.strictEqual(c.paso3.caso,'falsoError');
assert.strictEqual(T.pubResultado(c),SC+' · el dato ya cumple la regla: posible falso error, si es así marcar NO APLICA');
console.log('ok c · '+T.pubResultado(c));

// (d) cumple y cambió → ✔ CUMPLE EN SICUN
var d=run(uso('050101','8510'),fila('VAL_USO_CIIU',K,'APLICA',MSG,'1',ini('050101','4711')));
assert.strictEqual(d.result,'✔ CUMPLE EN SICUN');assert.strictEqual(T.bucket(d.result),0);
console.log('ok d · ✔ CUMPLE EN SICUN');

// sin tfin (validador sin reglas) → texto de siempre
var HUP=[KEY,'Código De Uso'];
var s=run([ctx('UA',HUP,[[K,'010101']])],fila('VAL_USO_PISO',K,'APLICA','uso del piso','',{}));
assert.strictEqual(s.result,'⚠ SIN CAMBIO EN SICUN');assert(!s.paso3,'sin tfin no guarda paso3');
var ts=T.pubResultado(s);assert(ts.indexOf(SC)===0&&/ — revisa que se haya guardado$/.test(ts),ts);
console.log('ok sin tfin · '+ts);

// totales: (a) cuenta en sigueMal y no en sinCambio; b y c en sinCambio
var t=T.pubCounts([a,b,c,d,s]);
assert.strictEqual(t.sigueMal,1);assert.strictEqual(t.sinCambio,3);assert.strictEqual(t.verificado,1);
console.log('ok totales · sigueMal '+t.sigueMal+' · sinCambio '+t.sinCambio);

// Una observación anterior puede seguir citando R3D.
var obra=uso('050101','8510','02 - EN CONSTRUCCIÓN');
var sinCambio=run(obra,fila('VAL_USO_CIIU',K,'APLICA','[R3D]','1',ini('050101','8510')));
assert.strictEqual(T.pubResultado(sinCambio),T.pubResultado(c));
var corregida=run(obra,fila('VAL_USO_CIIU',K,'APLICA','[R3D]','1',ini('050101','4711')));
assert.strictEqual(corregida.result,'✔ CUMPLE EN SICUN');
for(const mensaje of ['[R3D] [R4A]','[R3D]','Revisar CIIU']){
  var mixta=run(uso('050101','4711','INCONCLUSA'),fila('VAL_USO_CIIU',K,'APLICA',mensaje,'1',ini('050101','4711')));
  assert.strictEqual(T.pubResultado(mixta),tb);
  assert.doesNotMatch(mixta.note,/R3D|Ojo, además/);
}

// varias reglas: una acción por regla, separadas por "; ", sin repetir
assert.strictEqual(T.queHacer({reglas:['R3B','R8C','R1']},'USO'),' · qué hacer: declarar el CIIU o sustentar en Observaciones; registrar el Código de Uso');
assert.strictEqual(T.queHacer({reglas:['R5']},'TIT'),' · qué hacer: poner condición POSEEDOR o cambiar la forma');
assert.strictEqual(T.queHacer({reglas:['R99']},'USO'),'');

// catálogo REGLAS_ACCION: mismos validadores que REGLAS_CORTAS, sin dígitos, ≤ ~8 palabras
assert.deepStrictEqual(Object.keys(T.RA).sort(),Object.keys(T.RC).sort());
for(const [g,cat] of Object.entries(T.RA))for(const [k,v] of Object.entries(cat)){
  assert(!/\d/.test(v),g+' '+k+' lleva dígitos: '+v);assert(!/;/.test(v),g+' '+k+' usa ";"');
  assert(v.split(/\s+/).length<=9,g+' '+k+' muy largo: '+v);assert(/^\S.*\S$/.test(v),g+' '+k);
}
// toda regla activa de cada validador tiene acción
function codigos(seg,re){return new Set([...seg.matchAll(re)].map(m=>m[1]));}
var activos={
  TIT:codigos(cut('function c2titularReglas','function c2titularAplicables'),/push\('([A-Z]\d+[A-Z]?)'\)/g),
  USO:codigos(cut('var C2_USO=(function','var C2_COND=(function'),/H\("(R\d+[A-Z]?)"/g),
  COND:codigos(cut('var C2_COND=(function','var C2_OBRA=(function'),/add\("(R\d+[A-Z]?)"/g),
  OBR:codigos(cut('var C2_OBRA=(function','function c2usoCiiuFinal'),/c\s*:\s*"(R\d+[A-Z]?)"/g),
  CRC:codigos(cut('function c2crcFinal','var C2_FECHA=(function'),/push\('(R\d+[A-Z]?)'\)/g),
  FECHA:codigos(cut('function c2fechaPisoFinal','function c2estadoFinal'),/'(R\d+[A-Z]?)'/g)
};
activos.USO.delete('R3D'); // excluida por decisión de Diego
for(const [g,set] of Object.entries(activos)){assert(set.size>0,g);for(const k of set)assert(T.RA[g]&&T.RA[g][k],g+' '+k+' sin acción');}

// prefijos y Excel con el mismo texto que se publica
assert(html.includes("var C2_SIGUE_MAL='◐ Cambió pero sigue mal: ';"));
assert(/c2bucket\(r\.result\)===2\?c2SinCambioDetalle\(r\):r\.result,r\.change/.test(cut('function c2sheets(','\n')));
console.log('sin-cambio-claro: ok');
