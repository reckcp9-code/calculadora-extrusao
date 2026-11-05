(function(){
  'use strict';

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TEAM_KEY='df_op_team_v1';
  const OWNER_SEEN_KEY='df_op_team_members_seen_v1';
  const JOIN_ACK_KEY='df_op_team_join_ack_v1';
  let polling=false;

  const $=id=>document.getElementById(id);
  const loadJson=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'')||f}catch(e){return f}};
  const saveJson=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};

  function teamNow(){
    try{
      if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){
        const t=window.DFOpCloud.team();
        if(t&&t.teamId)return t;
      }
    }catch(e){}
    return loadJson(TEAM_KEY,null);
  }

  function deviceId(){
    try{
      if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){
        const id=String(window.DFDeviceIdentity.get()||'').trim();
        if(id)return id;
      }
    }catch(e){}
    return String(localStorage.getItem(DEVICE_KEY)||'').trim();
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
    let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();
    const p=tokenPayload(token);
    if(token&&!force&&p&&p.owner)return token;
    const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim();
    const dev=deviceId();
    if(!credential||!dev)throw new Error('acesso automático indisponível');
    const r=await fetch(API+'/access/session',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-DF-Device':dev},
      body:JSON.stringify({credential,deviceId:dev}),
      cache:'no-store'
    });
    let j={}; try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');
    token=String(j.token||'').trim();
    if(!token)throw new Error('sessão vazia');
    sessionStorage.setItem(TOKEN_KEY,token);
    return token;
  }

  async function apiPost(path,body,retry){
    const token=await renewSession(false),dev=deviceId();
    const r=await fetch(API+path,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},
      body:JSON.stringify(body||{}),
      cache:'no-store'
    });
    let j={}; try{j=await r.json()}catch(e){}
    if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){
      await renewSession(true);
      return apiPost(path,body,false);
    }
    if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));
    return j;
  }

  function ensureStyle(){
    if($('dfTeamNotifyStyle'))return;
    const s=document.createElement('style');
    s.id='dfTeamNotifyStyle';
    s.textContent=`
      #dfTeamToastWrap{position:fixed;z-index:2147483646;top:max(14px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);width:min(92vw,430px);pointer-events:none}
      .dfTeamToast{pointer-events:auto;background:#07111f;border:1px solid #22c55e;box-shadow:0 16px 40px #000a;border-radius:15px;padding:13px 14px;color:#f8fafc;margin-bottom:8px;animation:dfTeamIn .2s ease-out}
      .dfTeamToast b{display:block;color:#86efac;font-size:14px;margin-bottom:4px}.dfTeamToast span{display:block;color:#cbd5e1;font-size:12px;line-height:1.45}
      #dfTeamMembersStatus{margin-top:8px;border:1px solid #334155;background:#0a1628;border-radius:10px;padding:9px 10px;color:#cbd5e1;font-size:11px;line-height:1.45}
      #dfTeamMembersStatus b{color:#86efac}
      @keyframes dfTeamIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(s);
  }

  function showToast(title,message,ms){
    ensureStyle();
    let wrap=$('dfTeamToastWrap');
    if(!wrap){wrap=document.createElement('div');wrap.id='dfTeamToastWrap';document.body.appendChild(wrap)}
    const t=document.createElement('div');
    t.className='dfTeamToast';
    const b=document.createElement('b'); b.textContent=title;
    const sp=document.createElement('span'); sp.textContent=message;
    t.appendChild(b);t.appendChild(sp);wrap.appendChild(t);
    try{if(navigator.vibrate)navigator.vibrate([80,45,80])}catch(e){}
    setTimeout(()=>{try{t.remove()}catch(e){}},ms||6500);
  }

  function relativeTime(iso){
    const ts=Date.parse(String(iso||''));
    if(!Number.isFinite(ts))return '';
    const sec=Math.max(0,Math.floor((Date.now()-ts)/1000));
    if(sec<60)return 'agora';
    const min=Math.floor(sec/60); if(min<60)return 'há '+min+' min';
    const h=Math.floor(min/60); if(h<24)return 'há '+h+' h';
    const d=Math.floor(h/24); return 'há '+d+' dia'+(d===1?'':'s');
  }

  function renderOwnerStatus(data){
    const team=teamNow();
    if(!team||team.role!=='owner')return;
    const box=$('dfOpTeamCloud');
    if(!box)return;
    let st=$('dfTeamMembersStatus');
    if(!st){st=document.createElement('div');st.id='dfTeamMembersStatus';box.appendChild(st)}
    const total=Number(data.memberCount||0);
    const operators=Math.max(0,total-1);
    const members=Array.isArray(data.members)?data.members:[];
    const last=members.filter(m=>m.role!=='owner').sort((a,b)=>String(b.lastActivity||'').localeCompare(String(a.lastActivity||'')))[0];
    const when=last?relativeTime(last.lastActivity||last.joinedAt):'';
    st.innerHTML='<b>👥 '+total+' acesso'+(total===1?'':'s')+' conectado'+(total===1?'':'s')+'</b> • '+operators+' operador'+(operators===1?'':'es')+(when?' • última atividade '+when:'');
  }

  function operatorJoinAck(){
    const t=teamNow();
    if(!t||t.role!=='operator'||!t.teamId)return;
    const ack=String(localStorage.getItem(JOIN_ACK_KEY)||'');
    if(ack===String(t.teamId))return;
    try{localStorage.setItem(JOIN_ACK_KEY,String(t.teamId))}catch(e){}
    showToast('✅ VOCÊ ENTROU NA EQUIPE','Equipe '+String(t.name||'DF EXTRUSOR')+' conectada. As fotos das OPs salvas serão compartilhadas com o responsável.',8000);
  }

  async function pollMembers(){
    if(polling||navigator.onLine===false)return;
    const t=teamNow();
    if(!t||!t.teamId)return;
    polling=true;
    try{
      const j=await apiPost('/op/team/members',{teamId:t.teamId});
      if(t.role==='owner'){
        renderOwnerStatus(j);
        const members=(Array.isArray(j.members)?j.members:[]).filter(m=>m&&m.role!=='owner'&&m.id);
        const state=loadJson(OWNER_SEEN_KEY,{teamId:'',ids:[]});
        const same=String(state.teamId||'')===String(t.teamId);
        const seen=new Set(same&&Array.isArray(state.ids)?state.ids:[]);
        const fresh=members.filter(m=>!seen.has(String(m.id)));
        if(fresh.length){
          const total=Number(j.memberCount||members.length+1);
          showToast('🔔 NOVO OPERADOR CONECTADO',fresh.length===1?'Um operador entrou na sua equipe. Total conectado: '+total+'.':fresh.length+' operadores entraram na sua equipe. Total conectado: '+total+'.',8500);
        }
        saveJson(OWNER_SEEN_KEY,{teamId:String(t.teamId),ids:members.map(m=>String(m.id)),updatedAt:new Date().toISOString()});
      }
    }catch(e){
      // Mantém silencioso para não atrapalhar o uso caso o servidor esteja temporariamente offline.
    }finally{polling=false}
  }

  function boot(){
    ensureStyle();
    setTimeout(()=>{operatorJoinAck();pollMembers()},1400);
    setInterval(operatorJoinAck,1200);
    setInterval(pollMembers,12000);
    window.addEventListener('online',()=>{setTimeout(()=>{operatorJoinAck();pollMembers()},400)});
    window.addEventListener('df-ui-ready',()=>setTimeout(()=>{operatorJoinAck();pollMembers()},500));
    document.addEventListener('click',e=>{
      if(e.target&&e.target.closest&&e.target.closest('#dfCloudJoin'))setTimeout(()=>{operatorJoinAck();pollMembers()},1600);
      if(e.target&&e.target.closest&&e.target.closest('#dfCloudRefresh'))setTimeout(pollMembers,250);
    },true);
  }

  window.DFOpTeamNotify={refresh:pollMembers};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
