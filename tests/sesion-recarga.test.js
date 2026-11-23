/* Integración en Chromium: carga local, comparación y cruce sobreviven una recarga sin Drive.
   Requiere playwright y Chromium; los XLSX sintéticos se leen con un adaptador de prueba. */
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
let chromium;
try { ({chromium}=require('playwright')); }
catch(e) { try { ({chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); } catch(_) { console.log('Omitida: falta Playwright'); process.exit(0); } }
const root=path.join(__dirname,'..');
const stub=`window.XLSX={read(bytes){let sheets=JSON.parse(new TextDecoder().decode(bytes)), out={SheetNames:Object.keys(sheets),Sheets:{}};for(let n of out.SheetNames){let rows=sheets[n],ws={aoa:rows,'!ref':'A1:Z'+rows.length};rows.forEach((row,r)=>row.forEach((v,c)=>{if(v!=null)ws[r+','+c]={v:v,w:String(v),t:typeof v==='number'?'n':'s'};}));out.Sheets[n]=ws;}return out;},utils:{sheet_to_json(ws){return ws.aoa},decode_range(ref){return {s:{r:0,c:0},e:{r:Number(ref.split(':')[1].slice(1))-1,c:25}}},encode_cell(x){return x.r+','+x.c},format_cell(x){return String(x.v)}}};`;
function upload(name, sheets){return {name,mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(JSON.stringify(sheets))};}
(async()=>{let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:380,height:800}}),page=await ctx.newPage(), errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 await ctx.route('http://vc.test/**',route=>{const name=new URL(route.request().url()).pathname.slice(1)||'index.html',file=path.join(root,name);if(name==='blank')return route.fulfill({contentType:'text/html',body:'<!doctype html>'});if(!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:name.endsWith('.html')?'text/html':'application/javascript',body:fs.readFileSync(file)});});
 await ctx.route('https://**/*',route=>{const u=route.request().url();if(u.includes('xlsx.full.min.js'))return route.fulfill({contentType:'text/javascript',body:stub});if(u.includes('exceljs.min.js'))return route.fulfill({contentType:'text/javascript',body:''});external.push(u);return route.abort();});
 await page.goto('http://vc.test/');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'La pantalla principal se desborda a 380 px');
 await page.locator('#polyFile').setInputFiles(upload('poligonos.xlsx',{'260210019':[['UBIGEO','SECTOR','MANZANA'],['150112','19','001']]}));
 await page.waitForFunction(()=>document.querySelector('#polySelect').options.length===2);await page.selectOption('#polySelect','0');
 await page.fill('#drvKey','CLAVE-LECTURA-PRUEBA');await page.locator('#pubKey').evaluate(el=>{el.value='CLAVE-ESCRITURA-PRUEBA';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.fill('#dNew','Distrito prueba');await page.click('#dAddBtn');
 const crc='150112190010010101010010',headers=['Código de Referencia Catastral','Código Predial de Rentas','Descripción Del Uso'];
 await page.locator('#slot0A input[type=file]').setInputFiles(upload('rep_UA_15011219_261101.xlsx',{data:[headers,[crc,'123','ANTES']]}));
 await page.waitForSelector('#slot0A.has');
 await page.locator('#slot0B input[type=file]').setInputFiles(upload('rep_UA_15011219_261102.xlsx',{data:[headers,[crc,'123','DESPUÉS']]}));
 await page.waitForSelector('#slot0B.has');await page.click('#rbtn0');
 await page.locator('#c2Files').setInputFiles(upload('revisor_260210019.xlsx',{'VAL_USO_CIIU':[['CRC','VAL_USO_CIIU','APLICA / NO APLICA'],[crc,'Observación','APLICA']]}));
 await page.waitForFunction(()=>document.querySelector('#c2Body').textContent.includes('APLICA'));
 const before=await page.locator('#boardBody').innerText(), cross=await page.locator('#c2Body').innerText();
 let saved=false;
 for(let i=0;i<100&&!saved;i++) { await page.waitForTimeout(100); saved=await page.evaluate(async()=>{let db=await new Promise((r,j)=>{let x=indexedDB.open('vc-cmp-cache');x.onsuccess=()=>r(x.result);x.onerror=()=>j(x.error)});let record=await new Promise(r=>{let q=db.transaction('datos').objectStore('datos').get('__sesion_trabajo__');q.onsuccess=()=>r(q.result)});return !!(record&&record.sesion.districts[0]&&record.sesion.districts[0].c2&&record.sesion.districts[0].board[0].RES);}); }
 assert(saved,'No se guardó la sesión');
 await page.reload();await page.waitForSelector('#sessionNotice:not([hidden])',{timeout:5000});
 assert.match(await page.locator('#sessionNotice').innerText(),/Sesión recuperada · 260210019/);
 assert.strictEqual(await page.locator('#boardBody').innerText(),before);assert.strictEqual(await page.locator('#c2Body').innerText(),cross);
 assert.strictEqual(await page.locator('#polyPill').innerText(),'Polígono 260210019');assert(!external.some(u=>/script\.google\.com|drive\.google\.com/.test(u)));
 const blank=await ctx.newPage();await blank.goto('http://vc.test/blank');await page.close();
 const stored=await blank.evaluate(async()=>{let db=await new Promise(r=>{let x=indexedDB.open('vc-cmp-cache');x.onsuccess=()=>r(x.result)});return await new Promise(r=>{let t=db.transaction('datos','readwrite'),store=t.objectStore('datos'),get=store.get('__sesion_trabajo__');get.onsuccess=()=>{let record=get.result;record.sesion.queue={tipo:'publicar',pendientes:['260210019','260210020'],publicados:['260210018'],enCurso:'260210019',inciertos:[]};store.put(record);t.oncomplete=()=>r(JSON.stringify(record));};});});
 assert(!stored.includes('CLAVE-LECTURA-PRUEBA')&&!stored.includes('CLAVE-ESCRITURA-PRUEBA'));
 const restored=await ctx.newPage();await restored.goto('http://vc.test/');await restored.waitForSelector('#sessionQueue:not([hidden])',{timeout:3000});
 assert.match(await restored.locator('#sessionQueue').innerText(),/Quedaron 2 polígonos sin publicar/);
 assert.match(await restored.locator('#sessionQueue').innerText(),/resultado incierto/);
 assert(!external.some(u=>/script\.google\.com|drive\.google\.com/.test(u)));assert.deepStrictEqual(errors,[]);
 await ctx.close();console.log('Sesión: comparación, cruce y cola recuperados sin Drive ni reenvío.');
}finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
