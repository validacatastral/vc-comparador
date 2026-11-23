'use strict';
const assert=require('assert'),vm=require('vm');
const {ctx,KEY,fila,cut,stubs,src}=require('./estado-final-helper');
const T=vm.runInNewContext(stubs+src+cut('function c2summary','/* Asignaciones locales')+cut('function c2sheets','\n')+cut('var PUB_COUNTS','function pubFields')+cut('var PUB_OTRO_CAMPO','function pubPayload')+
  '\n({set:function(b,f){BOARD=b;FILES=f;},rows:c2rows,estado:c2estadoFinal,pub:pubResultado,sheets:c2sheets,compare:compareCtx});');
const K='150110680440060102010015', hu=[KEY,'Código De Uso'], hc=[KEY,'N° Piso','Código De Actividad Económica (CIIU)','ECC'];
function caso(uso,ciius,piso,regla,inicial){
  const board=[ctx('UA',hu,[[K,uso]]),ctx('CON',hc,ciius.map((c,i)=>[K,String(i+1),c,'TERMINADO']))];
  const row=fila('VAL_USO_CIIU',K,'APLICA','['+regla+']',String(piso),{codigodeuso:uso,codigodeactividadeconomicaciiu:inicial||ciius[piso-1]});
  T.set(board,[{rows:[row]}]);const state=T.estado(board,row,K), result=T.rows()[0];
  return {board,row,state,result,text:T.pub(result)};
}
let a=caso('020202',['4520','4530',''],2,'R4B');
assert(a.state.cumple);assert.match(a.result.note,/otra línea ya tiene el CIIU del uso: revisar la actividad de esta línea/);
let b=caso('020202',['4530','4711'],1,'R4B');
assert.deepStrictEqual([...b.state.reglas],['R4B']);assert.match(b.text,/debería ser: 4520/);assert.match(b.text,/o cambiar el uso a: 020105 /);
let c=caso('020199',['4520','4530'],2,'R8B');
assert.match(c.text,/taller con venta de repuestos: revisar si el uso es 020202 Taller \(R8B\)/);
let d=caso('020199',['4530'],1,'R8B');assert.match(d.text,/uso que corresponde: 020105 /);
let e=caso('020199',['0111'],1,'R8B');assert(e.state.cumple);assert.match(e.result.note,/020199 coherente: confirmar la actividad/);
let f=caso('020202',['4530'],1,'R4A');assert.match(f.text,/\(R4A\).*debería ser: 4520.*o cambiar el uso a: 020105 /);
let g=caso('020304',['4530'],1,'R9');assert.match(g.text,/\(R9\).*o cambiar el uso a: 020105 /);
for(const [x,actual] of [[b,'4530'],[c,'4530'],[d,'4530'],[f,'4530'],[g,'4530']])assert(!x.text.includes(actual),x.text);
let changed=caso('020202',['4530'],1,'R4A','9999');assert.match(changed.result.result,/^◐ Cambió pero sigue mal: .*o cambiar el uso a: 020105 /);
assert.strictEqual(T.sheets([f.result],[])[0].aoa[1][13],f.text);
for(const [label,x] of Object.entries({a,b,c,d,e,f,g})) console.log(label+': '+x.text+(x.state.cumple?' | Nota: '+x.result.note:''));
