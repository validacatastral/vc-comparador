'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {ctx,KEY,fila,cut,stubs,src}=require('./estado-final-helper');
const T=vm.runInNewContext(stubs+src+cut('function c2summary','/* Asignaciones locales')+cut('function c2sheets','\n')+cut('var PUB_COUNTS','function pubFields')+cut('var PUB_OTRO_CAMPO','function pubPayload')+
  '\n({set:function(b,f){BOARD=b;FILES=f;},rows:c2rows,compare:compareCtx,pub:pubResultado,counts:pubCounts,bucket:c2bucket,sheets:c2sheets,txt:c2reglasTxt,nivel:c2nivel,prefijo:c2prefijoNivel,niveles:REGLAS_NIVEL});');
const K='150110680440060102010015', hu=[KEY,'Código De Uso'], hc=[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'];
function uso(u,c,regla,antes,inicial){
 const ua=ctx('UA',hu,[[K,u]]), con=ctx('CON',hc,[[K,'1',c,'TERMINADO']]);
 if(antes){con.A.rows[0][hc[2]]=antes;con.RES=T.compare(con);}
 const row=fila('VAL_USO_CIIU',K,'APLICA','['+regla+']','1',{codigodeuso:u,codigodeactividadeconomicaciiu:inicial||c});
 T.set([ua,con],[{rows:[row]}]);return T.rows()[0];
}
const adv=uso('020199','4530','R8B','4711');
assert.match(adv.result,/^◐ Cambió, revisar: .*\(R8B\)/);assert.equal(adv.nivel,'ADVERTENCIA');assert.match(adv.result,/uso que corresponde: 020105/);
const antes=uso('020199','4530','R8B',null,'4711');assert.match(antes.result,/^◐ Cambió, revisar:/);assert.match(antes.note,/cambió antes de la descarga ANTES/);
const err=uso('020202','4530','R4A','4711');assert.match(err.result,/^◐ Cambió pero sigue mal: .*\(R4A\)/);assert.equal(err.nivel,'ERROR');
const mixto={reglas:['R8B','R4A']};assert.equal(T.nivel(mixto,'USO'),'ERROR');assert.match(T.prefijo(mixto,'USO')+T.txt(mixto,'USO'),/^◐ Cambió pero sigue mal: .*\(R4A\); .*\(R8B\)/);
assert.equal(T.nivel({reglas:['R99']},'USO'),'ERROR');
const h=[KEY,'Código De Uso','Clasificación Del Predio','Predio Catastral En','Tipo de Edificación'];
const ua=ctx('UA',h,[[K,'010101','CASA HABITACION','PREDIO INDEPENDIENTE','BLOCK']]);
const row=fila('VAL_COND_PREDIO_EN',K,'APLICA','[R12]','',{clasificaciondelpredio:'CASA HABITACION',prediocatastralen:'PREDIO INDEPENDIENTE',tipodeedificacion:'BLOCK',codigodeuso:'010101'});
T.set([ua],[{rows:[row]}]);const sin=T.rows()[0];assert.match(T.pub(sin),/^⚠ Sin cambio en SICUN · no se corrigió, revisar: .*\(R12\)/);assert.equal(sin.nivel,'ADVERTENCIA');
assert.equal(T.counts([adv,err]).sigueMal,2);assert.equal(T.bucket(sin.result),2);
const hoja=T.sheets([adv,err,sin],[])[0].aoa, col=hoja[0].indexOf('Nivel');assert.deepEqual(Array.from(hoja.slice(1),r=>r[col]),['ADVERTENCIA','ERROR','ADVERTENCIA']);
function codigos(seg,re){return new Set([...seg.matchAll(re)].map(m=>m[1]));}
const activos={TIT:codigos(cut('function c2titularReglas','function c2titularAplicables'),/push\('([A-Z]\d+[A-Z]?)'\)/g),USO:codigos(cut('var C2_USO=(function','var C2_COND=(function'),/H\("(R\d+[A-Z]?)"/g),COND:codigos(cut('var C2_COND=(function','var C2_OBRA=(function'),/add\("(R\d+[A-Z]?)"/g),OBR:codigos(cut('var C2_OBRA=(function','function c2usoCiiuFinal'),/c\s*:\s*"(R\d+[A-Z]?)"/g),CRC:codigos(cut('function c2crcFinal','var C2_FECHA=(function'),/push\('(R\d+[A-Z]?)'\)/g),FECHA:codigos(cut('function c2fechaPisoFinal','function c2estadoFinal'),/'(R\d+[A-Z]?)'/g)};
// R3D se excluye; R3C y R7 son falsos errores, no pendientes.
for(const r of ['R3D','R3C','R7'])activos.USO.delete(r);
for(const [g,rs] of Object.entries(activos))for(const r of rs)assert(['ERROR','ADVERTENCIA'].includes(T.niveles[g][r]),g+' '+r);
console.log('nivel-reglas: ok');
