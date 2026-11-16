/* Prueba de "Comparar todos (revisión final)": lote de DOS distritos sin mezclar, Antes por polígono, un polígono con error
   no corta el lote, reintento con espera creciente al publicar y resumen publicados / parciales / omitidos.
   Solo códigos y conteos sintéticos; sin Drive ni filas reales. Uso: node tests/comparar-todos.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('function txt(v){','function normVal'),cut('function drvDate(name){','\n'),cut('/* ============ Reportes faltantes','function gapCodes'),
  cut('/* ============ Comparar todos','/* Ejecuta fn con un distrito temporal')].join('\n');
var T=vm.runInNewContext(src+'\n({loteNombre:loteNombre,loteUbigeo:loteUbigeo,lotePoligonos:lotePoligonos,loteFechas:loteFechas,loteArchivos:loteArchivos,loteResultado:loteResultado,loteReintento:loteReintento,loteCorrer:loteCorrer,loteResumen:loteResumen,pubOpciones:pubOpciones,pubLoaded:pubLoaded,pubElegidos:pubElegidos});',{setTimeout:setTimeout,Promise:Promise});
function S(l){return new Set(l);}
function eq(a,b){assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),b);}   // los valores vienen de otro contexto (vm)
function poly(code,ubigeo,sectors){return {code:code,ubigeos:S(ubigeo?[ubigeo]:[]),sectors:S(sectors),keys:S(sectors.map(function(s){return s+'|001';}))};}
function file(tipo,ubigeo,sector,aammdd){var n=T.loteNombre('rep_'+tipo+'_'+ubigeo+sector+'_'+aammdd+'.xlsx');assert(n,'nombre');return n;}

// Universo cargado con DOS distritos mezclados: Independencia (150112) y Comas (150110). El sector 19 existe en ambos.
var IND='150112',COM='150110';
var universo=[poly('260210019',IND,['19','25']),poly('260410068',IND,['30']),poly('270100001',COM,['19','02']),poly('270100002',COM,['03']),
  poly('999000001','',['07']),{code:'999000002',ubigeos:S([IND,COM]),sectors:S(['19']),keys:S(['19|001'])},{code:'270100003',ubigeos:S([COM]),sectors:S([]),keys:S([])}];

// 1) Nombres de archivo y UBIGEO del distrito
eq(T.loteNombre('rep_CONS_15011219_261110.xlsx'),{tipo:'CONS',ubigeo:'150112',sector:'19',day:'2026-11-10'});
assert.strictEqual(T.loteNombre('rep_CONS_15011219_261340.xlsx'),null);assert.strictEqual(T.loteNombre('otro.xlsx'),null);
assert.strictEqual(T.loteUbigeo([IND+'19',IND+'25']).ubigeo,IND);
assert.match(T.loteUbigeo([IND+'19',COM+'19']).error,/mezclan 2 UBIGEO \(150110, 150112\): no se recorre nada/);
assert.match(T.loteUbigeo([]).error,/No se pudo deducir/);

// 2) Solo los polígonos del distrito activo; los del otro nunca se recorren; sin UBIGEO claro → omitido con motivo
var ind=T.lotePoligonos(universo,IND),com=T.lotePoligonos(universo,COM);
eq(ind.procesar.map(function(p){return p.code;}),['260210019','260410068']);
eq(com.procesar.map(function(p){return p.code;}),['270100001','270100002']);
assert.strictEqual(ind.ajenos,3);assert.strictEqual(com.ajenos,2);
eq(ind.omitidos,[{code:'999000001',motivo:'sin UBIGEO en el universo'},{code:'999000002',motivo:'UBIGEO mezclado en el universo (150110, 150112)'}]);
assert(com.omitidos.some(function(o){return o.code==='270100003'&&/sin universo/.test(o.motivo);}));
ind.procesar.concat(ind.omitidos).forEach(function(p){assert(!/^2701/.test(p.code),'Comas dentro de Independencia');});

// 3) Antes POR polígono = la descarga más antigua de SUS sectores y SU ubigeo (Comas tiene otra fecha que Independencia)
var drive=[];
['261103','261114','261115'].forEach(function(d){['UA','CONS'].forEach(function(t){drive.push(file(t,IND,'19',d));});});
['261110','261115'].forEach(function(d){drive.push(file('UA',IND,'25',d));});
drive.push(file('UA',IND,'30','261112'));                                   // 068: una sola descarga
['261020','261116'].forEach(function(d){drive.push(file('UA',COM,'19',d));drive.push(file('UA',COM,'02',d));});
var f019=T.loteFechas(drive,IND,S(['19','25'])),fCom=T.loteFechas(drive,COM,S(['19','02'])),f068=T.loteFechas(drive,IND,S(['30']));
assert.strictEqual(f019.antes,'2026-11-03');assert.strictEqual(f019.despues,'2026-11-15');assert.strictEqual(f019.motivo,'');
assert.strictEqual(fCom.antes,'2026-10-20');assert.strictEqual(fCom.despues,'2026-11-16');   // el S19 de Comas no toma fechas del S19 de Independencia
assert.strictEqual(f068.motivo,'falta Después: solo existe la descarga del 12/11/2026');
assert.match(T.loteFechas(drive,COM,S(['03'])).motivo,/falta Antes y Después/);
var bajar=T.loteArchivos(drive,COM,S(['19','02']),fCom.antes,fCom.despues);
assert.strictEqual(bajar.length,4);assert(bajar.every(function(x){return x.ubigeo===COM;}),'archivo de otro distrito en el lote de Comas');
assert(T.loteArchivos(drive,IND,S(['19','25']),f019.antes,f019.despues).every(function(x){return x.ubigeo===IND&&x.day!=='2026-11-14';}),'no se usa la del día anterior');

// 4) Resultado por polígono con las MISMAS validaciones de "Publicar pendientes" (pubOpciones: sectores incompletos, seguro 50%)
function tot(filas,malas){return {filas:filas,verificado:filas-malas,otroCampo:0,sinCambio:0,noEncontrado:malas,invalido:0,noAplicaConCambio:0};}
function prep(code,sectors,cargados,t,parcial){var loaded={A:S(cargados),B:S(cargados)},op=T.pubOpciones([{code:code,sectors:S(sectors),ilegibles:0,totales:t}],loaded,code),pay={};
  if(op[0].habilitado)pay[code]={poligono:code,antes:'03/11/2026',despues:'15/11/2026',totales:t,filas:[{codigo:'x'},{codigo:'y'}],parcial:!!parcial,parcialDetalle:parcial?['S25 · CONS · 15/11: falta en esta fecha']:[]};
  var tt={};tt[code]=t;return {opciones:op,payloads:pay,totales:tt};}
var ok=T.loteResultado('260210019',prep('260210019',['19','25'],['19','25'],tot(120,3)));
assert.strictEqual(ok.estado,'listo');assert.strictEqual(ok.pendientes,2);assert.strictEqual(ok.filas,120);assert.strictEqual(ok.parcial,false);
assert.strictEqual(T.loteResultado('260210019',prep('260210019',['19','25'],['19'],tot(120,3))).motivo,'sectores incompletos: faltan S25');
assert.match(T.loteResultado('260210019',prep('260210019',['19'],['19'],tot(100,90))).motivo,/90 de 100 inválidas o no encontradas/);
assert.match(T.loteResultado('260210019',prep('260210019',['19'],['19'],tot(0,0))).motivo,/^sin cruce/);
assert.match(T.loteResultado('260210019',{opciones:[],payloads:{},totales:{}}).motivo,/^sin cruce: falta el Excel del revisor/);

(async function(){
  // 5) Reintento con espera creciente (bloqueo de 30 s del Apps Script); la clave inválida no se reintenta
  var esperas=[],dormir=function(ms){esperas.push(ms);return Promise.resolve();},n=0;
  var r=await T.loteReintento(function(){n++;return n<3?Promise.reject(new Error('Lock timeout: another process was holding the lock')):Promise.resolve();},{dormir:dormir});
  eq([r.ok,r.intentos],[true,3]);eq(esperas,[5000,15000]);assert(esperas[1]>esperas[0]);
  esperas=[];r=await T.loteReintento(function(){return Promise.reject(new Error('ocupado'));},{dormir:dormir});
  eq([r.ok,r.intentos,r.error],[false,4,'ocupado']);eq(esperas,[5000,15000,35000]);
  esperas=[];r=await T.loteReintento(function(){return Promise.reject(new Error('Clave inválida'));},{dormir:dormir});
  eq([r.ok,r.intentos],[false,1]);eq(esperas,[]);

  // 6) Lote de Independencia: uno OK, uno con error al comparar, uno parcial, uno que falla al publicar. Ninguno corta el lote.
  var enviados=[],orden=[],codes=['260210019','ERROR','PARCIAL','BLOQUEO','260410068'];
  function procesar(code){orden.push(code);
    if(code==='ERROR')throw new Error('rep_UA_15011230_261112.xlsx: base64 inválido.');
    if(code==='260410068')return Promise.resolve({code:code,estado:'omitido',motivo:f068.motivo});
    return Promise.resolve(T.loteResultado(code,prep(code,['19'],['19'],tot(50,1),code==='PARCIAL')));}
  function publicar(payload){if(payload.poligono==='BLOQUEO')return Promise.reject(new Error('Lock timeout'));enviados.push(payload.poligono);return Promise.resolve({ok:true});}
  var res=await T.loteCorrer(codes,procesar,publicar,null,{dormir:dormir});
  eq(orden,codes,'se recorren todos, uno por uno, en orden');
  eq(enviados,['260210019','PARCIAL']);
  assert(res.every(function(x){return !('payload' in x);}),'el resumen no guarda filas ni payload');
  var g=T.loteResumen(res.concat([{code:'999000001',estado:'omitido',motivo:'sin UBIGEO en el universo'}]));
  eq(g.publicados.map(function(x){return x.code;}),['260210019']);
  eq(g.parciales.map(function(x){return x.code;}),['PARCIAL']);
  eq(g.omitidos.map(function(x){return x.code;}),['ERROR','BLOQUEO','260410068','999000001']);
  assert.strictEqual(g.lineas[0],'Publicados: 1 · Parciales: 1 · Omitidos: 4');
  assert(g.lineas.indexOf('✗ ERROR · omitido: error: rep_UA_15011230_261112.xlsx: base64 inválido.')>0);
  assert(g.lineas.indexOf('✗ BLOQUEO · omitido: error al publicar tras 4 intentos: Lock timeout')>0);
  assert(g.lineas.indexOf('✗ 260410068 · omitido: falta Después: solo existe la descarga del 12/11/2026')>0);
  assert(g.lineas.some(function(t){return /^◐ PARCIAL .* parcial: S25 · CONS/.test(t);}));

  // 7) Sin publicar (casilla desmarcada): nada se envía y los completos quedan como "comparados"
  enviados=[];res=await T.loteCorrer(['260210019','PARCIAL'],procesar,null,null,{dormir:dormir});
  eq(enviados,[]);g=T.loteResumen(res);
  assert.strictEqual(g.lineas[0],'Publicados: 0 · Parciales: 1 · Comparados sin publicar: 1 · Omitidos: 0');assert(/sin publicar/.test(g.lineas[1]));

  // 8) Aguanta 36+ polígonos (Comas tiene 27): 40 seguidos, con un error en medio
  var muchos=[];for(var i=1;i<=40;i++)muchos.push('2701'+String(i).padStart(5,'0'));
  res=await T.loteCorrer(muchos,function(code){if(code==='270100020')throw new Error('fallo sintético');return Promise.resolve(T.loteResultado(code,prep(code,['02'],['02'],tot(10,0))));},function(){return Promise.resolve();},null,{dormir:dormir});
  g=T.loteResumen(res);assert.strictEqual(res.length,40);assert.strictEqual(g.publicados.length,39);assert.strictEqual(g.omitidos.length,1);

  // 9) El HTML reutiliza el flujo existente: un solo pubPreparar para "Publicar pendientes" y el lote; nada de almacenamiento nuevo
  var lote=cut('/* ============ Comparar todos','try{$(\'drvRemember\')');
  assert(/pubPreparar\(/.test(lote)&&/pubElegidos\(/.test(lote)&&/pubPost\(/.test(lote));assert(!/localStorage|sessionStorage|indexedDB/i.test(lote),'el lote no usa almacenamiento');
  assert.strictEqual(html.split('function pubPreparar(').length,2);assert(/pubStart[\s\S]{0,700}pubPreparar\(key/.test(html));
  console.log('ok comparar todos: dos distritos sin mezclar, error no corta el lote, reintento y resumen');
})().catch(function(e){console.error(e);process.exit(1);});
