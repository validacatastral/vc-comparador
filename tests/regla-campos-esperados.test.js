/* Regla de estado por campos esperados + columna "Observación vs Antes → Después".
   Esperado + extra → ✔ VERIFICADO con nota "También cambió"; solo extra → ◐ CAMBIÓ OTRO CAMPO; NO APLICA no cambia.
   La columna nueva va solo al Excel descargado, nunca a la publicación. Datos sintéticos. Uso: node tests/regla-campos-esperados.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','var C2_MAP'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),cut('var CRC_PARTS','function crcHtml'),
  cut('function c2norm','\n'),cut('/* Criterio APLICA','function c2rows(){')].join('\n');
var T=vm.runInNewContext(src+'\n({M:CAMPOS_VALIDADOR,c2eventKind:c2eventKind,c2classify:c2classify,c2obsCambios:c2obsCambios,c2cambios:c2cambios});');
var KEY='150112190370070101010015';
function ev(report,field,before,after){return {key:KEY,type:'cell',report:report,field:field,before:before||'a',after:after||'b'};}
function cruce(validator,state,events){var hits=[],otros=[];events.forEach(function(e){(T.c2eventKind(T.M[validator],e,function(){return true;})==='otro'?otros:hits).push(e);});
  return {cls:T.c2classify(state,hits.length,otros.length),hits:hits,otros:otros};}
var EXTRA=ev('ING','Campo Ajeno Al Validador','1','2');

// 1) TODOS los validadores: cada campo esperado (observado o relacionado), solo o con un extra, da ✔ VERIFICADO; solo el extra da ◐.
var total=0;
Object.keys(T.M).forEach(function(v){var map=T.M[v];
  ['observados','relacionados'].forEach(function(kind){Object.keys(map[kind]||{}).forEach(function(rep){if(rep==='CRC')return;map[kind][rep].forEach(function(f){total++;
    var solo=cruce(v,'APLICA',[ev(rep,f)]),conExtra=cruce(v,'APLICA',[EXTRA,ev(rep,f)]);
    assert.strictEqual(solo.cls.result,'✔ VERIFICADO',v+' · '+rep+' · '+f);assert.strictEqual(!!solo.cls.extra,false);
    assert.strictEqual(conExtra.cls.result,'✔ VERIFICADO',v+' · '+rep+' · '+f+' + extra');assert.strictEqual(conExtra.cls.extra,true,'nota "También cambió" en '+v);
  });});});
  var soloExtra=cruce(v,'APLICA',[EXTRA]);
  assert.strictEqual(soloExtra.cls.result,'◐ CAMBIÓ OTRO CAMPO',v+' solo extra');assert.strictEqual(soloExtra.cls.suggestion,'posible OTRO CAMBIO');
  assert.strictEqual(cruce(v,'APLICA',[]).cls.result,'⚠ SIN CAMBIO EN SICUN');
});
assert(total>=50,'campos esperados revisados: '+total);

// 2) VAL_USO_CIIU acepta UA · Código De Uso / Descripción Del Uso además de CON · CIIU
[['UA','Código De Uso'],['UA','Descripción Del Uso'],['CON','Código De Actividad Económica (CIIU)']].forEach(function(c){
  assert.strictEqual(cruce('VAL_USO_CIIU','APLICA',[ev(c[0],c[1])]).cls.result,'✔ VERIFICADO',c.join(' · '));
  assert.strictEqual(cruce('VAL_USO_CIIU','APLICA',[ev(c[0],c[1]),ev('CON','Área Verificada')]).cls.extra,true);});
assert.strictEqual(cruce('VAL_USO_CIIU','APLICA',[ev('CON','Área Verificada')]).cls.result,'◐ CAMBIÓ OTRO CAMPO');

// 3) NO APLICA y OTRO CAMBIO no cambian
assert.deepStrictEqual(JSON.parse(JSON.stringify([cruce('VAL_USO_CIIU','NO APLICA',[]).cls,cruce('VAL_USO_CIIU','NO APLICA',[EXTRA]).cls,cruce('VAL_USO_CIIU','NO APLICA',[ev('UA','Código De Uso')]).cls,cruce('VAL_USO_CIIU','OTRO CAMBIO',[EXTRA]).cls])),
  [{result:'✔ NO APLICA CONFIRMADO',omit:true},{result:'✔ NO APLICA CONFIRMADO',extra:true},{result:'ℹ NO APLICA pero SICUN cambió',suggestion:'debería ser APLICA'},{result:'✔ CAMBIÓ'}]);

// 4) Observación vs Antes → Después: primero los esperados, luego el resto
var c=cruce('VAL_USO_CIIU','APLICA',[ev('CON','Área Verificada','50','60'),ev('UA','Código De Uso','010101','020202')]);
assert.strictEqual(T.c2obsCambios('  corregir uso  ',c.hits,c.otros),'Observación: corregir uso ‖ Esperado: UA · Código De Uso: 010101 → 020202 ‖ También cambió: CON · Área Verificada: 50 → 60');
assert.strictEqual(T.c2obsCambios('x',[],c.otros),'Observación: x ‖ Otro campo: CON · Área Verificada: 50 → 60');
assert.strictEqual(T.c2obsCambios('',[],[]),'Observación: (sin observación) ‖ Sin cambio en SICUN');
assert.strictEqual(T.c2cambios(c.hits,c.otros,5),'Esperado: UA · Código De Uso: 010101 → 020202 ‖ También cambió: CON · Área Verificada: 50 → 60');
var muchos=[];for(var i=0;i<25;i++)muchos.push(ev('UA','Código De Uso',String(i),String(i+1)));
assert(/\| \+5 más$/.test(T.c2obsCambios('x',muchos,[])));assert(T.c2obsCambios('x'.repeat(9000),[],[]).length<=5000);

// 5) Excel: las columnas existentes conservan su orden y CRC nuevo se agrega al final
var sheets=cut('function c2sheets(','\n');
var antes=['Polígono','Hoja','Técnico','Validador','Regla FI','Código (CRC/ID_LOTE)','Sec-Mz-Lt','Piso','Estado revisor','Mensaje validador','Observación','Reporte SICUN','Campos esperados','Verificación SICUN','Verificación SICUN (sin revisión)','Qué cambió','Nota'];
var head=JSON.parse(sheets.match(/head=(\[[^\]]+\])/)[1].replace(/'/g,'"'));
assert.deepStrictEqual(head,antes.concat(['Observación vs Antes → Después','Nivel','Revisión','CRC nuevo']));
assert(/r\.report,r\.expected,c2bucket\(r\.result\)===2\?c2SinCambioDetalle\(r\):r\.result,r\.resultadoSicun\|\|r\.result,r\.change,r\.note,r\.obsChange,r\.nivel\|\|\x27\x27,r\.revision\|\|\x27\x27,r\.crcNuevo\|\|''\]\)/.test(sheets),'la fila termina en la columna nueva');

// 6) La columna (observación y valores) NO va a "Publicar pendientes": la proyección publicada no la referencia
var pub=cut('function pubFields(row,events){','async function pubPost(');
assert(!/obsChange|changeView|c2obsCambios|c2cambios|\.change\b|\.before|\.after|\.message/.test(pub),'la publicación no lleva valores SICUN ni la columna nueva');
assert(/addNote\('También cambió: '\+names\(otros\)\)/.test(html),'nota "También cambió: X, Y" (solo nombres de campo)');
console.log('ok regla por campos esperados ('+total+' campos, '+Object.keys(T.M).length+' validadores) · columna solo en Excel');
