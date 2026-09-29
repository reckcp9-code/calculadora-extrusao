(function(){
'use strict';
if(window.DFOpTeamPhotoConsistencyV1)return;window.DFOpTeamPhotoConsistencyV1=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2',DEVICE_KEY='df_licenseauth_device_v1',ACCESS_KEY='df_auto_access_credential_v1';
const OPS_KEY='df_formula_ops_auto_v2',TEAM_KEY='df_op_team_v1',TOMB_KEY='df_deleted_ops_v1';
let busy=false,timer=0,lastRun=0;
const norm=v=>String(v||'').trim().toUpperCase();
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function team(){const t=load(TEAM_KEY,null);return t&&t.teamId?t:null}
function deviceId(){try{if(window.DFDeviceIdentity?.get){const x=String(window.DFDeviceIdentity.get()||'').trim();if(x)return x}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p?.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw Error('sem sessão');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw Error(j.error||'sessão indisponível');token=String(j.token||'').trim();sessionStorage.setItem(TOKEN_KEY,token);return token}
async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false)throw Error(j.error||('HTTP '+r.status));return j}
function localMonth(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)}
function selectedMonth(){return String(document.getElementById('dfOpMonth')?.value||localMonth()).slice(0,7)}
function ts(v){const n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
function refresh(){const y=window.scrollY||0,m=document.getElementById('dfOpMonth');if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){};try{window.DFOpTeamDateCanonical?.run?.()}catch(e){};requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}}))}
function missingState(){return load('df_team_missing_cloud_v1',{})}
function saveMissing(v){save('df_team_missing_cloud_v1',v)}

async function reconcile(force){
  const t=team();if(!t||busy||navigator.onLine===false||document.hidden)return false;
  const now=Date.now();if(!force&&now-lastRun<15000)return false;lastRun=now;busy=true;
  try{
    const month=selectedMonth(),j=await apiPost('/op/photo/list',{teamId:t.teamId,month});
    const photos=Array.isArray(j.photos)?j.photos:[],bySource=new Map();for(const p of photos){const id=norm(p?.sourceId||p?.qr);if(id)bySource.set(id,p)}
    let ops=load(OPS_KEY,[]);if(!Array.isArray(ops))ops=[];const miss=missingState(),tombs=load(TOMB_KEY,{});let changed=false,tombChanged=false,missChanged=false,needUpload=[];
    const next=[];
    for(const o of ops){
      const id=norm(o?.id||o?.qr),recMonth=String(o?.data||'').slice(0,7);
      if(!validQr(id)||recMonth!==month||String(o?.cloudTeamId||'')!==String(t.teamId)||!o?.cloudPhotoId){next.push(o);continue}
      const remote=bySource.get(id);
      if(remote){
        if(String(o.cloudPhotoId)!==String(remote.id||'')){o.cloudPhotoId=String(remote.id||'');o.cloudSyncedAt=String(remote.updatedAt||remote.createdAt||o.cloudSyncedAt||'');changed=true}
        if(miss[id]){delete miss[id];missChanged=true}
        next.push(o);continue;
      }
      // Se houve uma nova baixa local depois do último envio, não apaga: limpa o ID antigo e reenvia.
      if(ts(o.manualConfirmedAt||o.updatedAt)>ts(o.cloudSyncedAt)+1000){o.cloudPhotoId='';o.cloudSyncedAt='';changed=true;needUpload.push(o);if(miss[id]){delete miss[id];missChanged=true}next.push(o);continue}
      const m=miss[id];
      if(!m){miss[id]={first:now,count:1};missChanged=true;next.push(o);continue}
      m.count=(Number(m.count)||1)+1;missChanged=true;
      if(m.count>=2&&now-Number(m.first||now)>1200){
        tombs[id]={at:now,cloudIds:[String(o.cloudPhotoId)],produto:String(o.produto||''),produzido:Number(o.produzido)||0,apara:Number(o.apara)||0,remoteDelete:true};tombChanged=true;changed=true;delete miss[id];
        continue;
      }
      next.push(o);
    }
    if(changed)save(OPS_KEY,next);if(tombChanged)save(TOMB_KEY,tombs);if(missChanged)saveMissing(miss);
    if(changed||tombChanged){refresh();try{window.dispatchEvent(new CustomEvent('df-op-team-consistency-updated'))}catch(e){}}
    if(needUpload.length){try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:needUpload[0],resync:true}}))}catch(e){}}
    return changed||tombChanged;
  }catch(e){return false}finally{busy=false}
}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(()=>reconcile(!!force),ms==null?300:ms)}

window.addEventListener('pageshow',()=>schedule(800,false));
window.addEventListener('online',()=>schedule(900,true));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(900,false)});
document.addEventListener('click',e=>{if(e.target?.closest?.('#dfCloudRefresh,[data-pane="ok"],[data-pane="archive"],[data-pane="month"]'))schedule(900,false)},true);
window.addEventListener('df-op-cloud-synced',()=>schedule(700,false));
window.addEventListener('df-op-record-deleted',()=>schedule(1400,true));
window.DFOpTeamPhotoConsistency={run:()=>reconcile(true)};
})();
