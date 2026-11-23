(function(){
'use strict';
if(window.DFCompanyRegistrationV885)return;
window.DFCompanyRegistrationV885=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const DEFAULT='FERREIRA EMBALAGENS';
const $=id=>document.getElementById(id);
const team=()=>window.DFOpCloud?.team?.()||null;
const clean=v=>String(v||'').replace(/\s+/g,' ').trim().slice(0,80);
const key=id=>'df_company_name_v885:'+id;
function name(){
 const t=team();if(!t?.teamId)return DEFAULT;
 const remote=clean(t.name);
 if(remote&&!/^DF (EXTRUSOR|PRODUÇÃO|PRODUCAO)$/i.test(remote))return remote;
 return DEFAULT;
}
window.DFCompanyRegistration={name,team};
function device(){return String(window.DFDeviceIdentity?.get?.()||localStorage.getItem('df_licenseauth_device_v1')||'').trim()}
async function session(){
 let token=String(sessionStorage.getItem('df_secure_token_v2')||'').trim();
 if(token)return token;
 const credential=String(localStorage.getItem('df_auto_access_credential_v1')||'').trim();
 if(!credential||!device())throw Error('Entre novamente no aplicativo para autenticar.');
 const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':device()},body:JSON.stringify({credential,deviceId:device()}),cache:'no-store'});
 const j=await r.json();if(!r.ok||!j.token)throw Error(j.error||'Sessão indisponível.');
 sessionStorage.setItem('df_secure_token_v2',j.token);return j.token;
}
async function save(value){
 const t=team();if(!t?.teamId)throw Error('Conecte uma equipe antes de cadastrar a empresa.');
 if(t.role!=='owner')throw Error('Somente o dono da equipe pode alterar o cadastro.');
 const token=await session();
 const r=await fetch(API+'/op/team/company/save',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':device()},body:JSON.stringify({teamId:t.teamId,area:t.area||'extrusao',name:value}),cache:'no-store'});
 const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Não foi possível salvar.');
 await window.DFOpCloud?.refreshTeam?.();
 localStorage.setItem(key(t.teamId),j.name);
 window.dispatchEvent(new CustomEvent('df-company-updated',{detail:j}));
 return j;
}
function render(){
 const p=$('pgFo'),n=p?.querySelector(':scope > .dfAutoTopics');
 if(!p||!n)return;
 if(!$('dfCompanyStyle')){
 const style=document.createElement('style');style.id='dfCompanyStyle';
 style.textContent='#pgFo.dfCompanyOnly > :not(.dfAutoTopics):not(#dfCompanyCard){display:none!important}#dfCompanyCard{display:none;background:#111827;color:#f8fafc;border:1px solid #334155;border-radius:20px;padding:24px;margin-top:20px}#pgFo.dfCompanyOnly #dfCompanyCard{display:block!important}#dfCompanyCard label{display:block;margin:16px 0 8px;color:#cbd5e1}#dfCompanyCard input{box-sizing:border-box;width:100%;background:#0f172a;color:white;border:1px solid #475569;border-radius:12px;padding:16px;font-size:17px}#dfCompanySave{margin-top:18px;width:100%;background:#0d3824;border:1px solid #16a34a;color:#86efac;padding:16px;border-radius:12px;font-weight:900}#dfCompanySave:disabled{opacity:.55}#dfCompanyNav{order:99!important;flex:0 0 auto!important;min-width:145px!important}';
 document.head.appendChild(style);
 }
 let btn=$('dfCompanyNav');
 if(!btn){btn=document.createElement('button');btn.id='dfCompanyNav';btn.type='button';btn.className='dfAutoTopic';btn.textContent='🏢 CADASTRO';n.appendChild(btn);}
 let card=$('dfCompanyCard');
 if(!card){card=document.createElement('section');card.id='dfCompanyCard';card.innerHTML='<h2>🏢 Cadastro da empresa</h2><p>Nome exibido no cabeçalho das novas ordens de produção.</p><label for="dfCompanyInput">Nome da empresa</label><input id="dfCompanyInput" maxlength="80" autocomplete="organization"><button id="dfCompanySave" type="button">SALVAR NOME DA EMPRESA</button><p id="dfCompanyMsg" role="status"></p>';p.appendChild(card);}
 if(!btn.dataset.bound){btn.dataset.bound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();window.DFFormulaOpsUI?.close?.();p.classList.remove('dfCleanBackupOnly','dfCleanWhatsOnly');p.classList.add('dfCompanyOnly');n.querySelectorAll('.dfAutoTopic').forEach(x=>x.classList.toggle('on',x===btn));const t=team(),owner=t?.role==='owner';$('dfCompanyInput').value=name();$('dfCompanyInput').disabled=!owner;$('dfCompanySave').disabled=!owner;$('dfCompanyMsg').textContent=!t?'Conecte uma equipe para salvar.':owner?'Somente o dono pode alterar este nome.':'Cadastro disponível apenas para o dono da equipe.';window.scrollTo(0,0);},true);}
 if(!card.dataset.bound){card.dataset.bound='1';$('dfCompanySave').addEventListener('click',async()=>{const b=$('dfCompanySave'),m=$('dfCompanyMsg'),v=clean($('dfCompanyInput').value).toUpperCase();if(!v){m.textContent='Digite o nome da empresa.';return;}b.disabled=true;m.textContent='Salvando na nuvem...';try{await save(v);m.textContent='✅ Nome salvo na Cloudflare. As próximas OPs usarão '+v+'.';}catch(e){m.textContent='⚠️ '+(e.message||e)}finally{b.disabled=team()?.role!=='owner';}});}
}
document.addEventListener('click',e=>{if(!$('pgFo')?.classList.contains('dfCompanyOnly'))return;if(e.target?.closest?.('#dfCompanyNav,#dfCompanyCard'))return;if(e.target?.closest?.('.dfAutoTopic'))$('pgFo').classList.remove('dfCompanyOnly');},true);
let timer=0;function tick(){if(document.hidden)return;render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{render();timer=setInterval(tick,1800)});else{render();timer=setInterval(tick,1800)}
window.addEventListener('df-team-changed',render);window.addEventListener('df-ui-ready',render);
})();