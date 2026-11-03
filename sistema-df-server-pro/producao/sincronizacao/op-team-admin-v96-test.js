(function(){
  'use strict';
  if(window.DFOpTeamAdminV96Test)return;
  window.DFOpTeamAdminV96Test=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TEAM_KEY='df_op_team_v1';
  const TEAM_CODE_KEY='df_op_team_join_code_v1';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const loadTeam=()=>{try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}};
  const saveTeam=t=>{try{if(t)localStorage.setItem(TEAM_KEY,JSON.stringify(t));else localStorage.removeItem(TEAM_KEY)}catch(e){}};
  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
  function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
  async function renewSession(force){let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();if(!credential||!dev)throw new Error('acesso automático indisponível');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');sessionStorage.setItem(TOKEN_KEY,token);return token}
  async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;er.data=j;throw er}return j}

  function addStyle(){if($('dfTeamAdminV96Style'))return;const s=document.createElement('style');s.id='dfTeamAdminV96Style';s.textContent=`
    #dfTeamAdminV96{margin-top:9px;display:grid;gap:7px}
    #dfTeamAdminV96 button{width:100%;border-radius:10px;padding:11px 10px;font-size:11px;font-weight:950}
    #dfTeamTransferBtn{border:1px solid #f59e0b;background:#2a1c03;color:#fde68a}
    #dfTeamLeaveBtn{border:1px solid #ef4444;background:#2b1010;color:#fecaca}
    #dfTeamAdminPanel{border:1px solid #475569;background:#0b1220;border-radius:12px;padding:10px;margin-top:2px}
    #dfTeamAdminPanel .dfTaTitle{font-size:12px;font-weight:950;color:#f8fafc;margin-bottom:7px}
    #dfTeamAdminPanel .dfTaHint{font-size:11px;color:#94a3b8;line-height:1.4;margin-bottom:8px}
    #dfTeamAdminPanel .dfTaMember{border:1px solid #334155;background:#111827;border-radius:10px;padding:9px;margin-top:7px}
    #dfTeamAdminPanel .dfTaMember b{color:#bfdbfe}
    #dfTeamAdminPanel .dfTaMember small{display:block;color:#94a3b8;margin-top:3px}
    #dfTeamAdminPanel .dfTaMember button{margin-top:7px;border:1px solid #22c55e;background:#0d2a18;color:#bbf7d0}
    #dfTeamAdminMsg{font-size:11px;font-weight:850;color:#fde68a;line-height:1.4}
  `;document.head.appendChild(s)}

  function fmtDate(v){try{const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}
  function msg(text){const e=$('dfTeamAdminMsg');if(e)e.textContent=text||''}

  async function transferTo(teamId,member){
    if(!confirm('Transferir a propriedade desta equipe para este operador?\n\nDepois disso você vira OPERADOR e poderá sair da equipe.'))return;
    msg('Transferindo propriedade...');
    try{
      const j=await apiPost('/op/team/transfer-owner',{teamId,memberId:member.id});
      const t=loadTeam();if(t){t.role='operator';saveTeam(t)}
      try{localStorage.removeItem(TEAM_CODE_KEY)}catch(e){}
      alert(j.message||'Propriedade transferida.');
      location.reload();
    }catch(e){msg('Não foi possível transferir: '+(e.message||e))}
  }

  async function openTransfer(team){
    let panel=$('dfTeamAdminPanel');
    if(panel){panel.remove();return}
    panel=document.createElement('div');panel.id='dfTeamAdminPanel';panel.innerHTML='<div class="dfTaTitle">👑 TRANSFERIR PROPRIEDADE</div><div class="dfTaHint">Escolha um operador. Ele passará a ser o dono e você ficará como operador.</div><div id="dfTeamAdminMsg">Carregando membros...</div><div id="dfTeamAdminMembers"></div>';
    $('dfTeamAdminV96').appendChild(panel);
    try{
      const j=await apiPost('/op/team/members',{teamId:String(team.teamId||'')});
      const all=Array.isArray(j.members)?j.members:[];
      const ops=all.filter(m=>String(m.role||'')!=='owner');
      const list=$('dfTeamAdminMembers');
      if(!ops.length){msg('Não há outro operador nesta equipe para receber a propriedade.');return}
      msg('');
      ops.forEach((m,i)=>{
        const row=document.createElement('div');row.className='dfTaMember';
        const last=fmtDate(m.lastActivity||m.joinedAt);
        row.innerHTML='<b>OPERADOR '+(i+1)+'</b><small>ID: '+esc(String(m.id||'').slice(0,14))+(last?' • Última atividade: '+esc(last):'')+'</small><button type="button">TORNAR ESTE OPERADOR O DONO</button>';
        row.querySelector('button').onclick=()=>transferTo(String(team.teamId||''),m);
        list.appendChild(row);
      });
    }catch(e){msg('Não foi possível carregar os membros: '+(e.message||e))}
  }

  async function leaveTeam(team){
    if(!confirm('Sair desta equipe?\n\nSuas OPs, fotos e o histórico da equipe não serão apagados.'))return;
    const btn=$('dfTeamLeaveBtn');if(btn){btn.disabled=true;btn.textContent='SAINDO...'}
    try{
      const j=await apiPost('/op/team/leave',{teamId:String(team.teamId||'')});
      saveTeam(null);try{localStorage.removeItem(TEAM_CODE_KEY)}catch(e){}
      alert(j.message||'Você saiu da equipe.');
      location.reload();
    }catch(e){if(btn){btn.disabled=false;btn.textContent='🚪 SAIR DA EQUIPE'}alert('Não foi possível sair: '+(e.message||e))}
  }

  function enhance(){
    addStyle();
    const box=$('dfOpTeamCloud');if(!box)return;
    const team=loadTeam();
    const old=$('dfTeamAdminV96');if(old)old.remove();
    if(!team||!team.teamId)return;
    const wrap=document.createElement('div');wrap.id='dfTeamAdminV96';
    if(String(team.role||'')==='owner'){
      const b=document.createElement('button');b.id='dfTeamTransferBtn';b.type='button';b.textContent='👑 TRANSFERIR PROPRIEDADE';b.onclick=()=>openTransfer(team);wrap.appendChild(b);
    }else{
      const b=document.createElement('button');b.id='dfTeamLeaveBtn';b.type='button';b.textContent='🚪 SAIR DA EQUIPE';b.onclick=()=>leaveTeam(team);wrap.appendChild(b);
    }
    box.appendChild(wrap);
  }

  let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(enhance,80)}
  const obs=new MutationObserver(schedule);
  function start(){const root=document.body;if(root)obs.observe(root,{childList:true,subtree:true});schedule();setTimeout(schedule,600);setTimeout(schedule,1600)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('df-ui-ready',schedule);
  window.addEventListener('df-team-changed',schedule);
  window.addEventListener('df-team-joined',schedule);
})();
