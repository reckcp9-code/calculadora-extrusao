(function(){
'use strict';
if(window.DFOpTeamMemberNamesV1)return;window.DFOpTeamMemberNamesV1=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev',TEAM='df_op_team_v1',NAME='df_op_member_display_name_v1';
const $=id=>document.getElementById(id);let tm=0,lastMembersAt=0,membersBusy=false;
function loadTeam(){try{return JSON.parse(localStorage.getItem(TEAM)||'null')}catch(e){return null}}
function saveTeam(t){try{if(t)localStorage.setItem(TEAM,JSON.stringify(t))}catch(e){}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clean(v){return String(v||'').replace(/\s+/g,' ').trim().slice(0,60)}
function savedName(){try{return clean(localStorage.getItem(NAME)||'')}catch(e){return''}}
function setSavedName(v){v=clean(v);try{if(v)localStorage.setItem(NAME,v)}catch(e){}return v}

function addStyle(){if($('dfTeamNamesStyle'))return;const s=document.createElement('style');s.id='dfTeamNamesStyle';s.textContent=`
#dfTeamJoinNameWrap{margin-top:7px}#dfTeamJoinNameWrap input,#dfMyMemberName{width:100%;box-sizing:border-box;border:1px solid #334155;background:#08111f;color:#fff;border-radius:10px;padding:11px;font-size:16px;text-transform:none!important}
#dfTeamMembersNames{margin-top:9px;border:1px solid #334155;background:#0b1220;border-radius:12px;padding:10px}#dfTeamMembersNames .ttl{font-size:12px;font-weight:950;color:#f8fafc;margin-bottom:6px}#dfTeamMembersNames .row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #1f2937;font-size:11px}#dfTeamMembersNames .row:first-of-type{border-top:0}#dfTeamMembersNames .name{font-weight:900;color:#bfdbfe}#dfTeamMembersNames .role{font-size:10px;color:#86efac;font-weight:850}#dfMemberNameEditor{margin-top:8px;border:1px dashed #f59e0b;background:#241600;border-radius:10px;padding:9px}#dfMemberNameEditor button{width:100%;margin-top:7px;border:1px solid #22c55e;background:#0d2a18;color:#bbf7d0;border-radius:10px;padding:10px;font-size:11px;font-weight:900}`;document.head.appendChild(s)}

function mountJoinName(){
  const team=loadTeam(),box=$('dfOpTeamCloud'),join=$('dfCloudJoin'),code=$('dfCloudCode');
  if(team||!box||!join||!code)return false;addStyle();
  let w=$('dfTeamJoinNameWrap');if(!w){w=document.createElement('div');w.id='dfTeamJoinNameWrap';w.innerHTML='<input id="dfTeamJoinName" maxlength="60" autocomplete="name" placeholder="NOME DO OPERADOR">';code.parentNode.insertBefore(w,code)}
  const input=$('dfTeamJoinName');if(input&&!input.value&&savedName())input.value=savedName();return true;
}

const previousFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  let url='';try{url=typeof input==='string'?input:String(input&&input.url||'')}catch(e){}
  if(url.indexOf('/op/team/join')>=0&&init&&String(init.method||'GET').toUpperCase()==='POST'&&typeof init.body==='string'){
    try{const body=JSON.parse(init.body)||{},name=clean($('dfTeamJoinName')?.value||savedName());if(name){body.displayName=name;setSavedName(name);init=Object.assign({},init,{body:JSON.stringify(body)})}}catch(e){}
  }
  return previousFetch(input,init);
};

document.addEventListener('click',function(e){
  const join=e.target&&e.target.closest?e.target.closest('#dfCloudJoin'):null;if(!join)return;
  const n=clean($('dfTeamJoinName')?.value||'');if(!n){e.preventDefault();e.stopImmediatePropagation();alert('Digite o nome do operador antes de entrar na equipe.');$('dfTeamJoinName')?.focus();return}setSavedName(n);
},true);

async function post(path,body){
  const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j;
}
async function saveMyName(){
  const t=loadTeam(),input=$('dfMyMemberName'),name=clean(input&&input.value);if(!t||!t.teamId||!name){alert('Digite o nome do operador.');return}
  const b=$('dfSaveMemberName');if(b){b.disabled=true;b.textContent='SALVANDO...'}
  try{const j=await post('/op/team/member-name',{teamId:t.teamId,displayName:name});setSavedName(name);t.displayName=String(j.displayName||name);saveTeam(t);renderEditor();await refreshMembers(true);try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:t}}))}catch(e){}}
  catch(e){alert('Não foi possível salvar o nome: '+(e.message||e));if(b){b.disabled=false;b.textContent='✅ SALVAR MEU NOME'}}
}
function renderEditor(){
  const t=loadTeam(),box=$('dfOpTeamCloud');if(!t||!box)return;
  let ed=$('dfMemberNameEditor');const own=clean(t.displayName||savedName());
  if(own){if(ed)ed.remove();return}
  if(String(t.role||'')!=='operator')return;
  if(!ed){ed=document.createElement('div');ed.id='dfMemberNameEditor';ed.innerHTML='<div style="font-size:11px;font-weight:900;color:#fde68a;margin-bottom:6px">👤 DEFINA SEU NOME NA EQUIPE</div><input id="dfMyMemberName" maxlength="60" autocomplete="name" placeholder="Ex.: João"><button id="dfSaveMemberName" type="button">✅ SALVAR MEU NOME</button>';const msg=$('dfCloudRuntimeMsg');if(msg)msg.insertAdjacentElement('afterend',ed);else box.appendChild(ed);$('dfSaveMemberName').onclick=saveMyName}
}
function renderMembers(members){
  const box=$('dfOpTeamCloud');if(!box)return;let p=$('dfTeamMembersNames');if(!p){p=document.createElement('div');p.id='dfTeamMembersNames';box.appendChild(p)}
  const list=Array.isArray(members)?members:[];p.innerHTML='<div class="ttl">👥 EQUIPE • '+list.length+' '+(list.length===1?'pessoa':'pessoas')+'</div>'+list.map((m,i)=>'<div class="row"><span class="name">'+esc(clean(m.displayName)||(m.role==='owner'?'Dono':'Operador '+(i+1)))+'</span><span class="role">'+(m.role==='owner'?'DONO':'OPERADOR')+'</span></div>').join('');
}
async function refreshMembers(force){
  const t=loadTeam();if(!t||!t.teamId||membersBusy)return;if(!force&&Date.now()-lastMembersAt<4000)return;membersBusy=true;
  try{const j=await post('/op/team/members',{teamId:t.teamId});lastMembersAt=Date.now();renderMembers(j.members||[])}catch(e){}finally{membersBusy=false}
}
function render(force){addStyle();mountJoinName();renderEditor();const t=loadTeam();if(t&&t.teamId)refreshMembers(!!force);else{$('dfTeamMembersNames')?.remove();$('dfMemberNameEditor')?.remove()}}
function schedule(delay,force){clearTimeout(tm);tm=setTimeout(()=>render(!!force),delay==null?120:delay)}
function boot(){addStyle();schedule(0,true);setTimeout(()=>schedule(0,true),700);setTimeout(()=>schedule(0,true),1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('df-team-joined',()=>schedule(120,true));window.addEventListener('df-team-changed',()=>schedule(120,true));window.addEventListener('pageshow',()=>schedule(120,false));
document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#dfCloudRefresh'))setTimeout(()=>refreshMembers(true),350)},true);
})();
