'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
var html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){var i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
var src=[cut('var CAMPOS_VALIDADOR','/* ============ Configuración de reportes'),cut('var IGNORE_ALWAYS','var CRITICOS'),cut('function stripAccents','\n'),cut('function txt(v){','function normVal'),
  cut('function normVal','function normKey'),cut('function normKey','\n'),cut('function comparedColumns','/* ============ Render'),
  cut('var CRC_PARTS','function crcHtml'),cut('function c2norm','function c2state'),cut('function c2keys','function c2summary')].join('\n');
var stubs='var opts={normalize:true,tolerance:true,ignoreTramite:true};var POLY_ACTIVE=null, BOARD=[], FILES=[];function BOARD_(){return BOARD;}function c2files(){return FILES;}function gapNow(){return null;}'+
  'function filterActive(){return false;}function filterPass(){return true;}function mzKeyOf(k){return k.slice(6,8)+"|"+k.slice(8,11);}function $(id){return {checked:true,value:""};}';
var T=vm.runInNewContext(stubs+src+'\n({set:function(b,f){BOARD=b;FILES=f;},c2rows:c2rows,compareCtx:compareCtx,estado:c2estadoFinal,titular:c2titularReglas,crc:c2crcFinal,bucket:c2bucket});');
var KEY='Código de Referencia Catastral';
function ctx(id,H,rows){var o=function(v){var r={};H.forEach(function(c,i){r[c]=v[i];});return r;};var c={preset:{id:id,key:KEY},A:{headers:H,rows:rows.map(o)},B:{headers:H,rows:rows.map(o)}};c.RES=T.compareCtx(c);return c;}
var INI={codigodeuso:'999999',codigodeactividadeconomicaciiu:'9999',clasificaciondelpredio:'X',prediocatastralen:'X',productototal:'X',unidaddemedida:'X',mep:'X'};   /* valores iniciales distintos = hubo corrección */
function fila(val,code,state,msg,piso,ini){return {tecnico:'T',polygon:'260510081',sheet:val,validator:val,rawCode:code,partial:'',numeric:false,piso:piso||'',state:state,observation:'',message:msg||'',noState:false,inicial:ini||INI};}
function run(b,r){T.set(b,[{rows:[r]}]);return T.c2rows()[0];}
module.exports={T,ctx,KEY,fila,run,cut,stubs,src};
