// Desde la columna de Excel hasta la hoja CRUCE_REVISOR y la selección de publicación.
'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {cut,stubs,src,ctx,KEY,run}=require('./estado-final-helper');
const archivo=vm.runInNewContext(stubs+src+'\n'+[
  cut('function c2state','function c2files'),
  cut('function c2summary','\n'),cut('function c2sheets','\n'),cut('function pubPublica','\n'),
  '({leer:c2read,hojas:c2sheets,publica:pubPublica})'
].join('\n'),{XLSX:{utils:{decode_range:()=>({s:{r:0},e:{r:1,c:3}}),encode_cell:({r,c})=>'ABCD'[c]+(r+1)}}});
function leer(val,cabecera,valor,estado='APLICA'){
  const ws={'!ref':'A1:D2'};
  [[cabecera,'Estado','Sector','Lote'],[valor,estado,'01','001']].forEach((fila,i)=>fila.forEach((v,j)=>{
    ws['ABCD'[j]+(i+1)]={t:typeof v==='number'?'n':'s',w:String(v)};
  }));
  return archivo.leer({SheetNames:[val],Sheets:{[val]:ws}},'sintetico.xlsx');
}
const clave='000001010010010101010011', lote=clave.slice(6,14);
const b=[ctx('UA',[KEY],[[clave]])],nota='CRC ilegible en el Excel (no tiene 24 dígitos) — revisar el archivo';
for(const val of ['VAL_CRC','VAL_TITULAR_INSCRIPCION']){
  for(const valor of [clave.slice(1),clave.slice(0,-2),'1.234E+23',1.234e23,lote]){
    for(const estado of ['APLICA','OTRO CAMBIO','NO APLICA']){
      const f=leer(val,'CRC',valor,estado),r=run(b,f.rows[0]);
      assert.equal(r.result,'? NO ENCONTRADO');
      assert.equal(r.note,nota);
      assert.equal(archivo.publica(r),false);
      const [detalle]=archivo.hojas([r],[f]);
      assert.equal(detalle.name,'CRUCE_REVISOR');
      assert.equal(detalle.aoa[1][detalle.aoa[0].indexOf('Nota')],nota);
    }
  }
}
assert.notEqual(run(b,leer('VAL_CRC','ID_LOTE',lote).rows[0]).result,'? NO ENCONTRADO');
assert.notEqual(run(b,leer('VAL_CRC','CRC',clave).rows[0]).note,nota);
