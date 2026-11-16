/* Prueba de "Cargar desde Drive": sectores sin duplicar ("S35" = "150112 · S35"), reintento por archivo con espera creciente,
   un archivo que falla no corta la carga y la lista final de faltantes con sector/tipo. Solo códigos sintéticos; sin Drive.
   Uso: node tests/carga-drive-sectores.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('function txt(v){','function normVal'),cut('function drvDate(name){','\n'),cut('function loteNombre(name){','\n'),
  cut('/* ---- Carga desde Drive: sectores normalizados','/* ---- fin funciones puras de carga desde Drive ---- */')].join('\n');
var T=vm.runInNewContext(src+'\n({drvUbigeo:drvUbigeo,drvNormSectors:drvNormSectors,drvSectorLabel:drvSectorLabel,drvConReintento:drvConReintento,drvPoolParcial:drvPoolParcial,drvFaltantes:drvFaltantes,drvFaltanteTxt:drvFaltanteTxt,drvFatal:drvFatal,drvReintentable:drvReintentable,DRV_ESPERAS:DRV_ESPERAS});',{setTimeout:setTimeout,Promise:Promise});
function eq(a,b){assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),b);}
var CAIDA='No se pudo conectar con Drive. Revisa URL, permisos y conexión (o tiempo agotado).';

(async function(){
  // 1) El caso del polígono 260710148: 6 sectores que salían dos veces (con UBIGEO por los CRC completos y sueltos por las filas sin UBIGEO)
  var ss=['35','36','37','38','39','40'],crudo=ss.map(function(s){return '150112'+s;}).concat(ss);
  var ub=T.drvUbigeo(crudo,[]);assert.strictEqual(ub,'150112');
  var norm=JSON.parse(JSON.stringify(T.drvNormSectors(crudo,ub)));eq(norm,ss.map(function(s){return '150112'+s;}));
  eq(norm.map(T.drvSectorLabel),ss.map(function(s){return '150112 · S'+s;}));
  // Solo sueltos: el UBIGEO sale del universo; sin universo se conservan sueltos (no se inventa UBIGEO)
  assert.strictEqual(T.drvUbigeo(['35'],['150112']),'150112');eq(T.drvNormSectors(['35','36'],'150112'),['15011235','15011236']);
  assert.strictEqual(T.drvUbigeo(['35'],[]),'');eq(T.drvNormSectors(['35'],''),['35']);eq([T.drvSectorLabel('35')],['S35']);
  // Dos UBIGEO en el revisor: no hay UBIGEO único; el suelto se une solo si un único UBIGEO+SS comparte su sector
  assert.strictEqual(T.drvUbigeo(['15011235','15011019'],['150112']),'');
  eq(T.drvNormSectors(['15011235','15011019','35','19','07'],''),['07','15011019','15011235']);
  eq(T.drvNormSectors(['15011219','15011019','19'],''),['15011019','15011219','19']);
  // Añadir a mano "35" cuando ya está 150112·S35 no crea otro
  eq(T.drvNormSectors(norm.concat(['35']),ub),norm);eq(T.drvNormSectors(norm.concat(['41']),ub),norm.concat(['15011241']));

  // 2) Reintento por archivo: 2 reintentos con espera creciente; a la tercera falla definitiva
  eq(T.DRV_ESPERAS,[3000,8000]);assert(T.DRV_ESPERAS[1]>T.DRV_ESPERAS[0]);
  var esperas=[],n=0,dormir=function(ms){esperas.push(ms);return Promise.resolve();};
  assert.strictEqual(await T.drvConReintento(async function(){if(++n<3)throw new Error(CAIDA);return 'ok';},{dormir:dormir}),'ok');
  assert.strictEqual(n,3);eq(esperas,[3000,8000]);
  n=0;esperas=[];await assert.rejects(T.drvConReintento(async function(){n++;throw new Error(CAIDA);},{dormir:dormir}),/tiempo agotado/);
  assert.strictEqual(n,3);eq(esperas,[3000,8000]);
  // Lo que no es transitorio no se reintenta (clave, tamaño)
  n=0;await assert.rejects(T.drvConReintento(async function(){n++;throw new Error('Clave de lectura inválida o acceso denegado.');},{dormir:dormir}),/Clave/);assert.strictEqual(n,1);
  n=0;await assert.rejects(T.drvConReintento(async function(){n++;throw new Error('x.xlsx: tamaño superior a 25 MiB.');},{dormir:dormir}),/25 MiB/);assert.strictEqual(n,1);
  assert(T.drvReintentable('Drive respondió con error HTTP 503.'));assert(!T.drvReintentable('Drive respondió con error HTTP 404.'));

  // 3) 72 archivos (6 sectores × 6 tipos × 2 fechas): 2 fallan siempre y NO cortan la carga; quedan listados con sector/tipo
  var tipos=['UA','TIT','CONS','OBRAS','RECAP','ING'],items=[];
  ss.forEach(function(s){tipos.forEach(function(t){['261110','261115'].forEach(function(d){var name='rep_'+t+'_150112'+s+'_'+d+'.xlsx';items.push({id:name,name:name,sector:s,day:'2026-11-'+d.slice(4)});});});});
  assert.strictEqual(items.length,72);
  var malos={'rep_CONS_15011237_261110.xlsx':1,'rep_UA_15011235_261115.xlsx':1},bajados={},intentos={};
  async function bajar(item){return T.drvConReintento(async function(){intentos[item.id]=(intentos[item.id]||0)+1;if(malos[item.id])throw new Error(CAIDA);bajados[item.id]=true;},{dormir:function(){return Promise.resolve();}});}
  var r=await T.drvPoolParcial(items,bajar);
  assert.strictEqual(Object.keys(bajados).length,70);assert.strictEqual(r.fallos.length,2);
  Object.keys(malos).forEach(function(k){assert.strictEqual(intentos[k],3);});
  var falt=T.drvFaltantes(r.fallos,'2026-11-10',norm);
  eq(falt.map(function(f){return [f.ubigeo,f.sector,f.tipo,f.lado,f.day];}),[['150112','35','UA','DESPUÉS','2026-11-15'],['150112','37','CONS','ANTES','2026-11-10']]);
  assert.match(T.drvFaltanteTxt(falt[1]),/^150112 · S37 · CONS · ANTES 2026-11-10 — rep_CONS_15011237_261110\.xlsx: No se pudo conectar/);

  // 4) "Reintentar faltantes": solo se piden los que faltan; lo ya bajado no se vuelve a pedir
  malos={};var antes=Object.assign({},intentos),pend=items.filter(function(x){return !bajados[x.id];});assert.strictEqual(pend.length,2);
  r=await T.drvPoolParcial(pend,bajar);assert.strictEqual(r.fallos.length,0);assert.strictEqual(Object.keys(bajados).length,72);
  items.forEach(function(x){assert.strictEqual(intentos[x.id],(antes[x.id]||0)+(pend.indexOf(x)>=0?1:0));});

  // 5) Un error fatal (clave, 150 MiB) sí corta: no tiene sentido seguir archivo por archivo
  assert(T.drvFatal('Clave de lectura inválida o acceso denegado.'));assert(T.drvFatal('La selección supera 150 MiB. Carga menos sectores.'));assert(!T.drvFatal(CAIDA));
  var hechos=0;await assert.rejects(T.drvPoolParcial(items,async function(){hechos++;throw new Error('Clave de lectura inválida o acceso denegado.');}),/Clave/);assert(hechos<=3);
  console.log('carga-drive-sectores: OK');
})().catch(function(e){console.error(e);process.exit(1);});
