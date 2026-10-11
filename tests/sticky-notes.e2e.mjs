import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--config','tests/sticky-vite.config.ts','--host','127.0.0.1','--port','5180'],{windowsHide:true,stdio:'pipe',env:{...process.env,VITE_SUPABASE_URL:'https://logkdsuqbachhueraqjm.supabase.co',VITE_SUPABASE_ANON_KEY:'local-test-public-key'}});
server.stderr.on('data',data=>process.stderr.write(data));
await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(data.toString().includes('127.0.0.1'))resolve();});server.on('error',reject);});
const require = createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); }
catch { playwright=createRequire(process.env.PLAYWRIGHT_PACKAGE_ROOT + '/package.json')('playwright'); }
const { chromium } = playwright;
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
const context = await browser.newContext({viewport:{width:1360,height:950}});
const rows = new Map(); let failWrites=false, delayWrite=false, heldWrite;
const uploaded=[];
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const faults=[];
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === '127.0.0.1') return route.continue();
  if(url.pathname.includes('/storage/v1/object/sign/') && route.request().method()==='POST') return route.fulfill({json:route.request().postDataJSON().paths.map(path=>({path,signedURL:'/object/sign/sticky-images/'+path+'?token=test',error:null}))});
  if(url.pathname.includes('/storage/v1/object/sign/') && route.request().method()==='GET') return route.fulfill({contentType:'image/png',body:pixel});
  if(url.pathname.includes('/storage/v1/object/sticky-images/') && route.request().method()==='POST') {uploaded.push(url.pathname);return route.fulfill({json:{Key:url.pathname}});}
  if (url.pathname.includes('/rest/v1/sticky_notes')) {
    const req=route.request(), method=req.method(), id=url.searchParams.get('id')?.replace('eq.','');
    if (method==='GET') {
      const data=id ? rows.get(id) ?? null : [...rows.values()];
      return route.fulfill({json:data});
    }
    if(failWrites) return route.fulfill({status:503,json:{message:'simulated offline write failure'}});
    const payload=req.postDataJSON();
    if(delayWrite) { delayWrite=false; await new Promise(r=>{heldWrite=r}); }
    if(method==='POST') {
      if(rows.has(payload.id)) return route.fulfill({status:409,json:{message:'duplicate id'}});
      const row={...payload,version:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}; rows.set(row.id,row); return route.fulfill({json:row});
    }
    if(method==='PATCH') {
      const old=rows.get(id), version=Number(url.searchParams.get('version')?.replace('eq.',''));
      if(!old || old.version!==version) return route.fulfill({json:null});
      const row={...old,...payload,version:version+1,updated_at:new Date().toISOString()};rows.set(id,row);return route.fulfill({json:row});
    }
  }
  return route.fulfill({status:200,json:[]});
});
await context.routeWebSocket(/supabase/, ws=>ws.close());
const page = await context.newPage();
page.on('pageerror',error=>faults.push(error.message));
page.on('dialog', dialog=>dialog.accept());
const wait = async (fn,label) => { const end=Date.now()+12000; while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw new Error('Timeout: '+label); };
const dialog=()=>page.getByRole('dialog');
const done=async()=>{await dialog().getByRole('button',{name:'完成',exact:true}).click();};
try {
  await page.goto('http://127.0.0.1:5180/tests/sticky-test.html');
  await page.getByRole('button',{name:'文字便签',exact:true}).first().click();
  await dialog().getByLabel('标题',{exact:true}).fill('E2E 文字便签');
  await dialog().getByLabel('便签正文').fill('# 测试标题\n**粗体**\n[坏链接](javascript:alert(1))\n<script>alert(1)</script>');
  await wait(()=>rows.size===1 && [...rows.values()][0].title==='E2E 文字便签','autosave');
  await dialog().getByRole('button',{name:'预览',exact:true}).click();
  assert.equal(await dialog().locator('a[href^="javascript:"]').count(),0);
  assert.equal(await dialog().locator('script').count(),0);
  await done();
  // A reload must rehydrate from the server, not just a local draft.
  await page.reload(); await page.getByRole('button',{name:'E2E 文字便签',exact:true}).waitFor();
  await page.getByRole('button',{name:'待办清单',exact:true}).first().click();
  await dialog().getByLabel('标题',{exact:true}).fill('E2E 清单');
  await dialog().getByLabel('新增待办').fill('第一项\n第二项\n第三项');
  await dialog().getByRole('button',{name:'添加待办',exact:true}).click();
  await dialog().getByRole('checkbox',{name:'完成 第一项',exact:true}).check();
  await dialog().getByRole('button',{name:'下移待办',exact:true}).first().click();
  await wait(()=>[...rows.values()].some(r=>r.title==='E2E 清单' && r.items.length===3 && r.items[1].completed_at),'todos autosave');
  await dialog().getByRole('button',{name:'关联',exact:true}).first().click();
  await dialog().getByRole('button',{name:'E2E 文字便签',exact:true}).click();
  await wait(()=>[...rows.values()].some(r=>r.title==='E2E 清单' && r.items[0].linked_note_id),'link');
  await done();
  await page.getByRole('button',{name:'E2E 文字便签',exact:true}).click();
  await dialog().getByRole('button',{name:'归档',exact:true}).click();await done();
  await page.getByRole('button',{name:'已归档',exact:true}).click();await page.getByRole('button',{name:'E2E 文字便签',exact:true}).click();
  await dialog().getByRole('button',{name:'取消归档',exact:true}).click();
  await dialog().getByRole('button',{name:'移入回收站',exact:true}).click();
  await page.getByRole('button',{name:'回收站',exact:true}).click();await page.getByRole('button',{name:'恢复',exact:true}).click();
  await wait(()=>[...rows.values()].every(r=>!r.deleted_at && !r.archived_at),'trash restore');
  await page.getByRole('button',{name:'全部',exact:true}).click();
  // Request failure protects local drafts; reload + retry saves them once.
  failWrites=true;
  await page.getByRole('button',{name:'E2E 文字便签',exact:true}).click();
  await dialog().getByLabel('便签正文').fill('离线草稿内容');
  await page.getByText('simulated offline write failure',{exact:true}).first().waitFor();
  await page.reload(); await page.getByRole('button',{name:'E2E 文字便签',exact:true}).waitFor();
  failWrites=false;
  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await wait(()=>[...rows.values()].some(r=>r.content==='离线草稿内容'),'retry');
  // Simulated second device updates the same note before our dirty draft saves.
  await page.getByRole('button',{name:'E2E 文字便签',exact:true}).click();
  const id=[...rows.values()].find(r=>r.title==='E2E 文字便签').id;
  rows.set(id,{...rows.get(id),content:'另一设备的新内容',version:rows.get(id).version+1,mutation_id:crypto.randomUUID()});
  await dialog().getByLabel('便签正文').fill('本机冲突内容');
  await dialog().getByRole('button',{name:'保留两份（推荐）'}).waitFor();
  assert.equal(rows.get(id).content,'另一设备的新内容');
  await dialog().getByRole('button',{name:'保留两份（推荐）'}).click();
  await wait(()=>[...rows.values()].some(r=>r.content==='本机冲突内容'),'preserve both');await done();
  // Typing while a save request is in flight must queue the latest text.
  await page.getByRole('button',{name:'E2E 清单',exact:true}).click();
  delayWrite=true; await dialog().getByLabel('标题',{exact:true}).fill('写入中');
  await wait(()=>!!heldWrite,'held request');
  await dialog().getByLabel('标题',{exact:true}).fill('最终内容'); heldWrite();
  await wait(()=>[...rows.values()].some(r=>r.title==='最终内容'),'queued save');await done();
  const before=rows.size;
  await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='文字便签');b.click();b.click();});
  await dialog().getByLabel('标题',{exact:true}).fill('图片和双击测试');
  await wait(()=>rows.size===before+1,'duplicate click guard');
  await dialog().locator('input[type=file]').setInputFiles({name:'中文图片.PNG',mimeType:'image/png',buffer:pixel});
  await wait(()=>uploaded.length===1 && [...rows.values()].some(r=>r.image_paths.length===1),'image upload');
  assert.ok(uploaded.every(p=>/^[\x00-\x7f]*$/.test(p)),'ASCII storage key');
  await dialog().getByRole('button',{name:'查看图片原图'}).click();
  await page.getByRole('dialog',{name:'查看原图'}).waitFor();
  assert.ok(await page.getByRole('dialog',{name:'查看原图'}).evaluate(el=>{const r=el.getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2)<2;}),'centered viewer');
  await page.keyboard.press('Escape');await done();
  await page.screenshot({path:'work/sticky-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),'mobile horizontal overflow');
  await page.getByRole('button',{name:'最终内容',exact:true}).click();
  assert.ok(await dialog().evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),'mobile dialog bounds');
  await page.screenshot({path:'work/sticky-mobile.png',fullPage:true});
  assert.deepEqual(faults,[]);
  console.log(JSON.stringify({passed:['autosave','reload','safe Markdown','multiline todos','complete and reorder','link','archive restore','trash restore','failed-save recovery','conflict preserve both','typing during save','duplicate click guard','Chinese filename image upload','centered image viewer','mobile layout'],rows:rows.size,pageErrors:faults}));
} finally { await browser.close(); server.kill(); }
