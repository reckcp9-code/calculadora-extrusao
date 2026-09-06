const DF_CACHE='df-extrusor-shell-v2';
const STATE_CACHE='df-extrusor-state-v1';
const CORE=['./','./manifest.webmanifest','./logo.svg','./logo.jpg.jpeg'];

function versionStateUrl(){return new URL('__df_version_state__',self.registration.scope).href}
async function getStoredVersion(){
  try{
    const c=await caches.open(STATE_CACHE);
    const r=await c.match(versionStateUrl());
    return r?String(await r.text()):'';
  }catch(e){return''}
}
async function setStoredVersion(v){
  try{
    const c=await caches.open(STATE_CACHE);
    await c.put(versionStateUrl(),new Response(String(v||''),{headers:{'content-type':'text/plain'}}));
  }catch(e){}
}
async function notifyUpdate(data){
  const title=data.title||'DF EXTRUSOR PRO atualizado';
  const options={
    body:data.message||data.body||'Uma nova atualização está disponível.',
    icon:new URL('logo.svg',self.registration.scope).href,
    badge:new URL('logo.svg',self.registration.scope).href,
    tag:'df-extrusor-update',
    renotify:true,
    data:{url:self.registration.scope}
  };
  return self.registration.showNotification(title,options);
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(DF_CACHE).then(cache=>cache.addAll(CORE).catch(()=>{})).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('df-extrusor-shell-')&&k!==DF_CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).catch(()=>caches.match('./')));
    return;
  }
  event.respondWith(fetch(req).then(res=>{
    const copy=res.clone();
    caches.open(DF_CACHE).then(c=>c.put(req,copy)).catch(()=>{});
    return res;
  }).catch(()=>caches.match(req)));
});

self.addEventListener('message',event=>{
  const data=event.data||{};
  if(data.type==='DF_SHOW_NOTIFICATION'){
    event.waitUntil(notifyUpdate({title:data.title,body:data.body,message:data.body}));
  }
  if(data.type==='DF_SET_VERSION'){
    event.waitUntil(setStoredVersion(data.version));
  }
});

self.addEventListener('periodicsync',event=>{
  if(event.tag!=='df-version-check')return;
  event.waitUntil((async()=>{
    try{
      const url=new URL('app-version.json',self.registration.scope);
      url.searchParams.set('t',Date.now());
      const r=await fetch(url.toString(),{cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      const current=String(data.version||'').trim();
      if(!current)return;
      const previous=await getStoredVersion();
      if(previous&&previous!==current){await notifyUpdate(data)}
      await setStoredVersion(current);
    }catch(e){}
  })());
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?event.data.text():''}}
  event.waitUntil(notifyUpdate(data));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||self.registration.scope;
  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      if('focus' in client){
        try{await client.navigate(target)}catch(e){}
        return client.focus();
      }
    }
    return clients.openWindow(target);
  })());
});
