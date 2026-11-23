'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {cut,stubs,src,ctx,KEY}=require('./estado-final-helper');
const T=vm.runInNewContext(stubs+src+'\n'+[
  cut('function c2state','function c2files'),cut('function c2summary','\n'),cut('function c2sheets','\n'),cut('var PUB_LABELS','/* Prepara la publicación'),cut('function pubPendientes','\n'),
  'function c2assign(rows){return rows;} function fileDate(){return {day:"2026-11-01"};}',
  '({leer:c2read,rows:c2rows,hojas:c2sheets,payload:pubPayload,pendientes:pubPendientes,bucket:c2bucket,set:(b,f)=>{BOARD=b;FILES=f;}})'
].join('\n'),{XLSX:{utils:{decode_range:ref=>({s:{r:0},e:{r:1,c:ref.split(':')[1].charCodeAt(0)-65}}),encode_cell:({r,c})=>String.fromCharCode(65+c)+(r+1)}}});
const K='150110680440060102010015';
function leer(headers,values){const ws={'!ref':'A1:'+String.fromCharCode(64+headers.length)+'2'};[headers,values].forEach((row,i)=>row.forEach((v,j)=>{ws[String.fromCharCode(65+j)+(i+1)]={t:'s',w:String(v)};}));return T.leer({SheetNames:['VAL_USO_CIIU'],Sheets:{VAL_USO_CIIU:ws}},'260510081.xlsx');}
const headers=['CRC','Código De Uso','REVISIÓN','VAL_USO_CIIU','Estado','Observaciones','CAMBIO GRÁFICO','k'];
const values=[K,'020202','  Verificado en campo  ','[R4A]','APLICA','','no','dato'];
const file=leer(headers,values), row=file.rows[0];assert.equal(row.revision,'Verificado en campo');assert.equal(row.inicial.codigodeuso,'020202');assert(!Object.hasOwn(row.inicial,'revision'));assert(!Object.hasOwn(row.inicial,'cambiografico'));assert(!Object.hasOwn(row.inicial,'k'));
const board=[ctx('UA',[KEY,'Código De Uso'],[[K,'020202']]),ctx('CON',[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'],[[K,'1','4530','TERMINADO']])];
function cruzar(f){T.set(board,[f]);return T.rows()[0];}
const r=cruzar(file);assert.equal(r.result,'✔ Revisado a mano · ver columna REVISIÓN del Excel del validador: Verificado en campo');assert.equal(T.bucket(r.result),9);assert.match(r.note,/Sin revisión: ⚠ SIN CAMBIO EN SICUN/);
const payload=T.payload('260510081',[r],'clave',false);assert.equal(payload.filas.length,1);assert.equal(payload.filas[0].resultado,r.result);assert(!Object.hasOwn(payload.filas[0],'revision'));assert.equal(payload.totales.revisado,1);assert.equal(payload.totales.sinCambio,0);assert.equal(payload.totales.verificado,0);assert(!payload.totales.sigueMal);assert.equal(T.pendientes(payload.totales),0);assert.equal(payload.porTecnico[r.tecnico].revisado,1);assert.equal(payload.porValidador[r.validator].revisado,1);
const detail=T.hojas([r],[file])[0].aoa;assert.equal(detail[1][detail[0].indexOf('Revisión')],'Verificado en campo');assert.equal(detail[1][detail[0].indexOf('Verificación SICUN')],r.result);
const vacio=cruzar(leer(headers,[K,'020202','  ','[R4A]','APLICA','','no','dato']));assert.equal(vacio.result,'⚠ SIN CAMBIO EN SICUN');
const sin=cruzar(leer(['CRC','Código De Uso','VAL_USO_CIIU','Estado','Observaciones','CAMBIO GRÁFICO','k'],[K,'020202','[R4A]','APLICA','','no','dato']));assert.equal(sin.result,vacio.result);assert.equal(sin.revision,'');
for(const nombre of ['Revision','REVISION'])assert.equal(leer(['CRC',nombre,'Estado'],[K,'Listo','APLICA']).rows[0].revision,'Listo');
const larga=cruzar(leer(headers,[K,'020202','x'.repeat(250),'[R4A]','APLICA','','','']));assert.equal(larga.result.split(': ').pop().length,200);
// Revisiones siguen visibles incluso si la marca es NO APLICA o no hay columna de estado.
for(const f of [leer(['CRC','Estado','REVISIÓN'],[K,'NO APLICA','Aprobado']),leer(['CRC','REVISIÓN'],[K,'Aprobado'])])assert.match(cruzar(f).result,/^✔ Revisado a mano/);
console.log('revision-manual: ok');
