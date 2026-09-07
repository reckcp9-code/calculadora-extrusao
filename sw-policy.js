const DF_POLICY_API='https://df-extrusor-api.reck-cp9.workers.dev';
const dfOriginalShowNotification=self.registration.showNotification.bind(self.registration);

self.registration.showNotification=async function(title,options){
  const opts=options||{};
  const data=opts.data||{};
  const kind=String(data.kind||'update');
  if(kind!=='update')return dfOriginalShowNotification(title,opts);

  const version=String(data.version||'').trim();
  try{
    const u=new URL(DF_POLICY_API+'/update/notification-policy');
    if(version)u.searchParams.set('version',version);
    u.searchParams.set('t',Date.now());
    const r=await fetch(u.toString(),{cache:'no-store'});
    if(r.ok){
      const j=await r.json();
      if(j&&j.notify===false)return;
    }
  }catch(e){}

  return dfOriginalShowNotification(title,opts);
};

importScripts('./sw.js');