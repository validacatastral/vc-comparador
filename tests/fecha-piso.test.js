// Filas sintéticas. El oráculo se carga del adjunto sin ejecutar la interfaz del validador.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {T,ctx,KEY,fila,run}=require('./estado-final-helper');
const html=fs.readFileSync(path.join(__dirname,'../validadores_ref/VAL_FECHA_PISO.html'),'utf8');
const motor=html.slice(html.indexOf('var SLOTS ='),html.indexOf('function leerArchivo('));
const original=vm.runInNewContext(motor+`
  registros=>{
    const contexto=prepararContexto({},registros);
    return registros.map(r=>validar(r,contexto).map(h=>h.c));
  }`);

const edificio='0000010100100101',K=edificio+'01010011',vecina=edificio+'01010021';
const headers=[KEY,'N° Piso','Fecha Construcción','Nombre Backup'];
const hoja='VAL_FECHA_PISO';
function linea(npiso,fecha,crc=K,backup='copia_20250101'){return {crc,npiso,fecha,backup};}
function tablero(registros,anteriores=registros){
  const valores=r=>[r.crc,r.npiso,r.fecha,r.backup];
  const con=ctx('CON',headers,registros.map(valores));
  con.A=ctx('CON',headers,anteriores.map(valores)).A;
  con.RES=T.compareCtx(con);
  return [con];
}
function revisor(piso,mensaje,code=K){
  return fila(hoja,code,'APLICA',mensaje,piso,{fechaconstruccion:'2010-01-01'});
}
function codigos(estado){return Array.from(estado.reglas);}
function cotejar(registros,indice){
  const r=registros[indice],esperadas=original(structuredClone(registros));
  const observadas=new Set();
  registros.forEach((x,i)=>{if(x.crc===r.crc&&x.npiso===r.npiso)esperadas[i].forEach(c=>observadas.add(c));});
  const estado=T.estado(tablero(registros),revisor(r.npiso,'Revisar la línea',r.crc),r.crc);
  assert.deepEqual(codigos(estado),Array.from(observadas).filter(c=>c==='R1'));
}
const niveles=(...rs)=>rs.map(([p,f])=>linea(p,f));
const escenarios=[
  ['R1',niveles(['1','2020-06-15'],['2','2019-01-01']),niveles(['1','2020-06-15'],['2','2021-01-01'])],
  ['R1M',niveles(['1','2020-06-15'],['2','2020-06-14']),niveles(['1','2020-06-15'],['2','2020-06-15'])],
  ['R1Z',niveles(['1','2010-01-01'],['71','2020-01-01'],['2','2018-01-01']),niveles(['1','2010-01-01'],['71','2020-01-01'],['2','2020-01-01'])],
  ['R2',[linea('1','2199-01-01',K,'backup_22000101')],[linea('1','2020-01-01')]],
  ['R3',[linea('1','2020-06-16',K,'backup_20200615')],[linea('1','2020-06-15',K,'backup_20200615')]],
  ['R4',[linea('1','')],[linea('1','44000')]],
  ['R5',niveles(['1','2018-01-01'],['3','2020-01-01']),niveles(['1','2018-01-01'],['2','2019-01-01'],['3','2020-01-01'])],
  ['R6',[linea('ático','')],[linea('2','2020-01-01')]]
];
for(const [regla,mal,bien] of escenarios){
  for(const [datos,originalFalla] of [[mal,true],[bien,false]]){
    const i=datos.length-1,objetivo=datos[i],row=revisor(objetivo.npiso,'['+regla+'] (FI.28.02)');
    const falla=originalFalla&&regla==='R1';
    cotejar(datos,i);
    assert.equal(original(structuredClone(datos))[i].includes(regla),originalFalla,regla);
    const estable=run(tablero(datos),row);
    if(falla){
      assert(estable.result==='⚠ SIN CAMBIO EN SICUN'||estable.result.startsWith('◐ Cambió pero sigue mal: ')&&estable.result.includes('('+regla+')'),regla+' '+estable.result);   /* ⚠, o ◐ si el inicial difiere (caso a) */
      assert(estable.note.includes('Sigue en SICUN: '+regla),estable.note);
    }else assert.equal(estable.result,'✔ CUMPLE EN SICUN',regla+' '+estable.note);
    assert.doesNotMatch(estable.note,/Ojo, además|\b(R1M|R1Z|R[2-6])\b/);
    const antes=structuredClone(datos);
    antes[i].fecha='2009-12-31';
    const cambio=run(tablero(datos,antes),row);
    assert.equal(String(cambio.result).replace(/^(◐ Cambió pero sigue mal: ).*?\(([A-Z0-9]+)\)(?: · .*)?$/,'$1$2'),falla?'◐ Cambió pero sigue mal: '+regla:'✔ VERIFICADO',regla);
  }
}
// El piso de otra unidad de la edificación sostiene la línea, pero sus incidencias no se atribuyen a esta.
const contexto=[linea('1','2020-01-01',vecina),linea('2','2019-01-01'),linea('3','2017-03-01',vecina)];
const con=tablero(contexto);
assert.deepEqual(codigos(T.estado(con,revisor('02','FI.28.02'),K)),['R1']);
assert.equal(T.estado(con,revisor('03','FI.28.02'),K),null);
const lote=K.slice(6,14);
assert.deepEqual(codigos(T.estado(con,revisor('03','FI.28.02',lote),lote)),['R1']);
assert.deepEqual(codigos(T.estado(con,revisor('02','Mes anterior al nivel inferior'),K)),['R1']);

// Selección por mensaje y avisos adicionales, sin publicar valores de las líneas.
const varias=tablero([linea('1','2020-01-01'),linea('3','2019-01-01')]);
for(const msg of ['Mes anterior (FI.28.02)','[R1M] mes anterior','Año anterior','Nivel anterior','[R5] Salto de pisos']){
  const r=run(varias,revisor('3',msg));
  assert(r.note.includes('Sigue en SICUN: R1'),r.note);
  assert.doesNotMatch(r.note,/Ojo, además|R1M|R1Z|R[2-6]|2019|2020/);
  const cambio=run(tablero(contexto,[contexto[0],linea('2','2018-01-01'),contexto[2]]),revisor('2',msg));
  assert.equal(String(cambio.result).replace(/^(◐ Cambió pero sigue mal: ).*?\(([A-Z0-9]+)\)(?: · .*)?$/,'$1$2'),'◐ Cambió pero sigue mal: R1');
}
for(const fecha of ['2020-01-01','2020-06-14']){
  const r=run(tablero(niveles(['1','2020-06-15'],['2',fecha])),revisor('2','Mes anterior'));
  assert.equal(r.result,'✔ CUMPLE EN SICUN');
}
assert.equal(run(tablero(contexto,[contexto[0],linea('2','2018-01-01'),contexto[2]]),revisor('2','')).result,'✔ VERIFICADO');

// Aires, bienes comunes y nivel lote: ningún hallazgo y ninguna fecha que sostenga otro piso.
for(const sufijo of ['99010011','01990011','01019991']){
  const exento=edificio+sufijo;
  const datos=[linea('1','2199-01-01',exento),linea('2','2010-01-01')];
  for(const i of [0,1])cotejar(datos,i);
  assert.deepEqual(codigos(T.estado(tablero(datos),revisor('1','Revisar',exento),exento)),[]);
  assert.deepEqual(codigos(T.estado(tablero(datos),revisor('2','Revisar'),K)),[]);
}
for(const faltante of ['Fecha Construcción','N° Piso',KEY]){
  const disponibles=headers.filter(h=>h!==faltante), valores={[KEY]:K,'N° Piso':'1','Fecha Construcción':'','Nombre Backup':'20200101'};
  const b=[ctx('CON',disponibles,[disponibles.map(h=>valores[h])])];
  assert.equal(T.estado(b,revisor('1','R4'),K),null);
}
assert.deepEqual(codigos(T.estado([ctx('CON',headers.slice(0,3),[[K,'1','2020-01-01']])],revisor('1','R3'),K)),[]);
const edificioB='0000010100100102'+'01010011';
const bordes=[linea('82','2015-01-01'),linea('81','2013-01-01'),linea('1','2015-02-01'),
  linea('71','2020-02-01'),linea('2','2019-01-01'),linea('3','2018-12-01'),linea('4','31/04/2019'),
  linea('5','enero 2012'),linea('','no fecha'),linea('80','44001'),linea('1','2199-01-01',edificioB)];
bordes.forEach((_,i)=>cotejar(bordes,i));

// El DV cambia entre descargas. La secuencia de la unidad nueva sigue siendo incorrecta.
const viejo=K.slice(0,23)+'0',antes=[linea('1','2020-01-01',vecina),linea('2','2018-01-01',viejo)];
const renombrado=tablero([antes[0],linea('2','2019-01-01',K)],antes);
const rr=run(renombrado,revisor('2','[R1] (FI.28.02)',viejo));
assert.equal(rr.result,'✔ CAMBIÓ (renombrado)',rr.change+' '+rr.note);
assert.match(rr.changeView+' '+rr.note,/DV|CRC/);

// La línea más antigua del nivel inferior manda, independientemente de la unidad y el orden.
const ampliacion=[linea('1','2022-08-01',vecina),linea('1','2016-08-01'),linea('2','2018-08-01')];
assert.deepEqual(codigos(T.estado(tablero(ampliacion),revisor('2','[R1]'),K)),[]);
cotejar(ampliacion,2);
const mismoDia=run(tablero([linea('1','2020-06-15')]),{...revisor('1','R1'),inicial:{fechaconstruccion:'15/06/2020'}});
assert.equal(mismoDia.result,'⚠ SIN CAMBIO EN SICUN');
assert.match(mismoDia.note,/Sin cambio desde la validación/);
console.log('VAL_FECHA_PISO: solo R1 comprobada contra el original y en el cruce C2.');

const mezanine=niveles(['1','2020-12-31'],['71','2019-01-01'],['2','2020-01-01']);
assert.deepEqual(codigos(T.estado(tablero(mezanine),revisor('71','Mes anterior'),K)),['R1']);
const sinFecha=niveles(['1','2018-01-01'],['2','ilegible'],['3','2019-01-01']);
assert.deepEqual(codigos(T.estado(tablero(sinFecha),revisor('3','Fecha de construcción'),K)),[]);
