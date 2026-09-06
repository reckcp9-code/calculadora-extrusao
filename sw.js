const DF_CACHE='df-extrusor-shell-v1';
const CORE=['./','./manifest.webmanifest','./logo.svg','./logo.jpg.jpeg'];

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
    const title=data.title||'DF EXTRUSOR PRO atualizado';
    const options={
      body:data.body||'Uma nova versão está disponível.',
      icon:'./logo.svg',
      badge:'./logo.svg',
      tag:'df-extrusor-update',
      renotify:true,
      data:{url:data.url||'./'}
    };
    event.waitUntil(self.registration.showNotification(title,options));
  }
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?event.data.text():''}}
  const title=data.title||'DF EXTRUSOR PRO atualizado';
  const options={
    body:data.body||'Uma nova atualização está disponível.',
    icon:'./logo.svg',
    badge:'./logo.svg',
    tag:data.tag||'df-extrusor-push',
    renotify:true,
    data:{url:data.url||'./'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
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
