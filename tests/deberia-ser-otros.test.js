'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const {ctx,KEY,fila,cut,stubs,src}=require('./estado-final-helper');
const T=vm.runInNewContext(stubs+src+cut('function c2summary','/* Asignaciones locales')+cut('function c2sheets','\n')+cut('var PUB_COUNTS','function pubFields')+cut('var PUB_OTRO_CAMPO','function pubPayload')+
'\n({set:function(b,f){BOARD=b;FILES=f;},estado:c2estadoFinal,rows:c2rows,compare:compareCtx,pub:pubResultado,sheets:c2sheets});');
const K='150110680440060102010015';
function evaluar(board,validator,code,regla,ini){const row=fila(validator,code,'APLICA','['+regla+']','',ini||{});T.set(board,[{rows:[row]}]);const estado=T.estado(board,row,code),result=T.rows()[0];assert(estado&&!estado.cumple,regla);return {estado,result,text:T.pub(result)};}
const ho=[KEY,'Código','Descripción','MEP','Producto Total','Unidad de Medida','UCA'];
function obra(c,m,pt,um,regla){return evaluar([ctx('OBR',ho,[[K,c,'obra',m,pt,um,'']])],'VAL_MEP_MEDIDA_PRODUCTO',K,regla,{codigo:c,productototal:pt,unidaddemedida:um,mep:m});}
const ejemplos={};
ejemplos['OBR R2']=obra('50','02','2','ml','R2');
ejemplos['OBR R3']=obra('21','03','2','m³','R3');
ejemplos['OBR R5']=obra('50','01','2','m²','R5');
const h=[KEY,'Código De Uso','Clasificación Del Predio','Predio Catastral En','Tipo de Edificación'];
function condicion(uso,clas,pce,tipo,regla){return evaluar([ctx('UA',h,[[K,uso,clas,pce,tipo]])],'VAL_COND_PREDIO_EN',K,regla,{clasificaciondelpredio:clas,prediocatastralen:pce,tipodeedificacion:tipo,codigodeuso:uso});}
ejemplos['COND R8']=condicion('020105','OTROS','PREDIO INDEPENDIENTE','CASA','R8');
ejemplos['COND R11']=condicion('010101','PREDIO EN EDIFICIO','PREDIO EN EDIFICIO','CASA','R11');
const edificio='1501106804400601';
function key(e,p,u){return edificio+e+p+u+'5';}
function crc(keys,c,regla){return evaluar([ctx('UA',[KEY],keys.map(x=>[x]))],'VAL_CRC',c,regla,{});}
ejemplos['CRC R1']=crc([key('02','01','001')],key('02','01','001'),'R1');
ejemplos['CRC R2']=crc([key('01','01','001'),key('03','01','001')],key('03','01','001'),'R2');
ejemplos['CRC R3']=crc([key('01','02','001')],key('01','02','001'),'R3');
ejemplos['CRC R4']=crc([key('01','01','002')],key('01','01','002'),'R4');
ejemplos['CRC R5']=crc([key('01','01','001'),key('01','01','003')],key('01','01','003'),'R5');
ejemplos['CRC R6']=crc([key('01','82','001')],key('01','82','001'),'R6');
const esperados={'OBR R2':'m²','OBR R3':'más de 0 hasta 1 m³','OBR R5':'02','COND R8':'TIENDA-DEPÓSITO-ALMACÉN','COND R11':'EDIFICIO o BLOCK','CRC R1':'entrada 01','CRC R2':'entrada 02','CRC R3':'piso 01','CRC R4':'unidad 001','CRC R5':'unidad 002','CRC R6':'sótano 81'};
for(const [regla,x] of Object.entries(ejemplos)){
 assert.equal(x.estado.deberia,esperados[regla],regla);assert(x.text.includes(' · debería ser: '+esperados[regla]),regla+' '+x.text);
 assert(!/\d{8,}/.test(x.text),x.text);assert.equal(T.sheets([x.result],[])[0].aoa[1][13],x.text);console.log(regla+' | '+x.text);
}

// Las sugerencias también llegan a ambos estados de cambio y no se mezclan con reglas no seleccionadas.
const b=ctx('UA',h,[[K,'020105','OTROS','PREDIO INDEPENDIENTE','CASA']]);
b.A.rows[0]['Clasificación Del Predio']='CASA HABITACION';b.RES=T.compare(b);
const changed=evaluar([b],'VAL_COND_PREDIO_EN',K,'R8',{});
assert.match(changed.text,/^◐ Cambió, revisar: .* · debería ser: TIENDA-DEPÓSITO-ALMACÉN/);
assert.equal(T.sheets([changed.result],[])[0].aoa[1][13],changed.text);
const errorBoard=ctx('OBR',ho,[[K,'50','obra','01','2','ml','']]);
const selected=evaluar([errorBoard],'VAL_MEP_MEDIDA_PRODUCTO',K,'R2',{codigo:'50',productototal:'2',unidaddemedida:'ml',mep:'01'});
assert.equal(selected.estado.deberia,'m²');assert(!selected.text.includes('debería ser: 02'));
