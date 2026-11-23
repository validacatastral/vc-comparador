/* Estado final en SICUN para USO_CIIU, COND_PREDIO_EN, VAL_PRODUCTO / MEP_MEDIDA_PRODUCTO y VAL_CRC (filas ⚠ SIN CAMBIO).
   Uso: node tests/estado-final-otros.test.js */
'use strict';
var assert=require('assert'),vm=require('vm');
var {T,ctx,KEY,fila,run,cut,stubs,src}=require('./estado-final-helper');
function sigue(r,regla,m){assert(r.result==='⚠ SIN CAMBIO EN SICUN'||(r.result.indexOf('◐ Cambió pero sigue mal: ')===0&&r.result.indexOf('('+regla+')')>0&&/cambió antes de la descarga ANTES/.test(r.note)),(m||'')+r.result);}   /* ⚠ (b) o ◐ si el inicial difiere (a) */
var K='150110680440060102010015';
var HUA=[KEY,'Código De Uso','Clasificación Del Predio','Predio Catastral En'], HCON=[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'];
var MSG_CIIU='Inconsistencia, código de actividad económica (CIIU) no debe estar vacío (FI.32.03)';

// USO_CIIU
var r=run([ctx('UA',HUA,[[K,'020304','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','    ','TERMINADO']])],fila('VAL_USO_CIIU',K,'OTRO CAMBIO',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu pasó a 020304 → ✔');
r=run([ctx('UA',HUA,[[K,'020304','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','    ','TERMINADO']])],fila('VAL_USO_CIIU',K,'OTRO CAMBIO',MSG_CIIU,'1',{codigodeuso:'020304',codigodeactividadeconomicaciiu:''}));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/posible falso error/.test(r.note)&&/NO APLICA/.test(r.note),r.note);console.log('ok ciiu 020304 sin cambio desde la validación → ⚠ falso error / NO APLICA');
r=run([ctx('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','    ','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert(r.result.startsWith('◐ Cambió pero sigue mal: ')&&/\(R3A\)/.test(r.result),r.result);assert(/R3A/.test(r.note));console.log('ok ciiu 020105 sin CIIU → ◐ R3A');
r=run([ctx('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','4719','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu con CIIU → ✔');
r=run([ctx('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu vivienda → ✔');
r=run([ctx('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx('CON',HCON,[[K,'1','','02 - EN CONSTRUCCIÓN']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_CIIU,'1'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok ciiu obra no terminada → ✔');

// COND_PREDIO_EN
var MSG_CP='Inconsistencia, la clasificación del predio no coincide con predio catastral en (FI.24.03)';
r=run([ctx('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO EN EDIFICIO']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_CP));
assert(/^◐ Cambió pero sigue mal: .*\(R1\)/.test(r.result),r.result);assert(/R1/.test(r.note));console.log('ok predio R1 (inicial distinto) → ◐ sigue mal');
r=run([ctx('UA',HUA,[[K,'010101','PREDIO EN EDIFICIO','PREDIO EN EDIFICIO']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_CP));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok predio coherente → ✔');

// OBRAS
var HOBR=[KEY,'Código','Descripción','MEP','Producto Total','Unidad de Medida','UCA'];
r=run([ctx('OBR',HOBR,[[K,'50','PARAPETO','02','1','m²','']])],fila('VAL_PRODUCTO',K,'APLICA','Verificar producto de obra complementaria'));
sigue(r,'R1','');assert(/R1/.test(r.note),r.note);console.log('ok producto = 1 → ⚠');
r=run([ctx('OBR',HOBR,[[K,'50','PARAPETO','02','12.5','m²','']])],fila('VAL_PRODUCTO',K,'APLICA','Verificar producto de obra complementaria'));
assert.strictEqual(r.result,'✔ CUMPLE EN SICUN',r.result);console.log('ok producto corregido → ✔');
r=run([ctx('OBR',HOBR,[[K,'50','PARAPETO','01','12.5','m²','']])],fila('VAL_MEP_MEDIDA_PRODUCTO',K,'APLICA','Verificar MEP (FI.29.03)'));
sigue(r,'R5','');assert(/R5/.test(r.note),r.note);console.log('ok MEP mal → ⚠ R5');

// VAL_CRC
var E='1501106804400601';   // ubigeo+sec+mz+lote+edif 01
var bien=[E+'0101001'+'5',E+'0101002'+'5',E+'0102001'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,bien)],fila('VAL_CRC',E+'01010015','APLICA','Verificar estructura del CRC (FI.02.04)'));
assert.strictEqual(r.result,'⚠ SIN CAMBIO EN SICUN',r.result);assert(/Sin cambio desde la validación: estructura del CRC conforme/.test(r.note),r.note);console.log('ok crc correlativo sin valores iniciales → ⚠ posible falso error');
var salto=[E+'0101001'+'5',E+'0101003'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,salto)],fila('VAL_CRC',E+'01010035','APLICA','Salto de numeración (FI.02.04)'));   /* el salto se marca en la unidad siguiente al hueco (003), como VAL_CRC.html */
sigue(r,'R5','');assert(/R5/.test(r.note),r.note);console.log('ok crc salto → ⚠ R5');
// VAL_CRC como el validador: entrada 99 / unidad 999 se excluyen por campo; sótanos 81 correlativos
var conComun=[E+'0101001'+'5',E+'0101002'+'5',E+'9999999'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,conComun)],fila('VAL_CRC',E+'01010025','APLICA','Verificar estructura del CRC (FI.02.04)'));
assert(/Sin cambio desde la validación: estructura del CRC conforme/.test(r.note),r.note);console.log('ok crc con 99/999 excluidos → estructura conforme');
var sot=[E+'0101001'+'5',E+'0182001'+'5'].map(function(k){return [k,'010101','CASA HABITACION','PREDIO INDEPENDIENTE'];});
r=run([ctx('UA',HUA,sot)],fila('VAL_CRC',E+'01820015','APLICA','Verificar estructura del CRC (FI.02.04)'));
sigue(r,'R6','');assert(/R6/.test(r.note),r.note);console.log('ok crc sótano 82 sin 81 → ⚠ R6');
// POSEEDOR + OTROS es válido (R5 solo aplica a POSESIÓN sin POSEEDOR)
var Tt=vm.runInNewContext(stubs+src+'\n({reglas:c2titularReglas});');
assert.strictEqual(JSON.stringify(Tt.reglas({condiciondeltitular:'POSEEDOR',formadeadquisicion:'OTROS',tipodedocumento:''},K)),'[]');
assert.strictEqual(JSON.stringify(Tt.reglas({condiciondeltitular:'PROPIETARIO',formadeadquisicion:'POSESIÓN',tipodedocumento:''},K)),JSON.stringify(['R5']));
console.log('ok titular POSEEDOR+OTROS → sin error · PROPIETARIO+POSESIÓN → R5');

/* ===== Cambió pero sigue mal: las reglas del paso 3 también se aplican a ✔ VERIFICADO / ✔ CAMBIÓ (propia unidad).
   Cumple → ✔ igual; incumple → "◐ Cambió pero sigue mal: <regla>" (bucket 8, pendiente). Datos sintéticos. */
function ctx2(id,H,rowsA,rowsB){var o=function(v){var r={};H.forEach(function(c,i){r[c]=v[i];});return r;};var c={preset:{id:id,key:KEY},A:{headers:H,rows:rowsA.map(o)},B:{headers:H,rows:rowsB.map(o)}};c.RES=T.compareCtx(c);return c;}
function sm(r,regla,msg){assert.strictEqual(String(r.result).replace(/^(◐ Cambió pero sigue mal: ).*?\(([A-Z0-9]+)\)(?: · .*)?$/,'$1$2'),'◐ Cambió pero sigue mal: '+regla,msg+': '+r.result);assert.strictEqual(T.bucket(r.result),8);}
function ok(r,res,msg){assert.strictEqual(r.result,res,msg+': '+r.result);assert.strictEqual(T.bucket(r.result),0);}
// TITULAR_INSCRIPCION
var HT=[KEY,'Condición del Titular','Forma de Adquisición','Tipo de Documento','Tipo de Partida Registral','Número de Partida Registral','Clasificación Del Predio'];
var MSG_TD='Inconsistencia, condición de titular incongruente con tipo de documento (FI.12.04)', TMAL=[K,'POSEEDOR','OTROS','ESCRITURA PÚBLICA','','','CASA HABITACION'];
ok(run([ctx2('UA',HT,[TMAL],[[K,'POSEEDOR','OTROS','','','','CASA HABITACION']])],fila('VAL_TITULAR_INSCRIPCION',K,'APLICA',MSG_TD)),'✔ VERIFICADO','tit a');
sm(run([ctx2('UA',HT,[TMAL],[[K,'POSEEDOR','OTROS','ESCRITURA IMPERFECTA','','','CASA HABITACION']])],fila('VAL_TITULAR_INSCRIPCION',K,'APLICA',MSG_TD)),'R2P','tit b');
sm(run([ctx2('UA',HT,[TMAL],[[K,'POSEEDOR','OTROS','ESCRITURA IMPERFECTA','','','CASA HABITACION']])],fila('VAL_TITULAR_INSCRIPCION',K,'OTRO CAMBIO',MSG_TD)),'R2P','tit b OTRO CAMBIO');
ok(run([ctx2('UA',HT,[TMAL],[[K,'POSEEDOR','OTROS','ESCRITURA IMPERFECTA','','','PARQUE']])],fila('VAL_TITULAR_INSCRIPCION',K,'APLICA',MSG_TD)),'✔ VERIFICADO','tit c PARQUE');
var K99='150110680440069999999995';
r=run([ctx2('UA',HT,[[K99,'POSEEDOR','OTROS','ESCRITURA PÚBLICA','','','CASA HABITACION']],[[K99,'POSEEDOR','OTROS','ESCRITURA IMPERFECTA','','','CASA HABITACION']])],fila('VAL_TITULAR_INSCRIPCION',K99,'APLICA',MSG_TD));
ok(r,'✔ VERIFICADO','tit c lote 99-99-999');assert(/Ojo, además: R2/.test(r.note),r.note);
r=run([ctx2('UA',HT.concat(['Código De Uso']),[TMAL.concat(['010101'])],[TMAL.concat(['020105'])])],fila('VAL_TITULAR_INSCRIPCION',K,'APLICA',MSG_TD));
assert.strictEqual(r.result,'◐ CAMBIÓ OTRO CAMPO','◐ otro campo no cambia: '+r.result);
console.log('ok sigue mal · titular (✔ / R2P / OTRO CAMBIO / PARQUE / 99-99-999 + Ojo / ◐ otro campo intacto)');
// USO_CIIU
var MSG_C='Inconsistencia, código de actividad económica (CIIU) no debe estar vacío (FI.32.03)';
ok(run([ctx2('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']],[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx2('CON',HCON,[[K,'1','','TERMINADO']],[[K,'1','4719','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_C,'1')),'✔ VERIFICADO','ciiu a');
sm(run([ctx2('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO INDEPENDIENTE']],[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx2('CON',HCON,[[K,'1','','TERMINADO']],[[K,'1','','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_C,'1')),'R3A','ciiu b');
ok(run([ctx2('UA',HUA,[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']],[[K,'020304','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx2('CON',HCON,[[K,'1','','TERMINADO']],[[K,'1','','TERMINADO']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_C,'1')),'✔ VERIFICADO','ciiu c 020304');
ok(run([ctx2('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO INDEPENDIENTE']],[[K,'020105','CASA HABITACION','PREDIO INDEPENDIENTE']]),ctx2('CON',HCON,[[K,'1','','TERMINADO']],[[K,'1','','02 - EN CONSTRUCCIÓN']])],fila('VAL_USO_CIIU',K,'APLICA',MSG_C,'1')),'✔ VERIFICADO','ciiu c obra no terminada');
console.log('ok sigue mal · uso/CIIU (✔ / R3A / 020304 / obra no terminada)');
// COND_PREDIO_EN
var MSG_P='Inconsistencia, la clasificación del predio no coincide con predio catastral en (FI.24.03)';
ok(run([ctx2('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO EN EDIFICIO']],[[K,'010101','PREDIO EN EDIFICIO','PREDIO EN EDIFICIO']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_P)),'✔ VERIFICADO','predio a');
sm(run([ctx2('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO EN EDIFICIO']],[[K,'010101','TIENDA','PREDIO EN EDIFICIO']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_P)),'R1','predio b');
ok(run([ctx2('UA',HUA,[[K,'010101','TERRENO SIN CONSTRUIR','PREDIO EN EDIFICIO']],[[K,'010101','PARQUE','PREDIO INDEPENDIENTE']])],fila('VAL_COND_PREDIO_EN',K,'APLICA',MSG_P)),'✔ VERIFICADO','predio c PARQUE');
console.log('ok sigue mal · cond. predio en (✔ / R1 / PARQUE)');
// PRODUCTO y MEP
var MSG_O='Verificar producto de obra complementaria';
ok(run([ctx2('OBR',HOBR,[[K,'50','PARAPETO','02','1','m²','']],[[K,'50','PARAPETO','02','12.5','m²','']])],fila('VAL_PRODUCTO',K,'APLICA',MSG_O)),'✔ VERIFICADO','producto a');
sm(run([ctx2('OBR',HOBR,[[K,'50','PARAPETO','02','2','m²','']],[[K,'50','PARAPETO','02','1','m²','']])],fila('VAL_PRODUCTO',K,'APLICA',MSG_O)),'R1','producto b');
ok(run([ctx2('OBR',HOBR,[[K,'1','LOSA','01','2','m²','']],[[K,'1','LOSA','01','1','m²','']])],fila('VAL_PRODUCTO',K,'APLICA',MSG_O)),'✔ VERIFICADO','producto c código exceptuado');
ok(run([ctx2('OBR',HOBR,[[K,'50','PARAPETO','01','12.5','m²','']],[[K,'50','PARAPETO','02','12.5','m²','']])],fila('VAL_MEP_MEDIDA_PRODUCTO',K,'APLICA','Verificar MEP (FI.29.03)')),'✔ VERIFICADO','mep a');
sm(run([ctx2('OBR',HOBR,[[K,'50','PARAPETO','01','12.5','m²','']],[[K,'50','PARAPETO','03','12.5','m²','']])],fila('VAL_MEP_MEDIDA_PRODUCTO',K,'APLICA','Verificar MEP (FI.29.03)')),'R5','mep b');
console.log('ok sigue mal · producto / MEP (✔ / R1 / exceptuado / R5)');
// VAL_CRC (cambió el interior)
var HI=[KEY,'Tipo de Interior','Código De Uso'];
function crcU(ks,ti){return ks.map(function(k){return [k,ti,'010101'];});}
ok(run([ctx2('UA',HI,crcU([E+'01010015',E+'01010025'],'DPTO'),crcU([E+'01010015',E+'01010025'],'TIENDA'))],fila('VAL_CRC',E+'01010025','APLICA','Inconsistencia por estructura')),'✔ VERIFICADO','crc a');
sm(run([ctx2('UA',HI,crcU([E+'01010015',E+'01010035'],'DPTO'),crcU([E+'01010015',E+'01010035'],'TIENDA'))],fila('VAL_CRC',E+'01010035','APLICA','Salto de numeración (FI.02.04)')),'R5','crc b');
ok(run([ctx2('UA',HI,crcU([E+'01010015',E+'99999995'],'DPTO'),crcU([E+'01010015',E+'99999995'],'TIENDA'))],fila('VAL_CRC',E+'99999995','APLICA','Inconsistencia por estructura')),'✔ VERIFICADO','crc c 99/999');
console.log('ok sigue mal · VAL_CRC (✔ / R5 / 99-999)');
// Validadores sin reglas: quedan como hoy aunque el DESPUÉS esté mal
ok(run([ctx2('UA',HUA,[[K,'010101','CASA HABITACION','PREDIO EN EDIFICIO']],[[K,'020105','TIENDA','PREDIO EN EDIFICIO']])],fila('VAL_USO_PISO',K,'APLICA','Uso no coincide (FI.25.06)')),'✔ VERIFICADO','uso piso');
ok(run([ctx2('UA',HT,[TMAL],[[K,'PROPIETARIO','POSESIÓN','ESCRITURA PÚBLICA','','','CASA HABITACION']])],fila('VAL_TITULARES',K,'APLICA','Verificar titular')),'✔ VERIFICADO','titulares (relacionado)');
console.log('ok sigue mal · sin reglas (USO_PISO, TITULARES) → ✔ igual');
// Publicación y resumen
var P=vm.runInNewContext([cut('function c2bucket','/* Asignaciones'),cut('var PUB_LABELS','function pubGroup'),cut('var PUB_OTRO_CAMPO','function pubPayload'),cut('function pubDesglose','function pubPendientes'),cut('function pubPendientes','\n')].join('\n')+
  '\n({counts:pubCounts,publica:pubPublica,resultado:pubResultado,pend:pubPendientes,desglose:pubDesglose,summary:c2summary});');
var SM='◐ Cambió pero sigue mal: R2P', filas=[{result:'✔ VERIFICADO',validator:'V'},{result:SM,validator:'V'},{result:'⚠ SIN CAMBIO EN SICUN',validator:'V'}];
var t=P.counts(filas);assert.strictEqual(t.sigueMal,1);assert.strictEqual(t.verificado,1);assert.strictEqual(t.filas,3);
assert.strictEqual(P.counts([filas[0]]).sigueMal,undefined,'sigueMal solo si > 0');
assert(P.publica(filas[1])&&!P.publica(filas[0]));assert.strictEqual(P.resultado(filas[1]),SM);
assert.strictEqual(P.pend(t),2);assert(/sigue mal 1/.test(P.desglose(t)));assert.strictEqual(P.desglose({sinCambio:1}),'⚠ 1 · ℹ 0 · ◐ 0');
assert.strictEqual(JSON.stringify(P.summary(filas).V),JSON.stringify([3,1,0,1,0,0,0,0,0,1,0]));
console.log('ok sigue mal · publicación (totales.sigueMal, pendiente, resultado fijo) y resumen');
