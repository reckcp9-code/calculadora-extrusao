'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sw=fs.readFileSync('sw.js','utf8');
const idx=fs.readFileSync('index.html','utf8');
const wrapper=fs.readFileSync('sw-policy.js','utf8');
const app=fs.readFileSync('app-bundle.js','utf8');
const worker=fs.readFileSync('.github/workers/df-team-license-restore-v1.js','utf8');
const production=fs.readFileSync('producao-equipe-separada-v2.js','utf8');

async function testVersionFallback(){
 const match=sw.match(/async function networkFirst\(req\)\{[\s\S]*?\n\}\nasync function staleWhileRevalidate/);
 assert.ok(match,'service worker networkFirst present');
 const func=match[0].replace(/\nasync function staleWhileRevalidate$/, '')+'\nreturn networkFirst;';
 const old=new Response('OLD VERSION',{status:200}),fresh=new Response('CURRENT VERSION',{status:200});
 let mode='old',seen=[];
 const cache={
  put:async()=>{},
  match:async(req,opts)=>{
   seen.push(opts?.ignoreSearch);
   if(mode==='old')return opts?.ignoreSearch?old:null;
   return fresh;
  }
 };
 const caches={open:async()=>cache};
 const fetchWithTimeout=async()=>{throw Error('offline / request timeout')};
 const make=new Function('caches','fetchWithTimeout','Response','URL','self','DF_CACHE',func);
 const networkFirst=make(caches,fetchWithTimeout,Response,URL,{},'df-saas-test');
 const versioned={url:'https://app.example.com/app-bundle.js?v=20261103-formula-delete-single-v767'};
 let res=await networkFirst(versioned);
 assert.equal(res.status,503,'Old precache MUST NOT satisfy a new versioned JS request');
 assert.equal(seen.at(-1),false);
 const unversioned={url:'https://app.example.com/favicon.js'};
 res=await networkFirst(unversioned);
 assert.equal(await res.text(),'OLD VERSION','Unversioned assets may use offline cache');
 assert.equal(seen.at(-1),true);
 mode='exact';
 res=await networkFirst(versioned);
 assert.equal(await res.text(),'CURRENT VERSION','Exactly matched current cached JS works offline');
 assert.equal(seen.at(-1),false);
}
async function testRuntime(){
 assert.match(idx,/app-shell\.html\?v='\+BUILD/,'Shell must be build-versioned');
 assert.match(idx,/sw-policy\.js.*updateViaCache:'none'/,'SW wrapper must update bypassing HTTP cache');
 assert.match(wrapper,/importScripts\('\.\/sw\.js\?v=20261103-formula-delete-single-v767'\)/,'Wrapper must import versioned SW');
 assert.match(app,/serviceWorker\.register\(BASE\+'sw\.js',\{scope:BASE,updateViaCache:'none'\}\)/,'Embedded PWA registration must bypass SW import cache');
 assert.match(worker,/FROM production_saved_ops/,'Recover canonical saved OPs from D1');
 assert.match(worker,/state='open'/,'Never resurrect deleted saved OPs');
 assert.match(production,/function restoreCanonicalSavedOps/,'Production must ingest canonical saved OPs');
 assert.match(production,/if\(.*seen\.has\(id\)\)continue/,'Must preserve existing locally edited OPs');
 assert.match(production,/CANONICAL_QUEUE_KEY/,'Must handle deferred Production module start');
}
(async()=>{await testVersionFallback();await testRuntime();console.log('Atomic versioned cache and canonical Production recovery tests passed')})().catch(e=>{console.error(e);process.exitCode=1});

