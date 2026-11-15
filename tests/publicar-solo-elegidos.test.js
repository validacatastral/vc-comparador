/* Prueba del selector de publicación: caso real del bug (260410068 / 260710148 / 260210019), seguro del 50%,
   solo se publica lo marcado y el activo viene marcado por defecto.
   Solo códigos y conteos; sin filas reales. Uso: node tests/publicar-solo-elegidos.test.js */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('function txt(v){','function normVal'),cut('/* ============ Reportes faltantes','function gapCodes')].join('\n');
var T=vm.runInNewContext(src+'\n({pubLoaded:pubLoaded,pubSectoresExcel:pubSectoresExcel,pubSeguro:pubSeguro,pubOpciones:pubOpciones,pubElegidos:pubElegidos});');
function tot(filas,noEncontrado,invalido){return {filas:filas,verificado:filas-noEncontrado-invalido,otroCampo:0,sinCambio:0,noEncontrado:noEncontrado,invalido:invalido,noAplicaConCambio:0};}
function by(list,code){return list.filter(function(o){return o.code===code;})[0];}
function S(list){return new Set(list);}

// Cargado desde Drive: 260210019 con S19, S25, S27, S30 en 10/11 → 14/11 (los seis reportes, ambas fechas).
var U='150112', cargados=['19','25','27','30'].map(function(s){return U+s;}), present={};
['UA','TIT','CON','OBR','REC','ING'].forEach(function(r){present[r]={A:cargados.slice(),B:cargados.slice()};});
var loaded=T.pubLoaded(present);
assert.deepStrictEqual(Array.from(loaded.A).sort(),['19','25','27','30']);

// 1) CASO EXACTO DEL BUG: con el Excel del revisor de 068 y 148 también cargado, ambos se omiten por sectores incompletos.
//    Conteos reales del incidente: 068 → 285 filas, 206 no encontradas; 148 → 860 filas, 857 inválidas + 3 no encontradas.
var items=[
  {code:'260410068',sectors:S(['30','38','39']),ilegibles:0,totales:tot(285,206,0)},
  {code:'260710148',sectors:S(['35','36','37','41','43']),ilegibles:0,totales:tot(860,3,857)},
  {code:'260210019',sectors:S(['19','25','27','30']),ilegibles:0,totales:tot(120,2,1)}
];
var op=T.pubOpciones(items,loaded,'260210019');
assert.strictEqual(by(op,'260410068').habilitado,false);assert.strictEqual(by(op,'260410068').motivo,'faltan S38, S39');
assert.strictEqual(by(op,'260710148').habilitado,false);assert.strictEqual(by(op,'260710148').motivo,'faltan S35, S36, S37, S41, S43');
assert.strictEqual(by(op,'260210019').habilitado,true);assert.strictEqual(by(op,'260210019').motivo,'');
// Aunque se fuerce la casilla de los deshabilitados, solo sale el completo.
assert.deepStrictEqual(Array.from(T.pubElegidos(op,['260410068','260710148','260210019'])),['260210019']);
console.log('ok caso del bug · 068: '+by(op,'260410068').motivo+' · 148: '+by(op,'260710148').motivo);

// 2) Huecos de la verificación anterior que dejaban pasar un polígono incompleto.
// 2a) Sector en una sola fecha, o en fechas distintas de reportes distintos: NO cuenta como cargado.
var cruzado={UA:{A:[U+'38'],B:[]},TIT:{A:[],B:[U+'38']},CON:{A:[U+'30'],B:[U+'30']}};
assert.deepStrictEqual(Array.from(T.pubLoaded(cruzado).A),['30'],'S38 solo en UA-ANTES y TIT-DESPUÉS no está comparado');
assert.strictEqual(T.pubLoaded({UA:{A:[U+'30'],B:[]}}).A.size,0);
// 2b) Polígono fuera del universo: los sectores salen de TODAS las filas del Excel; con códigos ilegibles no se publica.
var excel=T.pubSectoresExcel([{rows:[{rawCode:U+'300630130101020014',partial:'',numeric:false},{rawCode:'38001002',partial:'',numeric:false},{rawCode:'',partial:'39001001010101001',numeric:false}]}]);
assert.deepStrictEqual(Array.from(excel.sectors).sort(),['30','38','39']);assert.strictEqual(excel.ilegibles,0);
excel=T.pubSectoresExcel([{rows:[{rawCode:U+'300630130101020014',partial:'',numeric:false},{rawCode:'1.50112E+23',partial:'',numeric:true},{rawCode:'x',partial:'',numeric:false}]}]);
assert.strictEqual(excel.ilegibles,2);
var o=T.pubOpciones([{code:'260410068',sectors:excel.sectors,ilegibles:excel.ilegibles,totales:tot(10,0,0)}],loaded,'260410068')[0];
assert.strictEqual(o.habilitado,false);assert.strictEqual(o.marcado,false);assert.strictEqual(o.motivo,'no está en el universo y 2 códigos del Excel no se pueden leer');
console.log('ok sector en una sola fecha no cuenta · Excel con códigos ilegibles no se publica');

// 3) SEGURO DEL 50%: aunque los sectores "parezcan" completos (p. ej. universo equivocado), no se publica ni se puede marcar.
var mal=[{code:'260410068',sectors:S(['30']),ilegibles:0,totales:tot(285,206,0)},{code:'260710148',sectors:S(['30']),ilegibles:0,totales:tot(860,3,857)}];
op=T.pubOpciones(mal,loaded,'260410068');
assert.strictEqual(by(op,'260410068').habilitado,false);assert.strictEqual(by(op,'260410068').marcado,false);assert.strictEqual(by(op,'260410068').motivo,'206 de 285 inválidas o no encontradas');
assert.strictEqual(by(op,'260710148').habilitado,false);assert.strictEqual(by(op,'260710148').motivo,'860 de 860 inválidas o no encontradas');
assert.deepStrictEqual(Array.from(T.pubElegidos(op,['260410068','260710148'])),[]);
assert.strictEqual(T.pubSeguro(tot(100,30,20)),'','exactamente 50% todavía pasa');
assert.strictEqual(T.pubSeguro(tot(100,30,21)),'51 de 100 inválidas o no encontradas');
assert.strictEqual(T.pubSeguro(tot(0,0,0)),'');
console.log('ok seguro del 50% · '+by(op,'260410068').motivo+' · '+by(op,'260710148').motivo);

// 4) SOLO PUBLICA MARCADOS: tres polígonos válidos, se envía únicamente lo marcado.
var full=T.pubLoaded({UA:{A:['19','25','30','35'].map(function(s){return U+s;}),B:['19','25','30','35'].map(function(s){return U+s;})}});
var ok3=[{code:'260110002',sectors:S(['25']),ilegibles:0,totales:tot(40,1,0)},{code:'260410068',sectors:S(['30']),ilegibles:0,totales:tot(285,3,0)},{code:'260710148',sectors:S(['35']),ilegibles:0,totales:tot(860,3,12)}];
op=T.pubOpciones(ok3,full,'260110002');
assert(op.every(function(x){return x.habilitado;}));
assert.deepStrictEqual(Array.from(T.pubElegidos(op,['260110002'])),['260110002']);
assert.deepStrictEqual(Array.from(T.pubElegidos(op,[])),[],'sin marcas no se publica nada');
assert.deepStrictEqual(Array.from(T.pubElegidos(op,['260710148','999999999'])),['260710148'],'un código ajeno a la lista se ignora');
console.log('ok solo publica marcados');

// 5) ACTIVO MARCADO POR DEFECTO: solo el polígono activo; los demás (ya publicados antes) vienen desmarcados.
assert.deepStrictEqual(Array.from(op.filter(function(x){return x.marcado;}).map(function(x){return x.code;})),['260110002']);
assert.deepStrictEqual(Array.from(T.pubElegidos(op,op.filter(function(x){return x.marcado;}).map(function(x){return x.code;}))),['260110002']);
op=T.pubOpciones(ok3,full,'');assert(op.every(function(x){return !x.marcado;}),'sin polígono activo y con varios cargados no se marca ninguno');
op=T.pubOpciones(ok3.slice(0,1),full,'');assert.strictEqual(op[0].marcado,true,'un único polígono cargado viene marcado');
op=T.pubOpciones(items,loaded,'260410068');assert(op.every(function(x){return !x.marcado;}),'un activo incompleto no se marca');
console.log('ok activo marcado por defecto');
console.log('ok publicar solo elegidos');
