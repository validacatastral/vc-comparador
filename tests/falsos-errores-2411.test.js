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
b=board(BC,['A','5','',''],['B','6','0','']);rs=cross(b,[{...titular,rawCode:BC,state:'APLICA'}]);assert.match(rs[0].result,/OTRO CAMPO/); // El cambio propio de Techo cuenta; el área sin contexto sigue filtrada.
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
// El área del bien común observado sí cuenta, incluso para FI.31.02.
for(const bc of ['150110060330100199999994','150110060600060199999990']){
 const areas=fila('VAL_CATEGORIAS-AREAS_2',bc,'APLICA','FI.31.02','1');
 const own=cross(board(bc,['A','5','',''],['A','6','','']),[areas])[0];
 assert.equal(own.result,'✔ VERIFICADO');assert.match(own.campos,/CON · Área Verificada/);
 const vecino=bc.slice(0,14)+'0101010010';
 const bcom=board(bc,['A','5','',''],['A','6','','']);
 bcom[0].A.rows.push({[KEY]:vecino,'Tipo de Documento':'X'});bcom[0].B.rows.push({[KEY]:vecino,'Tipo de Documento':'X'});bcom[0].RES=T.compareCtx(bcom[0]);
 const otro=cross(bcom,[fila('VAL_CATEGORIAS-AREAS_2',vecino,'APLICA','FI.31.02','1')])[0];
 assert(!/OTRA UNIDAD|VERIFICADO|CAMBIÓ/.test(otro.result),'bien común ajeno no cuenta: '+otro.result);
}
// DV aislado: solo el mensaje puede hacerlo relevante; nunca se pierde el CRC nuevo.
const oldDv='150110020260380101030017',newDv=oldDv.slice(0,23)+'8';
function tableroDv(){const c=ctx('UA',[KEY],[[oldDv]]);c.B.rows=[{[KEY]:newDv}];c.RES=T.compareCtx(c);c.RES.renombrados=[{de:oldDv,a:newDv,row:c.B.rows[0]}];return [c];}
for(const v of ['VAL_CRC','VAL_TITULAR_INSCRIPCION']){
 let x=cross(tableroDv(),[fila(v,oldDv,'NO APLICA','FI.02.04')])[0];assert.equal(x.result,'✔ NO APLICA CONFIRMADO');assert.equal(x.crcNuevo,newDv);assert.match(x.note,/Renombrado → 150110020260380101030018/);
 x=cross(tableroDv(),[fila(v,oldDv,'NO APLICA','Inconsistencia en dígito verificador')])[0];assert.match(x.result,/^ℹ NO APLICA/);assert.equal(x.crcNuevo,newDv);
 x=cross(tableroDv(),[{...fila(v,oldDv,'NO APLICA','FI.02.04'),observation:'revisar DV'}])[0];assert.equal(x.result,'✔ NO APLICA CONFIRMADO');
}
// FI.29.09: cinco lotes indicados, con CRC sintéticos de bien común y un campo observado a la vez.
const H29=[KEY,'N° Piso','ECC','Muros y Columna','Techo','Puertas y Ventanas'];
for(const ubicacion of ['22048001','22054001','23010006','23022008','23071010']){
 const bc='150110'+ubicacion+'0199999994',vecino='150110'+ubicacion+'0101010010';
 for(const campo of H29.slice(2))for(const state of ['APLICA','OTRO CAMBIO']){
  const vals=[bc,'1','A','A','A','A'],con=ctx('CON',H29,[vals]);
  con.B.rows[0][campo]='B';con.RES=T.compareCtx(con);
  const ua=ctx('UA',[KEY],[[bc],[vecino]]);
  const propia=fila('VAL_CATEGORIAS-AREAS_2',bc,state,'FI.29.09','1');
  const otras=fila('VAL_CATEGORIAS-AREAS_2',vecino,state,'FI.29.09','1');
  const [r,otro]=cross([ua,con],[propia,otras]);
  assert.equal(r.result,state==='APLICA'?'✔ VERIFICADO':'✔ CAMBIÓ',ubicacion+' '+campo+' '+state);
  assert.match(r.campos,new RegExp(campo.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert(!/OTRA UNIDAD|VERIFICADO|CAMBIÓ/.test(otro.result),'bien común ajeno: '+ubicacion+' '+campo+' '+otro.result);
 }
}
console.log('FI.29.09: cambios propios de ECC, muros, techo y puertas; bien común ajeno ignorado');
