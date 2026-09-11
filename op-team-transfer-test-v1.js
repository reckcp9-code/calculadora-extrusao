(function(){
  'use strict';
  if(window.DFOpTeamTransferTestV1)return;
  window.DFOpTeamTransferTestV1=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TEAM_KEY='df_op_team_v1';

  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const id=String(window.DFDeviceIdentity.get()||'').trim();
        if(id)return id;
      }
    }catch(e){}
    try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return ''}
  }

  function tokenPayload(token){
    try{
      let s=String(token||'').split('.')[0]||'';
      s=s.replace(/-/g,'+').replace(/_/g,'/');
      while(s.length%4)s+='=';
      return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));
    }catch(e){return null}
  }

  async function renewSession(force){
    let token='';
    try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}
    const p=tokenPayload(token);
    if(token&&!force&&p&&p.owner)return token;
    let credential='';
    try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}
    const dev=deviceId();
    if(!credential||!dev)throw new Error('Acesso automático indisponível.');
    const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||'Sessão indisponível.');
    token=String(j.token||'').trim();
    if(!token)throw new Error('Sessão vazia.');
    try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}
    return token;
  }

  async function apiPost(path,body,retry){
    const token=await renewSession(false),dev=deviceId();
    const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}
    if(!r.ok||j.ok===false){const er=new Error(j.error||('HTTP '+r.status));er.status=r.status;er.data=j;throw er}
    return j;
  }

  function savedTeam(){
    try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}
  }

  function ensureStyle(){
    if($('dfTeamTransferTestStyle'))return;
    const s=document.createElement('style');
    s.id='dfTeamTransferTestStyle';
    s.textContent=`
      #dfTeamManageTest{margin-top:9px;border-top:1px solid #24334a;padding-top:9px}
      #dfTeamManageTest .dfTmBtn{width:100%;border-radius:10px;padding:11px 10px;font-size:11px;font-weight:900;letter-spacing:.2px}
      #dfTeamManageTest .dfTmTransfer{border:1px solid #f59e0b;background:#2a1c05;color:#fde68a}
      #dfTeamManageTest .dfTmLeave{border:1px solid #ef4444;background:#2a0d12;color:#fecaca}
      #dfTeamManageTest .dfTmCancel{border:1px solid #475569;background:#111827;color:#cbd5e1;margin-top:7px}
      #dfTeamTransferPanel{margin-top:9px;border:1px solid #334155;background:#07101f;border-radius:12px;padding:10px}
      #dfTeamTransferPanel .dfTmTitle{font-size:12px;font-weight:900;color:#fde68a;margin-bottom:4px}
      #dfTeamTransferPanel .dfTmHelp{font-size:11px;line-height:1.45;color:#94a3b8;margin-bottom:8px}
      #dfTeamTransferPanel .dfTmMember{border:1px solid #263244;background:#0f172a;border-radius:10px;padding:9px;margin-top:7px}
      #dfTeamTransferPanel .dfTmMemberInfo{font-size:11px;color:#cbd5e1;line-height:1.45;margin-bottom:7px}
      #dfTeamTransferPanel .dfTmChoose{width:100%;border:1px solid #22c55e;background:#0b2417;color:#86efac;border-radius:9px;padding:9px;font-size:11px;font-weight:900}
      #dfTeamManageMsg{margin-top:7px;font-size:11px;font-weight:850;color:#94a3b8;line-height:1.45}
      #dfTeamManageMsg.ok{color:#86efac}#dfTeamManageMsg.err{color:#fca5a5}#dfTeamManageMsg.warn{color:#fde68a}
    `;
    document.head.appendChild(s);
  }

  function setMsg(text,type){
    const e=$('dfTeamManageMsg');
    if(!e)return;
    e.textContent=text||'';
    e.className=type||'';
  }

  function fmtDate(v){
    try{const d=new Date(v);if(!Number.isFinite(d.getTime()))return '';return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}
  }

  async function openTransferPanel(team){
    const host=$('dfTeamManageTest');
    if(!host)return;
    let panel=$('dfTeamTransferPanel');
    if(!panel){panel=document.createElement('div');panel.id='dfTeamTransferPanel';host.appendChild(panel)}
    panel.innerHTML='<div class="dfTmTitle">TRANSFERIR PROPRIEDADE</div><div class="dfTmHelp">Carregando operadores da equipe...</div>';
    setMsg('','');
    try{
      const j=await apiPost('/op/team/members',{teamId:String(team.teamId||'')});
      const members=Array.isArray(j.members)?j.members:[];
      const operators=members.filter(m=>String(m.role||'')!=='owner');
      if(!operators.length){
        panel.innerHTML='<div class="dfTmTitle">TRANSFERIR PROPRIEDADE</div><div class="dfTmHelp">Não há outro operador nesta equipe para receber a propriedade.</div><button id="dfTmClosePanel" class="dfTmBtn dfTmCancel">FECHAR</button>';
        $('dfTmClosePanel').onclick=()=>panel.remove();
        return;
      }
      panel.innerHTML='<div class="dfTmTitle">ESCOLHA O NOVO DONO</div><div class="dfTmHelp">Após confirmar, você vira OPERADOR. Nenhuma OP, foto ou histórico será apagado.</div>'+operators.map((m,i)=>'<div class="dfTmMember"><div class="dfTmMemberInfo"><b>OPERADOR '+(i+1)+'</b><br>ID: '+esc(String(m.id||''))+(m.joinedAt?'<br>Entrou: '+esc(fmtDate(m.joinedAt)):'')+'</div><button class="dfTmChoose" data-member="'+esc(String(m.id||''))+'">👑 TORNAR DONO</button></div>').join('')+'<button id="dfTmClosePanel" class="dfTmBtn dfTmCancel">CANCELAR</button>';
      $('dfTmClosePanel').onclick=()=>panel.remove();
      panel.querySelectorAll('.dfTmChoose').forEach(btn=>btn.addEventListener('click',async()=>{
        const memberId=String(btn.getAttribute('data-member')||'');
        if(!memberId)return;
        if(!confirm('Transferir a propriedade desta equipe para este operador?\n\nVocê passará a ser OPERADOR e depois poderá sair da equipe.'))return;
        panel.querySelectorAll('button').forEach(b=>b.disabled=true);
        setMsg('Transferindo propriedade...','warn');
        try{
          const r=await apiPost('/op/team/transfer-owner',{teamId:String(team.teamId||''),memberId});
          const next={...team,role:'operator'};
          try{localStorage.setItem(TEAM_KEY,JSON.stringify(next))}catch(e){}
          setMsg(r.message||'Propriedade transferida.','ok');
          setTimeout(()=>location.reload(),900);
        }catch(e){
          panel.querySelectorAll('button').forEach(b=>b.disabled=false);
          setMsg(e.message||'Não foi possível transferir a propriedade.','err');
        }
      }));
    }catch(e){
      panel.innerHTML='<div class="dfTmTitle">TRANSFERIR PROPRIEDADE</div><div class="dfTmHelp">'+esc(e.message||'Não foi possível carregar os membros.')+'</div><button id="dfTmClosePanel" class="dfTmBtn dfTmCancel">FECHAR</button>';
      $('dfTmClosePanel').onclick=()=>panel.remove();
    }
  }

  async function leaveTeam(team,btn){
    if(!confirm('Sair desta equipe?\n\nSeu acesso à equipe será removido, mas OPs, fotos e histórico continuarão salvos.'))return;
    if(btn)btn.disabled=true;
    setMsg('Saindo da equipe...','warn');
    try{
      const r=await apiPost('/op/team/leave',{teamId:String(team.teamId||'')});
      try{localStorage.removeItem(TEAM_KEY)}catch(e){}
      setMsg(r.message||'Você saiu da equipe.','ok');
      setTimeout(()=>location.reload(),800);
    }catch(e){
      if(btn)btn.disabled=false;
      setMsg(e.message||'Não foi possível sair da equipe.','err');
    }
  }

  function inject(){
    ensureStyle();
    const box=$('dfOpTeamCloud');
    if(!box)return;
    const team=savedTeam();
    if(!team||!team.teamId){const old=$('dfTeamManageTest');if(old)old.remove();return}
    let host=$('dfTeamManageTest');
    if(host&&String(host.dataset.teamId||'')===String(team.teamId||'')&&String(host.dataset.role||'')===String(team.role||''))return;
    if(host)host.remove();
    host=document.createElement('div');
    host.id='dfTeamManageTest';
    host.dataset.teamId=String(team.teamId||'');
    host.dataset.role=String(team.role||'');
    if(String(team.role||'')==='owner'){
      host.innerHTML='<button id="dfTmTransfer" class="dfTmBtn dfTmTransfer">👑 TRANSFERIR PROPRIEDADE</button><div id="dfTeamManageMsg"></div>';
      box.appendChild(host);
      $('dfTmTransfer').onclick=()=>openTransferPanel(team);
    }else{
      host.innerHTML='<button id="dfTmLeave" class="dfTmBtn dfTmLeave">🚪 SAIR DA EQUIPE</button><div id="dfTeamManageMsg"></div>';
      box.appendChild(host);
      $('dfTmLeave').onclick=()=>leaveTeam(team,$('dfTmLeave'));
    }
  }

  let scheduled=false;
  function scheduleInject(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;inject()},30)}

  const obs=new MutationObserver(scheduleInject);
  function start(){
    scheduleInject();
    try{obs.observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
    window.addEventListener('df-team-changed',()=>setTimeout(inject,40));
    window.addEventListener('df-team-joined',()=>setTimeout(inject,40));
    window.addEventListener('storage',e=>{if(e.key===TEAM_KEY)setTimeout(inject,40)});
    setInterval(inject,1600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
