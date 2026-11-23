// Texto corto por regla en "◐ Cambió pero sigue mal": catálogo REGLAS_CORTAS y c2reglasTxt.
'use strict';
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function cut(from,to){const i=html.indexOf(from),j=html.indexOf(to,i);assert(i>=0&&j>i,'no se halló: '+from);return html.slice(i,j);}
const T=vm.runInNewContext(cut('var C2_SIGUE_MAL','/* Solo se juzga')+cut('var TIT_REGLAS','function c2titularReglas')+cut('function c2reglasTxt','function c2filaDespues')+
  '({REGLAS_CORTAS,TIT_REGLAS,c2reglasTxt})');
const {REGLAS_CORTAS:RC,TIT_REGLAS,c2reglasTxt}=T;

// a) USO R4A
assert.equal(c2reglasTxt({reglas:['R4A']},'USO'),'el CIIU no es de ese uso (R4A)');
// b) TIT reutiliza TIT_REGLAS (misma referencia, sin duplicar)
assert.equal(RC.TIT,TIT_REGLAS);
assert.equal(c2reglasTxt({reglas:['R5']},'TIT'),TIT_REGLAS.R5+' (R5)');
// mismo código, distinto validador → distinto texto; varias reglas con "; "
assert.notEqual(c2reglasTxt({reglas:['R5']},'USO'),c2reglasTxt({reglas:['R5']},'TIT'));
assert.equal(c2reglasTxt({reglas:['R10','R4A']},'USO'),'el CIIU no es de ese uso (R4A); el CIIU no existe (R10)');
// c) código desconocido o grupo desconocido → solo el código
assert.equal(c2reglasTxt({reglas:['R99']},'USO'),'R99');
assert.equal(c2reglasTxt({reglas:['R4A']},''),'R4A');
assert.equal(c2reglasTxt({reglas:['R4A','R99']},'USO'),'el CIIU no es de ese uso (R4A); R99');
// d) Solo se permiten los números fijos aprobados.
for(const [g,cat] of Object.entries(RC))for(const [c,t] of Object.entries(cat)){
  assert(!/\d/.test(t.replace(/\b(?:Rev\. 4|001|01|02|03|81|82|8|1)\b/g,'')),g+' '+c+' lleva dígitos: '+t);
  assert(!/;/.test(t),g+' '+c+' usa el separador ";"');
  assert(/^\S.*\S$/.test(t),g+' '+c+' vacío o con espacios');
}
// e) toda regla activa de cada validador tiene texto
function codigos(seg,re){return new Set([...seg.matchAll(re)].map(m=>m[1]));}
const activos={
  TIT:codigos(cut('function c2titularReglas','function c2titularAplicables'),/push\('([A-Z]\d+[A-Z]?)'\)/g),
  USO:codigos(cut('var C2_USO=(function','var C2_COND=(function'),/H\("(R\d+[A-Z]?)"/g),
  COND:codigos(cut('var C2_COND=(function','var C2_OBRA=(function'),/add\("(R\d+[A-Z]?)"/g),
  OBR:codigos(cut('var C2_OBRA=(function','function c2usoCiiuFinal'),/c\s*:\s*"(R\d+[A-Z]?)"/g),
  CRC:codigos(cut('function c2crcFinal','var C2_FECHA=(function'),/push\('(R\d+[A-Z]?)'\)/g),
  FECHA:codigos(cut('function c2fechaPisoFinal','function c2estadoFinal'),/'(R\d+[A-Z]?)'/g)
};
activos.USO.delete('R3D'); // excluida por decisión de Diego
const minimos={TIT:['R13','R4H','R6O','R5'],USO:['R3C','R4A','R4B','R10'],COND:['R13'],OBR:['R7P'],CRC:['R6A','R6B','R6C'],FECHA:['R1']};
for(const [g,set] of Object.entries(activos)){
  for(const c of minimos[g])assert(set.has(c),g+': no se detectó '+c+' en el código');
  for(const c of set)assert(RC[g]&&RC[g][c],g+' '+c+' sin texto corto');
}
// prefijo intacto en la línea del status
assert(html.includes("var C2_SIGUE_MAL='◐ Cambió pero sigue mal: ';"));
assert(html.includes('status=c2prefijoNivel(tok,c2grupoRegla(row))+c2reglasTxt(tok,c2grupoRegla(row))+c2queHacer(tok,c2grupoRegla(row));'));
console.log('reglas-texto-corto: ok');
