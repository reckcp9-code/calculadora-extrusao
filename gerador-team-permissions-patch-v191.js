(function(){
'use strict';
if(window.DFGeradorPermPatchV191)return;window.DFGeradorPermPatchV191=true;
var API='https://df-extrusor-api.reck-cp9.workers.dev',TEAM_KEY='df_op_team_v1',CACHE_KEY='df_team_tab_permissions_v1',PREFIX='DFPERM1.';
var busy=false;
function load(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function enc(v){return btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function tiny(){var b=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');return new Blob([Uint8Array.from(b,function(c){return c.charCodeAt(0)})],{type:'image/png'})}
function tabs(){function c(id){var e=document.getElementById(id);return !!(e&&e.checked)}return{extrusao:c('dfPermExtrusao'),formulacao:c('dfPermFormulacao'),sacolas:c('dfPermSacolas'),custo:c('dfPermCusto'),curso:c('dfPermCurso')}}
function status(text,kind){var e=document.getElementById('dfTeamPermMsg');if(!e)return;e.textContent=text;e.className='status '+(kind||'')}
function cache(p){var a=load(CACHE_KEY,{});if(!a||typeof a!=='object')a={};a[p.teamId]={teamId:p.teamId,tabs:p.tabs,updatedAt:p.updatedAt};save(CACHE_KEY,a)}
async function publish(){if(busy)return;var t=load(TEAM_KEY,null);if(!t||!t.teamId||String(t.role||'').toLowerCase()!=='owner'){status('A equipe precisa estar como DONO para salvar.','bad');return}var api=window.DFGeradorTeamPermissions;if(!api||typeof api.tryExisting!=='function'){status('Sessão do dono ainda não ficou pronta. Tente novamente.','bad');return}busy=true;var btn=document.getElementById('dfPermSave');if(btn){btn.disabled=true;btn.textContent='SALVANDO...'}try{var s=await api.tryExisting();if(!s)throw new Error('sessão do dono indisponível');var payload={v:2,teamId:t.teamId,tabs:tabs(),updatedAt:new Date().toISOString()},marker=PREFIX+enc(payload),fd=new FormData();fd.append('teamId',t.teamId);fd.append('sourceId',marker);fd.append('qr',marker);fd.append('production','0');fd.append('scrap','0');fd.append('createdAt',payload.updatedAt);fd.append('photo',tiny(),'permissoes-equipe.png');var r=await fetch(API+'/op/photo/upload',{method:'POST',headers:{'Authorization':'Bearer '+s.token,'X-DF-Device':s.deviceId},body:fd,cache:'no-store'}),j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));cache(payload);status('✅ Permissões salvas na nuvem. Os operadores recebem automaticamente.','ok');try{window.dispatchEvent(new CustomEvent('df-team-permissions-published',{detail:payload}))}catch(e){}}catch(e){status('Não consegui confirmar na nuvem: '+(e.message||e),'bad')}finally{busy=false;if(btn){btn.disabled=false;btn.textContent='SALVAR PERMISSÕES DA EQUIPE'}}}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('#dfPermSave'):null;if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();publish()},true);
window.DFGeradorPermPatchV191API={publish:publish};
})();
