(function(){
'use strict';
if(window.DF_PRODUCAO_EQUIPE_AREA_GUARD_V2)return;window.DF_PRODUCAO_EQUIPE_AREA_GUARD_V2=true;

const AREA='producao';
const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
const TEAM_KEY='df_producao_team_v2';
const TEAM_CODE_KEY='df_producao_team_join_code_v2';
const SNAP_KEY='df_producao_team_snapshot_v2';
const CFG_SNAP_KEY='df_producao_team_catalog_snapshot_v2';
const PHOTO_MAP_KEY='df_producao_team_photo_map_v2';
const CAD_KEY='df_producao_cadastros_v1';
const REPAIR_KEY='df_producao_sync_repair_v236';
const REPAIR_VERSION='236-qrlong-owner-seed';

function readJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function team(){const t=readJson(TEAM_KEY,null);return t&&t.teamId?t:null}
function clearWrongProductionTeam(){
  const t=team();if(!t)return false;
  const area=String(t.area||'').trim().toLowerCase(),name=String(t.name||'').trim();
  if(area===AREA&&!/DF\s*EXTRUSOR/i.test(name))return false;
  try{localStorage.removeItem(TEAM_KEY);localStorage.removeItem(TEAM_CODE_KEY);localStorage.removeItem(SNAP_KEY);localStorage.removeItem(CFG_SNAP_KEY);localStorage.removeItem(PHOTO_MAP_KEY)}catch(e){}
  return true;
}
function prepareRepair(){
  const t=team();if(!t||String(t.area||'').toLowerCase()!==AREA)return;
  let done='';try{done=localStorage.getItem(REPAIR_KEY)||''}catch(e){}
  if(done===REPAIR_VERSION)return;
  try{
    if(String(t.role||'').toLowerCase()==='owner'){
      localStorage.removeItem(SNAP_KEY);
      localStorage.removeItem(CFG_SNAP_KEY);
    }
    localStorage.setItem(REPAIR_KEY,REPAIR_VERSION);
  }catch(e){}
}

clearWrongProductionTeam();prepareRepair();

let cadBefore='';try{cadBefore=localStorage.getItem(CAD_KEY)||''}catch(e){}
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let url='';try{url=typeof input==='string'?input:String(input&&input.url||'')}catch(e){}
  let u=null;try{u=new URL(url,location.href)}catch(e){}
  const isApi=!!u&&u.hostname===API_HOST;
  if(isApi&&init){
    try{
      if(init.body instanceof FormData){
        if(!init.body.has('area'))init.body.append('area',AREA);
        if(!init.body.has('scope'))init.body.append('scope',AREA);
        if(u.pathname==='/op/photo/upload'){
          const qr=String(init.body.get('qr')||'');
          const t=team();
          if(qr.startsWith('DFPRODCFG3.')&&String(t&&t.role||'').toLowerCase()!=='owner'){
            return new Response(JSON.stringify({ok:true,skipped:true,area:AREA}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
          }
        }
      }else if(typeof init.body==='string'&&/application\/json/i.test(String(init.headers&&((init.headers['Content-Type'])||(init.headers['content-type']))||''))){
        const j=JSON.parse(init.body||'{}');if(j&&typeof j==='object'){if(!j.area)j.area=AREA;if(!j.scope)j.scope=AREA;init={...init,body:JSON.stringify(j)}}
      }
    }catch(e){}
  }
  const res=await nativeFetch(input,init);
  if(!isApi||!u)return res;
  if(/^\/op\/team\/(?:status|create|join|members|member-name)$/.test(u.pathname)){
    try{const data=await res.clone().json(),tt=data&&data.team;if(tt&&tt.teamId){const a=String(tt.area||data.area||'').trim().toLowerCase();if(a!==AREA)return new Response(JSON.stringify({ok:false,error:'Equipe de Produção inválida.',code:'PRODUCTION_TEAM_AREA_MISMATCH'}),{status:409,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}}catch(e){}
  }
  return res;
};

window.addEventListener('df-producao-team-changed',()=>{clearWrongProductionTeam();prepareRepair()});
window.addEventListener('pageshow',()=>{clearWrongProductionTeam();prepareRepair()});
window.addEventListener('df-producao-team-synced',()=>{
  let now='';try{now=localStorage.getItem(CAD_KEY)||''}catch(e){}
  if(now&&now!==cadBefore){
    cadBefore=now;
    const mark='df_prod_cad_reload_'+String(now.length)+'_'+String(now.slice(0,24));
    try{if(sessionStorage.getItem(mark)!=='1'){sessionStorage.setItem(mark,'1');setTimeout(()=>location.reload(),120)}}catch(e){}
  }
});
})();
