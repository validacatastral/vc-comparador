// Casos sintéticos por regla. Cada escenario atraviesa compareCtx y c2rows.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const {T,ctx,KEY,fila,run}=require('./estado-final-helper');
const dir=path.join(__dirname,'..','validadores_ref');
function fuente(prefijo){
  return fs.readFileSync(path.join(dir,fs.readdirSync(dir).find(f=>f.startsWith(prefijo))),'utf8');
}
function segmento(texto,inicio,fin){
  const i=texto.indexOf(inicio), j=texto.indexOf(fin,i);
  assert(i>=0&&j>i,inicio);
  return texto.slice(i,j);
}
// Ejecutar únicamente la configuración y las funciones de dominio, sin DOM ni red.
function original(nombre){
  const s=fuente('VAL_'+nombre);
  if(nombre==='CRC'){
    const motor=segmento(s,'function vR(t)','var rr=')+segmento(s,'var $kFiles=[]','function $kLeer(');
    return vm.runInNewContext(motor+`(keys,areas,code)=>{
      $kMap=areas;$kPrep(keys);const r=e2(keys).find(x=>x.raw===code);return $kCruce(r,bR(r)).map(h=>h.c);
    }`);
  }
  const titular=nombre==='TITULAR';
  const motor=segmento(s,titular?'var HDR =':'var SLOTS =','function ejecutar()');
  return vm.runInNewContext(motor+(titular?'(rows,i)=>validar(rows[i],null).reglas':
    '(rows,i,cruces)=>validar(rows[i],prepararContexto(cruces,rows)).map(h=>h.c)'));
}
const niveles=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/var REGLAS_NIVEL=\{[\s\S]*?\n\};/)[0]+'; REGLAS_NIVEL');
const grupo={USO:'USO',COND:'COND',OBRAS:'OBR',CRC:'CRC',TITULAR:'TIT'};
const ref=Object.fromEntries(['USO','COND','OBRAS','CRC','TITULAR'].map(n=>[n,original(n)]));
const edificio='0000010100100101', clave=(ent,piso,unidad)=>edificio+ent+piso+unidad+'1';
const K=clave('01','01','001'), K2=clave('01','02','001');
const nombres={crc:KEY,ct:'Condición del Titular',fa:'Forma de Adquisición',td:'Tipo de Documento',tp:'Tipo de Partida Registral',np:'Número de Partida Registral',clas:'Clasificación del Predio',
  clasif:'Clasificación del Predio',pce:'Predio Catastral En',cuso:'Código de Uso',duso:'Descripción del Uso',tedif:'Tipo de Edificación',interior:'Tipo de Interior',
  uso:'Código de Uso',descUso:'Descripción del Uso',ciiu:'Código de Actividad Económica (CIIU)',piso:'N° Piso',ecc:'ECC',area:'Área Verificada',
  cod:'Código',desc:'Descripción',fecha:'Fecha de Construcción',fechaCon:'Fecha Construcción',pt:'Producto Total',um:'Unidad de Medida',mep:'MEP',ecs:'ECS',uca:'UCA'};
function reporte(id,registros){
  const campos=Array.from(new Set(registros.flatMap(Object.keys))).filter(k=>k!=='__sin');
  return ctx(id,campos.map(k=>nombres[k]),registros.map(r=>campos.map(k=>r[k]??'')));
}
const val={USO:'VAL_USO_CIIU',COND:'VAL_COND_PREDIO_EN',OBRAS:'VAL_MEP_MEDIDA_PRODUCTO',CRC:'VAL_CRC',TITULAR:'VAL_TITULAR_INSCRIPCION'};
let escenarios=0;
function verificar(tipo,regla,malo,bueno,{falso=false,vigente=false}={}){
  for(const [datos,debe] of [[malo,true],[bueno,false]]){
    const {base,cruces={},code=K,piso='',board,rep,campo}=datos;
    let hits;
    if(tipo==='CRC'){
      const areas={};
      for(const r of cruces.cons||[]){
        const p=String(r.piso).padStart(2,'0'), unidad=areas[r.crc.slice(0,23)]||={};
        unidad[p]=(unidad[p]||0)+Number(r.area);
      }
      hits=ref.CRC([...new Set(base.map(r=>r.crc))],areas,code);
    }else hits=ref[tipo](structuredClone(base),base.findIndex(r=>r.crc===code&&(!piso||r.piso===piso)),structuredClone(cruces));
    assert.equal(hits.includes(regla),debe&&!vigente,tipo+' referencia '+regla);
    const b=board(), filaUE=fila(val[tipo],code,'APLICA','['+regla+']',piso);
    const estado=T.estado(b,filaUE,code);
    assert(estado,tipo+' datos '+regla);
    assert.equal(estado.reglas.includes(regla),debe&&!falso,tipo+' equivalencia '+regla);
    const estable=run(b,filaUE);
    if(debe&&!falso){
      assert(estable.result==='⚠ SIN CAMBIO EN SICUN'||/^◐ Cambió(?: pero sigue mal|, revisar): /.test(estable.result)&&estable.result.includes('('+regla+')'),estable.result);   /* ⚠ sin cambio, o ◐ si el inicial difiere (caso a) */
      assert(estable.note.includes('Sigue en SICUN: '+regla),estable.note);
    }
    const cambio=b.find(x=>x.preset.id===rep);
    cambio.A.rows.filter(r=>r[KEY]===code).forEach(r=>{r[nombres[campo]]='ANTES';});
    cambio.RES=T.compareCtx(cambio);
    const final=run(b,filaUE);
    const prefijo=niveles[grupo[tipo]][regla]==='ADVERTENCIA'?'◐ Cambió, revisar: ':'◐ Cambió pero sigue mal: ';
    assert.equal(String(final.result).replace(/^(◐ Cambió(?: pero sigue mal|, revisar): ).*?\(([A-Z0-9]+)\)(?: · .*)?$/,'$1$2'),debe&&!falso?prefijo+regla:'✔ VERIFICADO',tipo+' '+regla+' '+final.result+' '+final.note);
  }
  escenarios++;
}
function titular(delta={}){
  const base=[{crc:K,ct:'PROPIETARIO',fa:'OTROS',td:'',tp:'',np:'',clas:'CASA HABITACION',...delta}];
  return {base,board:()=>[reporte('UA',base)],rep:'UA',campo:'td'};
}
for(const [r,d] of Object.entries({R1:{fa:'COMPRA'},R2:{td:'ESCRITURA PÚBLICA'},R2P:{ct:'POSEEDOR',td:'ESCRITURA PÚBLICA'},R3A:{tp:'CÓDIGO DE PREDIO',np:'1'},R3B:{tp:'PARTIDA ELECTRÓNICA',np:'1'},R3C:{tp:'FICHA',np:'1'},R3F:{tp:'FICHA',np:'12345678'},R4:{ct:'SUCESIÓN INTESTADA',fa:'COMPRA'},R5:{fa:'POSESIÓN'},R5C:{td:'CONSTANCIA'}}))verificar('TITULAR',r,titular(d),titular());
for(const [r,d] of Object.entries({R13:{fa:''},R4H:{ct:'SUCESIÓN INTESTADA',td:'DECLARATORIA DE HEREDEROS'},R6O:{ct:'OTROS',td:'ESCRITURA PÚBLICA'}})){
  verificar('TITULAR',r,titular(d),titular(),{vigente:true});
}
function uso(u='050101',ciiu='8510',otras=[],ecc='TERMINADO',unidades=[u]){
  const base=[ciiu,...otras].map((c,i)=>({crc:K,ciiu:c,ecc:i?'TERMINADO':ecc,piso:String(i+1),__sin:{uso:true}}));
  const ua=unidades.map(uso=>({crc:K,uso}));
  if(!ua.length)ua.push({crc:K2,uso:u});
  return {base,cruces:{unid:ua},piso:'1',board:()=>[reporte('CON',base),reporte('UA',ua)],rep:'CON',campo:'ciiu'};
}
for(const [r,datos] of Object.entries({R1:uso(''),R2:uso('999998'),R3A:uso('050101',''),R3B:uso('050101','',['8510']),R3C:uso('050101','',[],'02 - EN CONSTRUCCIÓN'),R4A:uso('050101','4711'),R4B:uso('050101','4711',['9601']),R5:uso('050101','8510',[],'TERMINADO',[]),R6:uso('050101','8510',[],'TERMINADO',['050101','020101']),R7:uso('020304',''),R8A:uso('020199',''),R8B:uso('020199','4711'),R8C:uso('020199','',['4711']),R9:uso('020304','4711'),R10:uso('050101','9998')}))verificar('USO',r,datos,uso(),{falso:['R3C','R7'].includes(r)});
function condicion(delta={},cantidad=1){
  const base=Array.from({length:cantidad},(_,i)=>({crc:clave('01','01',String(i+1).padStart(3,'0')),clasif:'CASA HABITACIÓN',pce:'PREDIO INDEPENDIENTE',tedif:'CASA',cuso:'010101',__sin:{},...delta}));
  return {base,board:()=>[reporte('UA',base)],rep:'UA',campo:'clasif'};
}
for(const [r,d] of Object.entries({R1:{pce:'PREDIO EN EDIFICIO'},R2:{clasif:'PARQUE',pce:'AIRES'},R3:{clasif:''},R4:{pce:'OTROS'},R5:{pce:'MERCADO'},R6:{clasif:'PREDIO EN EDIFICIO'},R8:{clasif:'OTROS'},R9:{clasif:'SUB ESTACIÓN'},R10:{tedif:''},R10C:{clasif:'CEMENTERIO',tedif:''},R11:{clasif:'PREDIO EN EDIFICIO'},R12:{tedif:'BLOCK'},R13:{tedif:'PABELLÓN'}}))verificar('COND',r,condicion(d),condicion());
function obra(delta={},duplicar=false){
  const r={crc:K,cod:'50',desc:'PARAPETO',fecha:'2025-02',pt:'2',um:'m²',mep:'02',ecc:'TERMINADO',ecs:'BUENO',uca:'',__sin:{},...delta};
  const base=duplicar?[r,{...r}]:[r], cons=[{crc:K,piso:'1',fecha:'2025-01'}];
  return {base,cruces:{cons},board:()=>[reporte('OBR',base),reporte('CON',cons.map(r=>({crc:r.crc,piso:r.piso,fechaCon:r.fecha})))],rep:'OBR',campo:'pt'};
}
for(const [r,d] of Object.entries({R1:{pt:'1'},R2:{um:'ml'},R3:{cod:'21',pt:'2',um:'m³'},R4:{},R5:{mep:'01'},R6:{cod:'18',ecc:'INCONCLUSA'},R7P:{fecha:'2024-12'}}))verificar('OBRAS',r,obra(d,r==='R4'),obra());
function crc(code=K,otros=[],pisos=[]){
  const base=[code,...otros].map(crc=>({crc,interior:'DPTO'})),cons=pisos.map(([piso,area])=>({crc:code,piso,area}));
  return {code,base,cruces:{cons},board:()=>[reporte('UA',base),...(cons.length?[reporte('CON',cons)]:[])],rep:'UA',campo:'interior'};
}
for(const [r,esc] of Object.entries({R1:crc(clave('02','01','001')),R2:crc(clave('03','01','001'),[K]),R3:crc(K2),R4:crc(clave('01','01','002')),R5:crc(clave('01','01','003'),[K]),R6:crc(clave('01','82','001')),R6A:crc(clave('01','81','001'),[],[['81',10],['01',6]]),R6B:crc(K2,[K],[['01',5],['02',10]]),R6C:crc(K2,[K],[['01',10]])}))verificar('CRC',r,esc,crc());
console.log(escenarios+' reglas vigentes comprobadas con y sin cambios.');

// Identificadores truncados: cotejo directo del motor. El cruce no resuelve estas filas.
const corto=K.slice(0,22);
assert(ref.TITULAR([{...titular().base[0],crc:corto}],0).includes('E1'));
assert.equal(T.titular({clasificaciondelpredio:'PARQUE'},corto).length,0);
assert(ref.CRC([corto],{},corto).includes('LON'));
assert.equal(T.crc([reporte('UA',[{crc:corto}])],corto,'LON'),null);

// El formato que trae el uso en Construcciones prescinde de UA.
const legacy=reporte('CON',[{crc:K,piso:'1',uso:'050101',ciiu:'G4711'}]);
const consulta=(tipo,regla)=>fila(val[tipo],K,'APLICA',regla,'1');
assert.equal(T.estado([legacy],consulta('USO','Verificar CIIU'),K),null); // Uso solo de UA del DESPUÉS.
const sinCiiu=reporte('CON',[{crc:K,piso:'1',uso:'050101'}]);
assert.equal(T.estado([sinCiiu],consulta('USO','R3A'),K),null);
const sinUso=reporte('CON',[{crc:K,piso:'1',ciiu:'9998'}]);
assert(T.estado([sinUso],consulta('USO','R10'),K).reglas.includes('R10'));
assert.equal(T.estado([sinUso],consulta('USO','R3A'),K),null);
const sinTipo=reporte('UA',[{crc:K,clasif:'CASA HABITACIÓN',pce:'PREDIO INDEPENDIENTE'}]);
assert.equal(T.estado([sinTipo],consulta('COND','R10'),K),null);
const sinMEP=reporte('OBR',[{crc:K,cod:'50',desc:'PARAPETO',pt:'12',um:'m²',uca:''}]);
assert.equal(T.estado([sinMEP],consulta('OBRAS','R5'),K),null);

// La regla excluida no puede decidir el estado ni figurar en las observaciones adicionales.
function excluida(tipo,datos,regla){
  const b=datos.board();
  for(const mensaje of [regla,'Revisar la ficha']){
    const row=consulta(tipo,mensaje), estable=run(b,row);
    assert.doesNotMatch(estable.result+' '+estable.note,new RegExp('\\b'+regla+'\\b'));
    const c=b.find(c=>c.preset.id===datos.rep),campo=nombres[datos.campo];
    const previo=c.A.rows[0][campo];
    c.A.rows[0][campo]='ANTES';
    c.RES=T.compareCtx(c);
    const cambio=run(b,row);
    assert.equal(cambio.result,'✔ VERIFICADO');
    assert.doesNotMatch(cambio.note,new RegExp('\\b'+regla+'\\b'));
    c.A.rows[0][campo]=previo;
    c.RES=T.compareCtx(c);
  }
}
excluida('USO',uso('050101','8510',[],'INCONCLUSA'),'R3D');
excluida('COND',condicion({},11),'R7');
for(const clasif of ['TERRENO SIN CONSTRUIR','PARQUE']){
  excluida('COND',condicion({clasif,cuso:'010101',tedif:'PABELLÓN'}),'R14');
  for(const pce of ['PREDIO EN EDIFICIO','','OTROS']){
    const b=condicion({clasif,pce,tedif:'PABELLÓN'}).board();
    const resultado=T.estado(b,consulta('COND','Revisar la ficha'),K);
    assert.deepEqual(Array.from(resultado.reglas),['R2']);
    assert.equal(resultado.extra,'');
  }
}
excluida('OBRAS',obra({cod:'18',fecha:'2024-12',um:'m³',mep:'03'}),'R7');
