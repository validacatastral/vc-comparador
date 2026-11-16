/* Cambio por piso en validadores CRC+PISO. Datos sintéticos. Uso: node tests/cambio-por-piso.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
var n=0;html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,function(_,code){n++;new vm.Script(code,{filename:'index.html<script '+n+'>'});});
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','var C2_MAP'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('var CRC_PARTS','function crcHtml'),
  cut('function c2norm','\n'),cut('function c2floor','\n'),cut('/* Criterio APLICA','function c2rows(){')].join('\n');
var T=vm.runInNewContext(src+'\n({M:CAMPOS_VALIDADOR,kind:c2eventKind,cls:c2classify,split:c2pisoSplit});');
var CRC='150112220100010101010012', F='Código De Actividad Económica (CIIU)';
var ev=[{key:CRC,report:'CON',field:F,type:'cell',before:'4711',after:'5610',rowA:{p:'3'},rowB:{p:'3'}}];
function floors(e){return [e.rowA,e.rowB].filter(Boolean).map(function(r){return String(parseInt(r.p,10));});}
function fila(piso,events,state){var map=T.M.VAL_USO_CIIU,s=T.split(events,piso,floors,function(e){return T.kind(map,e,function(){return true;});});
  return {r:T.cls(state||'NO APLICA',s.hits.length,s.otros.length),s:s};}
['2','3','4','5'].forEach(function(p){var x=fila(p,ev);
  if(p==='3'){assert.strictEqual(x.r.result,'ℹ NO APLICA pero SICUN cambió');assert.strictEqual(x.s.hits.length,1);}
  else{assert.strictEqual(x.r.result,'✔ NO APLICA CONFIRMADO','piso '+p);assert.strictEqual(x.s.otroPiso.length,1);}
  console.log('ok piso '+p+' → '+x.r.result+(x.s.otroPiso.length?' · nota otro piso':''));});
// APLICA piso 2: sin cambio propio aunque piso 3 cambió
assert.strictEqual(fila('2',ev,'APLICA').r.result,'⚠ SIN CAMBIO EN SICUN');
// Fila sin piso: comportamiento previo (cuenta + nota cruzado sin piso)
var x=fila('',ev);assert.strictEqual(x.r.result,'ℹ NO APLICA pero SICUN cambió');assert(x.s.sinPiso);
// Renombre de piso 3→4: cuenta para ambos pisos
var ren=[Object.assign({},ev[0],{rowB:{p:'4'}})];
assert.strictEqual(fila('3',ren).s.hits.length,1);assert.strictEqual(fila('4',ren).s.hits.length,1);assert.strictEqual(fila('5',ren).s.otroPiso.length,1);
// Validador no CRC+PISO (piso null): sin filtro
assert.strictEqual(T.split(ev,null,function(){throw 0;},function(){return 'obs';}).hits.length,1);
// OTRO CAMBIO cuenta cambios de cualquier piso del CRC, marcados con su piso. Caso real: piso 2, CIIU cambió solo en piso 1 (1075→5610)
var C2='150112180110410101010013', p1=[{key:C2,report:'CON',field:'CIIU',type:'cell',before:'1075',after:'5610',rowA:{p:'1'},rowB:{p:'1'}}];
function otro(piso,events,state){var map=T.M.VAL_USO_CIIU,s=T.split(events,piso,floors,function(e){return T.kind(map,e,function(){return true;});},state==='OTRO CAMBIO');return {r:T.cls(state,s.hits.length,s.otros.length),s:s};}
var oc=otro('2',p1,'OTRO CAMBIO');assert.strictEqual(oc.r.result,'✔ CAMBIÓ');assert.strictEqual(oc.s.otroPiso.length,0);
assert.strictEqual(oc.s.hits.concat(oc.s.otros).map(function(e){return e.report+' · '+e.field;}).join('|'),'CON · CIIU (P1)');
assert.strictEqual(p1[0].field,'CIIU','no muta el evento original');
// APLICA y NO APLICA siguen contando solo el mismo piso
assert.strictEqual(otro('2',p1,'APLICA').r.result,'⚠ SIN CAMBIO EN SICUN');assert.strictEqual(otro('2',p1,'NO APLICA').r.result,'✔ NO APLICA CONFIRMADO');
// Mismo piso en OTRO CAMBIO: sin marca de piso
assert.strictEqual(otro('1',p1,'OTRO CAMBIO').s.hits.concat(otro('1',p1,'OTRO CAMBIO').s.otros)[0].field,'CIIU');
// Publicación: usa los campos de la fila (los mismos del estado); ⚠ SIN CAMBIO nunca lista campos
var pf=vm.runInNewContext(cut('function pubFields(row,events){','\n}')+'\n}\npubFields');
assert.strictEqual(pf({campos:'CON · CIIU (P1)'},p1),'CON · CIIU (P1)');assert.strictEqual(pf({campos:''},p1),'');
assert(/campos=c2bucket\(status\)===2\?'':/.test(html),'⚠ SIN CAMBIO sin campos');
console.log('ok OTRO CAMBIO cualquier piso · CON · CIIU (P1) · publicación = campos del estado');
console.log('ok renombre de piso · sin piso · sintaxis '+n+' <script>');
