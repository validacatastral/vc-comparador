'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {ctx, KEY, fila, cut, stubs, src} = require('./estado-final-helper');

const app = vm.runInNewContext([
  stubs, src,
  'function c2assign(rows){return rows;} function fileDate(f){return {day:f.day};}',
  cut('var PUB_LABELS', '/* Prepara la publicación'),
  cut('function c2summary', '/* Asignaciones'),
  cut('function c2sheets', '(function(){var original=writeStyledWorkbook'),
  `({run(board, row) {
    BOARD = board;
    FILES = [{rows:[row]}];
    const rows = c2rows();
    return {
      fila: pubPayload(row.polygon, rows, 'prueba', false).filas[0],
      excel: c2sheets(rows, [])[0].aoa
    };
  }})`
].join('\n'));

function run(board, row) {
  for (const report of board) {
    report.A.day = '2025-01-01';
    report.B.day = '2025-01-02';
  }
  const result = app.run(board, row);
  assert.ok(result.fila, 'la fila debe publicarse');
  return result;
}

const code = '150112190370070101010015';
const nuevo = '150112190370070101020016';
const soloDV = '150112190370070101010019';
function renombre(after, porHuella = false) {
  const uso = '050101';
  return ['UA', 'TIT', 'CON'].map(id => {
    const headers = id === 'UA' && porHuella ? [KEY, 'Código De Uso'] : [KEY];
    const report = ctx(id, headers, [[code, uso]]);
    report.B.rows = [{...report.A.rows[0], [KEY]:after}];
    if (!porHuella) report.RES.renombrados = [{de:code, a:after, row:report.B.rows[0]}];
    return report;
  });
}
const tit = fila('VAL_TITULARES', code, 'APLICA');
for (const porHuella of [false, true]) {
  const real = run(renombre(nuevo, porHuella), tit);
  assert.equal(real.fila.crcNuevo, nuevo);
  assert.doesNotMatch(real.fila.campos, /CRC renombrado/);
  assert.equal(real.excel[0].at(-1), 'CRC nuevo');
  assert.equal(real.excel[1].at(-1), nuevo);
}
const dv = run(renombre(soloDV), tit);
assert.equal(Object.hasOwn(dv.fila, 'crcNuevo'), false);
assert.match(dv.fila.campos, /CRC renombrado \(solo DV\)/);
assert.equal(dv.excel[1].at(-1), '');

for (const [uso, verCatalogo] of [['030101', true], ['050101', false]]) {
  const board = [
    ctx('UA', [KEY, 'Código De Uso'], [[code, uso]]),
    ctx('CON', [KEY, 'N° Piso', 'Código De Actividad Económica (CIIU)', 'ECC'],
      [[code, '1', '9999', 'TERMINADO']]),
    ctx('TIT', [KEY], [[code]])
  ];
  const usoRow = fila('VAL_USO_CIIU', code, 'APLICA', '[R4A] El CIIU no corresponde al uso', '1',
    {codigodeuso:uso, codigodeactividadeconomicaciiu:'9999'});
  const publicada = run(board, usoRow).fila;
  assert.match(publicada.resultado, / · debería ser: /);
  assert.equal(publicada.resultado.endsWith(' (ver catálogo)'), verCatalogo);
  assert.equal(publicada.catUso, uso);
  assert.doesNotMatch(JSON.stringify(publicada), /9999/);
  assert.equal(Object.hasOwn(run(board, tit).fila, 'catUso'), false);
}
console.log('ok · CRC nuevo, solo DV, catálogo de uso y Excel');
