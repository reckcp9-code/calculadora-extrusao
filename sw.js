const DF_CACHE='df-extrusor-shell-v8';
const STATE_CACHE='df-extrusor-state-v1';
const HISTORICAL_APP='https://raw.githubusercontent.com/reckcp9-code/calculadora-extrusao/3e570fc08be61679377cd81eb4e90bc45216f4c2/app.html';
const CORE=[
  './','./index.html','./manifest.webmanifest','./logo.svg','./logo.jpg.jpeg','./app-version.json',
  './offline-auth-shim.js','./safe-core.js','./material-manager.js','./cost-safe.js','./formula-unlock.js','./help-extra.js','./back-extra.js',
  './bobina-safe.js','./contact-extra.js','./pwa-update.js','./system-extra.js','./offline-mode.js','./cloud-backup.js','./feedback-extra.js',
  './op-single-safe.js','./formula-share-safe.js','./pdf-button-safe.js','./formula-view-safe.js',
  './vendedor-pdf-profissional.js','./vendedor-extra.js',HISTORICAL_APP
];

function stateUrl(name){return new URL('__df_state_'+name+'__',self.registration.scope).href}
async function readState(name){try{const c=await caches.open(STATE_CACHE);const r=await c.match(stateUrl(name));return r?String(await r.text()):''}catch(e){return''}}
async function writeState(name,value){try{const c=await caches.open(STATE_CACHE);await c.put(stateUrl(name),new Response(String(value??''),{headers:{'content-type':'text/plain'}}))}catch(e){}}
async function getStoredVersion(){return readState('version')}
async function setStoredVersion(v){return writeState('version',String(v||''))}
async function getBadgeCount(){const n=Number(await readState('badge'));return Number.isFinite(n)&&n>0?n:0}
async function setBadge(count){const n=Math.max(0,Math.min(99,Number(count)||0));await writeState('badge',String(n));try{if(n>0&&'setAppBadge' in self.navigator)await self.navigator.setAppBadge(n);else if('clearAppBadge' in self.navigator)await self.navigator.clearAppBadge();else if('setAppBadge' in self.navigator)await self.navigator.setAppBadge(0)}catch(e){}}
async function increaseBadge(){const next=Math.min(99,(await getBadgeCount())+1);await setBadge(next);return next}
async function clearBadge(){await setBadge(0)}
async function currentVersionData(){try{const u=new URL('app-version.json',self.registration.scope);u.searchParams.set('t',Date.now());const r=await fetch(u.toString(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}

async function notifyUpdate(data){
  const title=data.title||'DF EXTRUSOR PRO — Nova atualização';
  return self.registration.showNotification(title,{
    body:data.message||data.body||'Uma nova atualização está disponível.',
    icon:new URL('logo.svg',self.registration.scope).href,
    badge:new URL('logo.svg',self.registration.scope).href,
    tag:'df-extrusor-update',
    renotify:true,
    data:{url:data.url||self.registration.scope,version:data.version||'',kind:data.kind||'update'}
  });
}

async function precache(){
  const cache=await caches.open(DF_CACHE);
  await Promise.allSettled(CORE.map(async url=>{try{const req=new Request(url,{cache:'reload'});const res=await fetch(req);if(res&&(res.ok||res.type==='opaque'))await cache.put(req,res.clone())}catch(e){}}));
}
async function cached(req){const cache=await caches.open(DF_CACHE);return cache.match(req,{ignoreSearch:true})}
async function networkFirst(req){const cache=await caches.open(DF_CACHE);try{const res=await fetch(req);if(res&&(res.ok||res.type==='opaque'))cache.put(req,res.clone()).catch(()=>{});return res}catch(e){const hit=await cache.match(req,{ignoreSearch:true});if(hit)return hit;throw e}}

self.addEventListener('install',event=>{event.waitUntil(precache().then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('df-extrusor-shell-')&&k!==DF_CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url),same=url.origin===self.location.origin,historical=url.href.split('?')[0]===HISTORICAL_APP;
  if(!same&&!historical)return;
  if(same&&req.mode==='navigate'){
    event.respondWith((async()=>{try{return await networkFirst(req)}catch(e){return(await cached('./index.html'))||(await cached('./'))||new Response('DF EXTRUSOR PRO indisponível offline.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}})}})());
    return;
  }
  event.respondWith(networkFirst(req));
});

self.addEventListener('message',event=>{
  const data=event.data||{};
  if(data.type==='DF_SHOW_NOTIFICATION')event.waitUntil((async()=>{await notifyUpdate({title:data.title,body:data.body,message:data.body});await increaseBadge()})());
  if(data.type==='DF_SET_VERSION')event.waitUntil(setStoredVersion(data.version));
  if(data.type==='DF_CLEAR_BADGE')event.waitUntil(clearBadge());
  if(data.type==='DF_CACHE_NOW')event.waitUntil(precache());
});

self.addEventListener('periodicsync',event=>{
  if(event.tag!=='df-version-check')return;
  event.waitUntil((async()=>{try{const data=await currentVersionData();const current=String(data&&data.version||'').trim();if(!current)return;const previous=await getStoredVersion();if(previous&&previous!==current){await notifyUpdate(data||{});await increaseBadge()}await setStoredVersion(current)}catch(e){}})());
});

self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?event.data.text():''}}
    if(!data||(!data.title&&!data.message&&!data.body)){
      const live=await currentVersionData();
      if(live)data=live;
    }
    await notifyUpdate(data||{});
    await increaseBadge();
    if(data&&data.version)await setStoredVersion(String(data.version));
  })());
});

self.addEventListener('pushsubscriptionchange',event=>{event.waitUntil(Promise.resolve())});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||self.registration.scope;
  event.waitUntil((async()=>{await clearBadge();const list=await clients.matchAll({type:'window',includeUncontrolled:true});for(const client of list){if('focus'in client){try{await client.navigate(target)}catch(e){}return client.focus()}}return clients.openWindow(target)})());
});