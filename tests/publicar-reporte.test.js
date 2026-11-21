'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function cut(from,to){
  const a=html.indexOf(from), b=html.indexOf(to,a);
  assert(a>=0&&b>a,from);
  return html.slice(a,b);
}
const t=vm.createContext({setTimeout});
vm.runInContext([
  cut('function stripAccents','function normVal'),cut('function c2norm','function c2header'),
  cut('function c2campo','\n'),cut('function mzKeyOf','\n'),cut('function normKey','\n'),
  cut('function reportSheets','function exportMarked'),cut('function c2bucket','/* Asignaciones'),
  cut('function c2sheets','(function(){var original=writeStyledWorkbook'),
  cut('function c2enmascarar','function loadReviewerFiles'),
  cut('var LOTE_ESPERAS','/* Resumen del distrito')
].join('\n'),t);
const mask=t.c2enmascarar, dni='01234365', ruc=20123456365, crc='150110010020030101010015', lote='01002003';
assert.equal(mask('Nro. Documento Identidad',dni),'•••••365');
assert.equal(mask(' R.U.C. ',ruc),'•••••365');
for(const blank of [null,undefined,''])assert.equal(mask('RUC',blank),blank);
for(const h of ['Observación','Mensaje validador','Qué cambió','Observación vs Antes → Después','Notas']){
  assert.equal(mask(h,'DNI '+dni+', RUC '+ruc+' / 123456789 / A'+dni),'DNI •••365, RUC •••365 / 123456789 / A'+dni);
}
for(const h of ['CRC','Código de Referencia Catastral','ID_LOTE','Código (CRC/ID_LOTE)','Código del Lote',
  'Código Predial de Rentas','Código Contribuyente de Rentas','Código Interesado','Sec-Mz-Lt']){
  assert.equal(mask(h,crc),crc);assert.equal(mask(h,lote),lote);
}

const headers=['CRC','Nro Documento Identidad','RUC','ID_LOTE','Observación'];
const row=Object.fromEntries(headers.map((h,i)=>[h,[crc,dni,ruc,lote,'DNI '+dni][i]]));
const side={name:'sintético',headers,rows:[row,{...row,CRC:'150110990020030101010015'}]};
const source={preset:{key:'CRC',nombre:'TIT'},A:side,B:side};
t.backupStamp=t.sicunStamp=()=>'';
t.compareCtx=ctx=>{
  assert.deepEqual(ctx.B.rows.map(r=>r.CRC),[crc]);
  const group={key:crc,rows:[{row}]};
  return {key:'CRC',diffCols:headers.slice(1),comun:1,sinCambio:0,fieldCount:{},renombrados:[],
    nuevos:[group],eliminados:[group],mods:[{key:crc,cambios:[
      {tipo:'celda',campo:'RUC',antes:ruc,despues:ruc},{tipo:'add',row}]}]};
};
const reviewer={polygon:'P1',code:lote,validator:'VAL',observation:'DNI '+dni};
const file={polygon:'P1',name:'revisor',sheets:[],totals:{}};
const report=t.pubReporteDatos(source,{keys:new Set(['01|002'])},'P1',[reviewer],[file]);
const sheets=report();
assert.equal(Array.from(sheets,s=>s.name).join(','),'RESUMEN,MODIFICADOS,NUEVOS,ELIMINADOS,RENOMBRADOS,CRUCE_REVISOR,CRUCE_RESUMEN');
assert(!JSON.stringify(sheets).includes(dni));assert(!JSON.stringify(sheets).includes(String(ruc)));
assert.deepEqual(Array.from(sheets[2].aoa[1]),[crc,'•••••365','•••••365',lote,'DNI •••365']);
assert.equal(sheets[5].aoa[1][5],lote);
assert.equal(sheets[5].aoa[1][10],'DNI •••365');
assert.equal(source.B.rows.length,2);
const local=t.reportSheets({...source,RES:t.compareCtx({...source,B:{rows:[row]}})},false);
assert.equal(local[2].aoa[1][1],dni);assert.equal(reviewer.observation,'DNI '+dni);

(async function(){
  const posts=[],codes=['P1','P2','P3'];
  t.xlWorkbook=()=> 'eGxzeA==';
  t.pubPost=async (url,data)=>{posts.push(data);if(data.poligono==='P1')throw Error('sin espacio');};
  const done=await t.loteCorrer(codes,code=>({code,estado:'listo',payload:{poligono:code,k:'prueba'},reporte:report}),
    p=>{if(p.poligono==='P3')throw Error('Clave inválida');},null,null,(p,r)=>t.pubSubirReporte('/exec',p,r));
  assert.deepEqual(JSON.parse(JSON.stringify(posts)),codes.slice(0,2).map(poligono=>({
    accion:'publicarReporte',k:'prueba',poligono,nombre:'reporte_'+poligono+'.xlsx',base64:'eGxzeA=='
  })));
  assert.equal(done[0].publicado,true);assert.match(done[0].aviso,/sin espacio/);
  assert.equal(done[0].intentos,1);assert.equal(done[1].publicado,true);assert.equal(done[2].estado,'omitido');
  console.log('ok · siete hojas, DNI/RUC y textos enmascarados, códigos intactos, exportación local y fallo aislado por polígono');
})().catch(e=>{console.error(e);process.exitCode=1;});
