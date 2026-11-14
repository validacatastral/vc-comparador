/* Prueba de reportes faltantes, registro de descargas y publicación de polígonos completos.
   Datos sintéticos; no usa datos reales. Uso: node tests/publicacion-reportes-faltantes.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('function txt(v){','function normVal'),cut('/* ============ Reportes faltantes','function gapCodes'),cut('function c2bucket','\n'),cut('var PUB_COUNTS','\n'),cut('function pubCounts','\n')].join('\n');
var T=vm.runInNewContext(src+'\n({gapAnalyze:gapAnalyze,pubPlan:pubPlan,regIndex:regIndex,regFecha:regFecha,c2bucket:c2bucket,pubCounts:pubCounts});');

var F={A:'2026-11-10',B:'2026-11-14'}, S18='15011218', S25='15011225', S35='15011235';
function P(o){var out={};['UA','TIT','CON','OBR','REC','ING'].forEach(function(r){out[r]={A:(o[r]||[[],[]])[0],B:(o[r]||[[],[]])[1]};});return out;}
function gap(r,sec,rep){return r.gaps.filter(function(g){return g.sector===sec&&g.rep===rep;})[0];}
var todos=[S18,S25,S35], base={UA:[todos,todos],TIT:[todos,todos],CON:[todos,todos],OBR:[todos,todos],REC:[todos,todos],ING:[todos,todos]}, r, g;
function con(o){return P(Object.assign({},base,o));}

// 0) Todo completo: sin avisos
r=T.gapAnalyze(con({}),F,null);assert.strictEqual(r.bloquea,false);assert.strictEqual(r.gaps.length,0);

// 1) Polígono incompleto omitido; el completo se publica
var plan=T.pubPlan([{code:'260710148',sectors:['18']},{code:'260110002',sectors:['25','27']},{code:'260210019',sectors:['18','19']}],{A:new Set(['18','25']),B:new Set(['18','25'])});
assert.deepStrictEqual(Array.from(plan.publicar),['260710148']);
assert.deepStrictEqual(Array.from(plan.omitir.map(function(o){return o.code+':'+o.faltan.join(',');})),['260110002:27','260210019:19']);
assert.strictEqual(plan.texto,'Se publicarán: 260710148 · Se omiten (sectores incompletos): 260110002 (faltan S27), 260210019 (faltan S19)');
plan=T.pubPlan([{code:'260110002',sectors:['25']}],{A:new Set(['25']),B:new Set()});assert.strictEqual(plan.publicar.length,0,'cargado en una sola fecha no es completo');
console.log('ok polígono incompleto omitido · '+T.pubPlan([{code:'260710148',sectors:['18']},{code:'260110002',sectors:['25','27']}],{A:new Set(['18','25']),B:new Set(['18','25'])}).texto);

// 2) Falta en UNA fecha (UA S18 14/11) sin registro disponible → aviso amarillo, cruce parcial
r=T.gapAnalyze(con({UA:[todos,[S25,S35]]}),F,null);g=gap(r,S18,'UA');
assert.strictEqual(r.bloquea,false);assert.strictEqual(r.gaps.length,1);assert.strictEqual(g.falta,'B');assert.strictEqual(g.tipo,'parcial');
assert.strictEqual(g.motivo,'falta UA 14/11');assert.strictEqual(g.texto,'⚠ S18 · UA · 14/11: falta en esta fecha');
console.log('ok falta en una fecha · '+g.texto+' → ⏸ Sin comparar ('+g.motivo+')');

// 3) Falta en AMBAS fechas → línea informativa gris, no es cruce parcial
r=T.gapAnalyze(con({REC:[[S18,S35],[S18,S35]]}),F,null);g=gap(r,S25,'REC');
assert.strictEqual(g.falta,'AB');assert.strictEqual(g.tipo,'info');assert.strictEqual(g.motivo,'sector sin RECAP');
assert.strictEqual(g.texto,'ℹ S25 sin RECAP en ambas fechas (el sector no lo tiene)');assert(!r.gaps.some(function(x){return x.tipo==='parcial';}));
console.log('ok falta en ambas · '+g.texto+' → ⏸ Sin comparar ('+g.motivo+')');

// 4) Sin NINGÚN reporte en una de las dos fechas → bloquea
r=T.gapAnalyze(P({UA:[todos,[]],CON:[todos,[]]}),F,null);assert.strictEqual(r.bloquea,true);
r=T.gapAnalyze(P({}),F,null);assert.strictEqual(r.bloquea,true);
console.log('ok sin ningún reporte en una fecha → bloquea');

// 5) VACIO: S35 RECAP 14/11 → ℹ vacío en SICUN; se trata como falta en ambas, no es cruce parcial
var REG=[
  {fecha:'2026-11-14',codigo:S35,reporte:'RECAP',estado:'FALLO',registros:0,nota:'timeout'},     // reintento anterior
  {fecha:'2026-11-14',codigo:S35,reporte:'RECAP',estado:'VACIO',registros:0,nota:''},            // vale la ÚLTIMA
  {fecha:'14/11/2026',codigo:S18,reporte:'UA',estado:'FALLO',registros:0,nota:''},
  {fecha:'2026-11-14',codigo:S25,reporte:'CONS',estado:'SOSPECHOSO',registros:3,nota:'pocos registros'},
  {fecha:'2026-11-10',codigo:S18,reporte:'OBC',estado:'OK',registros:120,nota:''}
];
r=T.gapAnalyze(con({REC:[todos,[S18,S25]]}),F,REG);g=gap(r,S35,'REC');
assert.strictEqual(g.tipo,'info');assert.strictEqual(g.texto,'ℹ S35 · RECAP · 14/11: vacío en SICUN');assert.strictEqual(g.motivo,'RECAP vacío en SICUN 14/11');
console.log('ok VACIO · '+g.texto);

// 6) FALLO → ⚠ falló la descarga (cruce parcial)
r=T.gapAnalyze(con({UA:[todos,[S25,S35]]}),F,REG);g=gap(r,S18,'UA');
assert.strictEqual(g.tipo,'parcial');assert.strictEqual(g.texto,'⚠ S18 · UA · 14/11: falló la descarga, vuelve a bajarlo');
console.log('ok FALLO · '+g.texto);

// 7) Sin registro → ⚠ no se descargó
r=T.gapAnalyze(con({TIT:[todos,[S18,S35]]}),F,REG);g=gap(r,S25,'TIT');
assert.strictEqual(g.tipo,'parcial');assert.strictEqual(g.texto,'⚠ S25 · TIT · 14/11: no se descargó');
console.log('ok sin registro · '+g.texto);

// 8) SOSPECHOSO → se compara, con ⚠
r=T.gapAnalyze(con({}),F,REG);assert.strictEqual(r.gaps.length,0);
assert.deepStrictEqual(Array.from(r.avisos),['⚠ S25 · CONS · 14/11: descarga SOSPECHOSA, se comparó igual (pocos registros)']);
console.log('ok SOSPECHOSO · '+r.avisos[0]);

// 9) Endpoint caído (registro null) → misma lógica de la sección 2, sin romper
r=T.gapAnalyze(con({REC:[todos,[S18,S25]]}),F,null);g=gap(r,S35,'REC');
assert.strictEqual(g.tipo,'parcial');assert.strictEqual(g.texto,'⚠ S35 · RECAP · 14/11: falta en esta fecha');assert.strictEqual(r.avisos.length,0);
console.log('ok endpoint caído · '+g.texto);

// 10) "⏸ Sin comparar" no cuenta como confirmado, ni pendiente, ni en el total
assert.strictEqual(T.c2bucket('⏸ Sin comparar (falta UA 14/11)'),6);
var c=T.pubCounts([{result:'✔ VERIFICADO'},{result:'⚠ SIN CAMBIO EN SICUN'},{result:'⏸ Sin comparar (falta UA 14/11)'}]);
assert.strictEqual(c.filas,2);assert.strictEqual(c.verificado,1);assert.strictEqual(c.sinCambio,1);assert.strictEqual(Object.keys(c).length,7);
assert.strictEqual(T.regFecha('14/11/2026'),'2026-11-14');assert.strictEqual(T.regFecha('2026-11-14T05:00:00.000Z'),'2026-11-14');
console.log('ok publicación y reportes faltantes');
