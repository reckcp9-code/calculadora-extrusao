(function(){
'use strict';
if(window.DF_PRODUCAO_EQUIPE_AREA_GUARD_V1)return;window.DF_PRODUCAO_EQUIPE_AREA_GUARD_V1=true;

const AREA='producao';
const API_HOST='df-extrusor-api.reck-cp9.workers.dev';
const TEAM_KEY='df_producao_team_v2';
const TEAM_CODE_KEY='df_producao_team_join_code_v2';
const SNAP_KEY='df_producao_team_snapshot_v2';
const CFG_SNAP_KEY='df_producao_team_catalog_snapshot_v2';
const PHOTO_MAP_KEY='df_producao_team_photo_map_v2';

function readJsonKey(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function clearWrongProductionTeam(){
  const t=readJsonKey(TEAM_KEY);
  if(!t||!t.teamId)return false;
  const area=String(t.area||'').trim().toLowerCase();
  const name=String(t.name||'').trim();
  const wrong=area!==AREA||/DF\s*EXTRUSOR/i.test(name);
  if(!wrong)return false;
  try{localStorage.removeItem(TEAM_KEY);localStorage.removeItem(TEAM_CODE_KEY);localStorage.removeItem(SNAP_KEY);localStorage.removeItem(CFG_SNAP_KEY);localStorage.removeItem(PHOTO_MAP_KEY)}catch(e){}
  return true;
}

clearWrongProductionTeam();

const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let url='';
  try{url=typeof input==='string'?input:String(input&&input.url||'')}catch(e){}
  let u=null;
  try{u=new URL(url,location.href)}catch(e){}
  const isApi=!!u&&u.hostname===API_HOST;
  if(isApi&&init){
    try{
      if(init.body instanceof FormData){
        if(!init.body.has('area'))init.body.append('area',AREA);
        if(!init.body.has('scope'))init.body.append('scope',AREA);
      }else if(typeof init.body==='string'&&/application\/json/i.test(String(init.headers&&((init.headers['Content-Type'])||(init.headers['content-type']))||''))){
        const j=JSON.parse(init.body||'{}');
        if(j&&typeof j==='object'){
          if(!j.area)j.area=AREA;
          if(!j.scope)j.scope=AREA;
          init={...init,body:JSON.stringify(j)};
        }
      }
    }catch(e){}
  }

  const res=await nativeFetch(input,init);
  if(!isApi||!u||!/^\/op\/team\/(?:status|create|join|members|member-name)$/.test(u.pathname))return res;

  try{
    const clone=res.clone();
    const data=await clone.json();
    const team=data&&data.team;
    if(team&&team.teamId){
      const teamArea=String(team.area||data.area||'').trim().toLowerCase();
      if(teamArea!==AREA){
        const payload={ok:false,error:'A API ainda retornou a equipe da Extrusão. A Produção não vai reutilizar essa equipe.',code:'PRODUCTION_TEAM_AREA_MISMATCH'};
        return new Response(JSON.stringify(payload),{status:409,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
      }
    }
  }catch(e){}
  return res;
};

window.addEventListener('pageshow',clearWrongProductionTeam);
})();
