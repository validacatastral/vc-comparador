'use strict';
const assert=require('node:assert/strict');
const {T,ctx,KEY,fila}=require('./estado-final-helper');
const K='150110150180390101010013', BC='150110230440010199999995';
const H=[KEY,'N° Piso','Techo','Área Verificada','% de Bien Común - Área','Código De Actividad Económica (CIIU)'];
function board(code,before,after){const c=ctx('CON',H,[]);c.A.rows=[Object.fromEntries(H.map((h,i)=>[h,[code,'1',...before][i]]))];c.B.rows=[Object.fromEntries(H.map((h,i)=>[h,[code,'1',...after][i]]))];c.RES=T.compareCtx(c);const u=ctx('UA',[KEY,'Tipo de Documento'],[[code,'ESCRITURA PÚBLICA']]);return [u,c];}
function cross(b,rows){T.set(b,[{rows}]);return T.c2rows();}
const titular=fila('VAL_TITULAR_INSCRIPCION',K,'OTRO CAMBIO','','1');
const techo=fila('VAL_PISO_CATEGORIA_TECHO',K,'NO APLICA','','1');
let b=board(K,['A','5','',''],['B','5','','']);
let rs=cross(b,[titular,techo]);assert.match(rs.find(r=>r.validator===titular.validator).result,/SIN CAMBIO/);assert.match(rs.find(r=>r.validator===techo.validator).result,/NO APLICA pero SICUN cambió/);
let no={...titular,state:'NO APLICA'};rs=cross(b,[no,techo]);assert.match(rs.find(r=>r.validator===no.validator).result,/NO APLICA CONFIRMADO/);assert.match(rs.find(r=>r.validator===no.validator).note,/atribuido a VAL_PISO_CATEGORIA_TECHO/);
b=board(K,['A','5','',''],['A','6','0','']);rs=cross(b,[{...titular,state:'APLICA'}]);assert(!/OTRO CAMPO/.test(rs[0].result));
b=board(BC,['A','5','',''],['B','6','0','']);rs=cross(b,[{...titular,rawCode:BC,state:'APLICA'}]);assert(!/OTRO CAMPO|VERIFICADO|CAMBIÓ/.test(rs[0].result));
const ua=ctx('UA',[KEY,'Tipo de Documento'],[[K,'ESCRITURA PÚBLICA']]);ua.B.rows=[{[KEY]:K,'Tipo de Documento':''}];ua.RES=T.compareCtx(ua);rs=cross([ua],[{...titular,state:'NO APLICA'}]);assert.match(rs[0].result,/NO APLICA pero SICUN cambió/);
console.log('atribución, área, bien común y valor a vacío: ok');
// Eliminación completa de UA: no se ejecuta la regla final sobre la fila que ya no existe.
const gone=ctx('UA',[KEY,'Tipo de Documento'],[[K,'ESCRITURA PÚBLICA']]);gone.B.rows=[];gone.RES=T.compareCtx(gone);
for(const state of ['APLICA','OTRO CAMBIO','NO APLICA']){const v=cross([gone],[{...titular,state}])[0];assert(v, state);assert.match(v.result,state==='NO APLICA'?/^ℹ NO APLICA/:/^✔ CAMBIÓ \(eliminado\)/);}
// Un CRC renombrado se vuelve a validar; el borrado no se evalúa contra otra unidad.
const nuevo='150110150180390101020016',dv=K.slice(0,23)+'9';
const HT=[KEY,'Condición del Titular','Forma de Adquisición','Tipo de Documento','Tipo de Partida Registral','Número de Partida Registral'];
function renombrar(to,doc){const c=ctx('UA',HT,[[K,'POSEEDOR','OTROS','ESCRITURA PÚBLICA','','']]);c.B.rows=[{[KEY]:to,'Condición del Titular':'POSEEDOR','Forma de Adquisición':'OTROS','Tipo de Documento':doc,'Tipo de Partida Registral':'','Número de Partida Registral':''}];c.RES=T.compareCtx(c);c.RES.renombrados=[{de:K,a:to,row:c.B.rows[0]}];return c;}
const titR2=fila('VAL_TITULAR_INSCRIPCION',K,'APLICA','[R2P] Tipo de Documento');
let rr=cross([renombrar(nuevo,'ESCRITURA PÚBLICA')],[titR2])[0];assert.match(rr.result,/^◐ Cambió pero sigue mal: .*\(R2P\)/);
rr=cross([renombrar(nuevo,'')],[titR2])[0];assert.equal(rr.result,'✔ CAMBIÓ (renombrado)');
rr=cross([renombrar(dv,'ESCRITURA PÚBLICA')],[titR2])[0];assert(!/CAMBIÓ \(renombrado\)|OTRO CAMPO/.test(rr.result));
rr=cross([renombrar(dv,'')],[{...titR2,state:'NO APLICA'}])[0];assert.match(rr.result,/^ℹ NO APLICA/);
