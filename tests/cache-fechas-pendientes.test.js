/* Prueba de la caché de Drive (IndexedDB simulado), las fechas automáticas por sector (ANTES original / DESPUÉS última completa),
   "↻ Repetir última carga" y el panel "Pendientes publicados". Solo datos sintéticos; sin navegador ni Drive.
   Uso: node tests/cache-fechas-pendientes.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=cut('/* ---- Caché de Drive, fechas automáticas por sector','/* ---- fin caché/fechas/pendientes ---- */');
var T=vm.runInNewContext(src+'\n({cacheClave:cacheClave,cacheAbrir:cacheAbrir,cacheLeer:cacheLeer,cacheGuardar:cacheGuardar,cacheVencer:cacheVencer,cacheTamano:cacheTamano,cacheVaciar:cacheVaciar,cacheMB:cacheMB,drvFileCache:drvFileCache,drvTipo:drvTipo,drvFechasAuto:drvFechasAuto,drvArchivosAuto:drvArchivosAuto,pubFechasSector:pubFechasSector,drvRepetible:drvRepetible,pendUrl:pendUrl,pendAplicar:pendAplicar,CACHE_VIGENCIA:CACHE_VIGENCIA});',{Promise:Promise,Uint8Array:Uint8Array});
function eq(a,b){assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),b);}
var DIA=24*3600*1000;

/* IndexedDB mínimo en memoria: open/upgrade, transacciones con varias tiendas, get/put/delete/getAll/clear asíncronos y oncomplete. */
function fakeIDB(){var bases={};
  function tx(b,names,mode){var t={pend:0,done:false};
    function fin(){if(t.pend===0&&!t.done){t.done=true;setTimeout(function(){if(t.oncomplete)t.oncomplete();});}}
    function req(fn){var r={};t.pend++;setTimeout(function(){r.result=fn();if(r.onsuccess)r.onsuccess();t.pend--;fin();});return r;}
    t.objectStore=function(n){assert(names.indexOf(n)>=0,'tienda fuera de la transacción: '+n);var st=b.stores[n];
      function rw(){if(mode!=='readwrite')throw new Error('ReadOnlyError');}
      return {get:function(k){return req(function(){var v=st.data.get(k);return v===undefined?undefined:structuredClone(v);});},
        put:function(v){rw();var c=structuredClone(v);return req(function(){st.data.set(c[st.keyPath],c);});},
        delete:function(k){rw();return req(function(){st.data.delete(k);});},
        getAll:function(){return req(function(){return Array.from(st.data.values()).map(function(v){return structuredClone(v);});});},
        clear:function(){rw();return req(function(){st.data.clear();});}};};
    setTimeout(fin);return t;}
  return {_bases:bases,open:function(name){var r={};setTimeout(function(){var b=bases[name],nuevo=!b;if(!b)b=bases[name]={stores:{}};
    r.result={objectStoreNames:{contains:function(n){return !!b.stores[n];}},createObjectStore:function(n,o){b.stores[n]={keyPath:o.keyPath,data:new Map()};},
      transaction:function(names,mode){return tx(b,[].concat(names),mode);}};
    if(nuevo&&r.onupgradeneeded)r.onupgradeneeded();if(r.onsuccess)r.onsuccess();});return r;}};}

/* Archivos sintéticos: rep_TIPO_UBIGEO+SECTOR_AAMMDD.xlsx */
var SEIS=['UA','TIT','CONS','OBRAS','RECAP','ING'];
function rep(s,day,tipos){return tipos.map(function(t){var n='rep_'+t+'_999999'+s+'_'+day.slice(2).replace(/-/g,'')+'.xlsx';return {id:n,name:n,sector:s,day:day,tipo:t};});}

(async function(){
  // 1) ANTES/DESPUÉS por sector
  var files=[].concat(
    rep('08','2026-10-02',SEIS),rep('08','2026-11-10',SEIS),rep('08','2026-11-18',SEIS),            // fechas propias, última completa
    rep('09','2026-09-25',SEIS),rep('09','2026-11-16',SEIS),rep('09','2026-11-18',SEIS.slice(0,3)), // última incompleta (3/6) → 16/11
    rep('10','2026-09-20',SEIS),rep('10','2026-11-18',SEIS.slice(0,2)),                              // sin fecha completa posterior → excluido
    rep('11','2026-11-18',SEIS),                                                                     // una sola descarga → excluido
    rep('13','2026-09-01',SEIS.slice(0,4)),rep('13','2026-09-02',SEIS),rep('13','2026-11-18',SEIS),  // original incompleta: ANTES = primera completa
    rep('14','2026-09-01',SEIS),rep('14','2026-11-18',SEIS.concat(['NUEVO'])));                      // tipo nuevo solo en la última: ANTES sigue siendo la original
  assert.strictEqual(T.drvTipo('rep_CONS_99999908_261118.xlsx'),'CONS');assert.strictEqual(T.drvTipo('otro.xlsx'),'');
  var auto=T.drvFechasAuto(files.map(function(f){return {sector:f.sector,day:f.day,tipo:T.drvTipo(f.name)};}),['08','09','10','11','12','13','14']);
  var ps=auto.porSector;
  eq([ps['08'].antes,ps['08'].despues,ps['08'].incompleto],['2026-10-02','2026-11-18','']);
  eq([ps['09'].antes,ps['09'].despues,ps['09'].incompleto],['2026-09-25','2026-11-16','18/11 incompleto (3/6)']);
  eq([ps['13'].antes,ps['13'].despues],['2026-09-02','2026-11-18']);
  eq([ps['14'].antes,ps['14'].despues],['2026-09-01','2026-11-18']);
  assert(!ps['10']&&!ps['11']&&!ps['12']);
  eq(auto.excluidos.map(function(e){return e.sector;}),['10','11','12']);
  assert.match(auto.excluidos[0].motivo,/^sin descarga completa posterior al ANTES 20\/09 · 18\/11 incompleto \(2\/6\)$/);
  assert.match(auto.excluidos[1].motivo,/^solo una descarga \(18\/11\)$/);assert.strictEqual(auto.excluidos[2].motivo,'sin reportes en Drive');
  eq(auto.avisos,['S09: 18/11 incompleto (3/6), se usa 16/11']);
  assert(auto.resumen.indexOf('S08: 02/10 → 18/11 · S09: 25/09 → 16/11 (18/11 incompleto)')===0,auto.resumen);
  assert.match(auto.resumen,/S10: excluido \(sin descarga completa/);
  // Archivos elegidos: cada sector sus dos fechas; en DESPUÉS solo los tipos de su ANTES (S14 no baja NUEVO); lado A/B por sector
  var sel=T.drvArchivosAuto(files,ps);
  function cuenta(s,lado){return sel.filter(function(f){return f.sector===s&&f.lado===lado;}).length;}
  eq(['08','09','13','14'].map(function(s){return [cuenta(s,'A'),cuenta(s,'B')];}),[[6,6],[6,6],[6,6],[6,6]]);
  assert(!sel.some(function(f){return f.sector==='10'||f.sector==='11';}));
  assert(sel.filter(function(f){return f.sector==='09';}).every(function(f){return f.day!=='2026-11-18';}));
  assert(!sel.some(function(f){return f.tipo==='NUEVO';}));

  // 2) Publicación con fechas por sector: antes = la más antigua usada, despues = la más reciente; detalle con fecha distinta / excluidos
  var fsec={};Object.keys(ps).forEach(function(s){fsec[s]={antes:ps[s].antes,despues:ps[s].despues,incompleto:ps[s].incompleto};});
  var pub=T.pubFechasSector(fsec,auto.excluidos,new Set(['08','09','10']));
  eq([pub.antes,pub.despues],['25/09/2026','18/11/2026']);
  eq(pub.detalle,['S08: fechas 02/10 → 18/11','S09: fechas 25/09 → 16/11 (18/11 incompleto (3/6))']);
  eq(pub.excluidos,['S10: excluido (sin descarga completa posterior al ANTES 20/09 · 18/11 incompleto (2/6))']);
  var mismo=T.pubFechasSector({'08':{antes:'2026-10-02',despues:'2026-11-18'}},[],new Set(['08']));eq([mismo.antes,mismo.despues,mismo.detalle,mismo.excluidos],['02/10/2026','18/11/2026',[],[]]);
  assert.strictEqual(T.pubFechasSector(null,[],new Set(['08'])),null);assert.strictEqual(T.pubFechasSector(fsec,[],new Set(['77'])),null);
  assert.match(html,/antes:extra&&extra\.antes\|\|range\('A'\),despues:extra&&extra\.despues\|\|range\('B'\)/);
  assert.match(html,/pubFechasSector\(district\.fechasSector,district\.excluidos,sectors\)/);

  // 3) Caché: clave, guardado, lectura con último uso, cambio en Drive → re-descarga y borra la vieja, vencimiento por último uso
  var item={id:'f1',name:'rep_UA_99999908_261118.xlsx',size:3,modificado:'2026-11-18T10:00:00Z'};
  assert.strictEqual(T.cacheClave(item),'f1|2026-11-18T10:00:00Z|3');assert.strictEqual(T.cacheClave({id:'f1',size:3}),'');
  var idb=fakeIDB(),db=await T.cacheAbrir(idb);assert(db);
  var bajadas=0;function bajar(it){bajadas++;return Promise.resolve({nombre:it.name,bytes:new Uint8Array([bajadas,2,3])});}
  var t0=Date.UTC(2026,10,1),cont={};
  var r1=await T.drvFileCache(item,db,bajar,t0,cont);assert.strictEqual(r1.deCache,false);assert.strictEqual(bajadas,1);
  var r2=await T.drvFileCache(item,db,bajar,t0+6*DIA,cont);assert.strictEqual(r2.deCache,true);assert.strictEqual(bajadas,1);eq(Array.from(r2.bytes),[1,2,3]);
  eq([cont.cache,cont.drive],[1,1]);
  var meta=idb._bases['vc-cmp-cache'].stores.meta.data;assert.strictEqual(meta.get(T.cacheClave(item)).ultimoUso,t0+6*DIA);
  assert.strictEqual(await T.cacheTamano(db),3);assert.strictEqual(T.cacheMB(85*1048576),'85 MB');assert.strictEqual(T.cacheMB(1.5*1048576),'1.5 MB');assert.strictEqual(T.cacheMB(0),'0 MB');assert.strictEqual(T.cacheMB(10),'< 0.1 MB');
  // Día 8 desde el guardado pero 2 desde el último uso: se conserva
  assert.strictEqual(await T.cacheVencer(db,t0+8*DIA),0);assert.strictEqual(meta.size,1);
  // Cambió en Drive (modificado): se baja de nuevo y la versión vieja se borra
  var nuevo=Object.assign({},item,{modificado:'2026-11-19T08:00:00Z'});
  var r3=await T.drvFileCache(nuevo,db,bajar,t0+9*DIA,cont);assert.strictEqual(r3.deCache,false);assert.strictEqual(bajadas,2);
  eq(Array.from(meta.keys()),[T.cacheClave(nuevo)]);eq(Array.from(idb._bases['vc-cmp-cache'].stores.datos.data.keys()),[T.cacheClave(nuevo)]);
  // Cambió el tamaño (mismo modificado): también se baja de nuevo
  await T.drvFileCache(Object.assign({},nuevo,{size:4}),db,bajar,t0+9*DIA,cont);assert.strictEqual(bajadas,3);assert.strictEqual(meta.size,1);
  // Más de 7 días sin usarse: se borra al abrir la página
  assert.strictEqual(await T.cacheVencer(db,t0+9*DIA+T.CACHE_VIGENCIA+1),1);assert.strictEqual(meta.size,0);
  assert.strictEqual(idb._bases['vc-cmp-cache'].stores.datos.data.size,0);
  // Sin "modificado" no se cachea; "Borrar datos guardados" vacía todo
  var sinMod={id:'f2',name:'x.xlsx',size:1};await T.drvFileCache(sinMod,db,bajar,t0,{});await T.drvFileCache(sinMod,db,bajar,t0,{});assert.strictEqual(bajadas,5);assert.strictEqual(meta.size,0);
  await T.drvFileCache(item,db,bajar,t0,{});assert.strictEqual(meta.size,1);assert(await T.cacheVaciar(db));assert.strictEqual(meta.size,0);assert.strictEqual(await T.cacheTamano(db),0);

  // 4) Sin IndexedDB (modo privado) o con fallos: se sigue sin caché, bajando de Drive
  assert.strictEqual(await T.cacheAbrir(null),null);assert.strictEqual(await T.cacheAbrir(undefined),null);
  assert.strictEqual(await T.cacheAbrir({open:function(){throw new Error('SecurityError');}}),null);
  assert.strictEqual(await T.cacheAbrir({open:function(){var r={};setTimeout(function(){r.onerror();});return r;}}),null);
  var c0={},rs=await T.drvFileCache(item,null,bajar,t0,c0);assert.strictEqual(rs.deCache,false);assert.strictEqual(c0.cache,undefined);assert.strictEqual(c0.drive,1);
  var roto={transaction:function(){throw new Error('QuotaExceededError');}},c1={};
  rs=await T.drvFileCache(item,roto,bajar,t0,c1);assert.strictEqual(rs.deCache,false);assert.strictEqual(c1.drive,1);assert.match(c1.errorCache,/Quota/);
  assert.strictEqual(await T.cacheVencer(null,t0),0);assert.strictEqual(await T.cacheTamano(null),0);
  // Un error de Drive sí se propaga (lo maneja el reintento de siempre)
  await assert.rejects(T.drvFileCache(item,null,function(){return Promise.reject(new Error('No se pudo conectar con Drive.'));},t0,{}),/No se pudo conectar/);
  // drvFile pasa por la caché
  assert.match(html,/drvFileCache\(item,await cacheDb\(\),drvBajar,Date\.now\(\),cont\)/);

  // 5) Repetir última carga
  [undefined,null,{},{polygon:'p'},{polygon:'p',district:'d'},{polygon:'p',district:'d',sectors:[]}].forEach(function(c){var r=T.drvRepetible(c);assert.strictEqual(r.ok,false);assert.match(r.motivo,/^Sin última carga guardada/);});
  assert.match(T.drvRepetible({polygon:'p',district:'d'}).motivo,/falta sectores/);
  assert.strictEqual(T.drvRepetible({polygon:'p',district:'d',sectors:['99999908']}).ok,true);
  assert.match(html,/id="drvRepeat" disabled/);

  // 6) Panel de pendientes: hash sincronizado con el polígono; recarga solo cuando se pide
  var BASE='https://validacatastral.github.io/vc-pendientes/';
  assert.strictEqual(T.pendUrl(''),BASE);assert.strictEqual(T.pendUrl(null),BASE);assert.strictEqual(T.pendUrl('999999001'),BASE+'#pol=999999001');
  assert.strictEqual(T.pendUrl('999999001',123),BASE+'?r=123#pol=999999001');
  var attrs={},frame={getAttribute:function(k){return attrs[k]===undefined?null:attrs[k];},setAttribute:function(k,v){attrs[k]=String(v);if(k==='src')cambios++;}},cambios=0;
  T.pendAplicar(frame,'',0);assert.strictEqual(attrs.src,BASE);assert.match(attrs.title,/portada/);
  T.pendAplicar(frame,'999999001',0);assert.strictEqual(attrs.src,BASE+'#pol=999999001');assert.match(attrs.title,/polígono 999999001/);
  T.pendAplicar(frame,'999999001',0);assert.strictEqual(cambios,2);                                  // mismo polígono: no se toca
  T.pendAplicar(frame,'999999001',555);assert.strictEqual(attrs.src,BASE+'?r=555#pol=999999001');    // tras publicar: recarga real
  T.pendAplicar(frame,'999999002',555);assert.strictEqual(attrs.src,BASE+'?r=555#pol=999999002');    // cambio de polígono: solo el hash
  assert.strictEqual(T.pendAplicar(null,'999999003',0),BASE+'#pol=999999003');                       // sin iframe (panel cerrado) no falla
  assert(!/<iframe/i.test(html),'el iframe se crea solo al abrir el panel');

  console.log('OK: fechas ANTES/DESPUÉS por sector, publicación coherente, caché IndexedDB (clave, último uso, cambio en Drive, sin IndexedDB), repetir y panel de pendientes');
})().catch(function(e){console.error(e);process.exitCode=1;});
