// Desde la columna de Excel hasta la hoja CRUCE_REVISOR y la selección de publicación.
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {cut,stubs,src,ctx,KEY,run}=require('./estado-final-helper');
const archivo=vm.runInNewContext(stubs+src+'\n'+[
  cut('function c2state','function c2files'),
  cut('function c2summary','\n'),cut('function c2sheets','\n'),cut('var PUB_LABELS','/* Prepara la publicación'),
  cut('function pubPendientes','\n'),
  'function c2assign(rows){return rows;} function fileDate(){return {day:"2026-11-01"};}',
  '({leer:c2read,hojas:c2sheets,publica:pubPublica,payload:pubPayload,pendientes:pubPendientes,setBoard:b=>{BOARD=b;}})'
].join('\n'),{XLSX:{utils:{decode_range:ref=>({s:{r:0},e:{r:1,c:ref.split(':')[1].charCodeAt(0)-65}}),encode_cell:({r,c})=>String.fromCharCode(65+c)+(r+1)}}});
function leer(val,cabecera,valor,estado='APLICA',partes={}){
  const ws={'!ref':'A1:'+String.fromCharCode(66+Object.keys(partes).length)+'2'};
  [[cabecera,'Estado',...Object.keys(partes)],[valor,estado,...Object.values(partes)]].forEach((fila,i)=>fila.forEach((v,j)=>{
    ws[String.fromCharCode(65+j)+(i+1)]={t:typeof v==='number'?'n':'s',w:String(v)};
  }));
  return archivo.leer({SheetNames:[val],Sheets:{[val]:ws}},'sintetico.xlsx');
}
const clave='000001010010010101010011', lote=clave.slice(6,14);
const b=[ctx('UA',[KEY],[[clave]])],nota='CRC ilegible en el Excel (no tiene 24 dígitos) — revisar el archivo';
archivo.setBoard(b);
for(const val of ['VAL_CRC','VAL_TITULAR_INSCRIPCION']){
  for(const valor of [clave.slice(1),clave.slice(0,-2),'1.234E+23',1.234e23,lote]){
    for(const estado of ['APLICA','OTRO CAMBIO','NO APLICA']){
      const f=leer(val,'CRC',valor,estado),r=run(b,f.rows[0]);
      assert.equal(r.result,'? NO ENCONTRADO');
      assert.equal(r.note,nota);
      assert.equal(archivo.publica(r),true);
      const envio=archivo.payload('260000001',[r],'prueba',false);
      assert.deepEqual(Array.from(envio.filas,f=>f.resultado),['? NO ENCONTRADO']);
      assert.equal(envio.filas[0].nota,'');
      assert.equal(envio.totales.noEncontrado,1);
      assert.equal(archivo.pendientes(envio.totales),1);
      const [detalle]=archivo.hojas([r],[f]);
      assert.equal(detalle.name,'CRUCE_REVISOR');
      assert.equal(detalle.aoa[1][detalle.aoa[0].indexOf('Nota')],nota);
    }
  }
}
assert.notEqual(run(b,leer('VAL_CRC','ID_LOTE',lote).rows[0]).result,'? NO ENCONTRADO');
assert.notEqual(run(b,leer('VAL_CRC','CRC',clave).rows[0]).note,nota);

const partes={SECTOR:'1',MZ:'1',LOTE:'1',EDIF:'1',ENTRADA:'1',PISO:'1',UNIDAD:'1'};
const directo=run(b,leer('VAL_CRC','CRC',clave).rows[0]);
for(const valor of [clave.slice(1),lote,'1.23E+23',1.23e23]){
  const fila=leer('VAL_CRC','CRC',valor,'APLICA',partes).rows[0];
  assert.equal(fila.partial,clave.slice(6,23));
  const recuperada=run(b,fila);
  assert.equal(recuperada.code,clave);
  assert.equal(recuperada.crcIlegible,false);
  assert.equal(recuperada.result,directo.result);
  assert.equal(recuperada.note,directo.note);
}
const sinUnidad=leer('VAL_CRC','CRC',clave.slice(1),'APLICA',{...partes,UNIDAD:'2'}).rows[0];
assert.equal(run(b,sinUnidad).note,nota);
assert.equal(archivo.publica(run(b,sinUnidad)),true);
const ambiguo=[ctx('UA',[KEY],[[clave],['000002'+clave.slice(6)]])];
assert.equal(run(ambiguo,leer('VAL_CRC','CRC',clave.slice(1),'APLICA',partes).rows[0]).note,nota);
const anterior={...leer('VAL_CRC','CRC',clave.slice(1)).rows[0],crcIlegible:true,
  inicial:{sector:'1',manzana:'1',lote:'1',edificacion:'1',entrada:'1',piso:'1',unidad:'1'}};
delete anterior.idLote;
assert.equal(run(b,anterior).code,clave);
