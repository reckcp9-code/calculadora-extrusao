(function(){
  'use strict';
  if(window.DFOpTeamCodeSafeV164)return;
  window.DFOpTeamCodeSafeV164=true;

  const TEAM_KEY='df_op_team_v1';
  const CODE_KEY='df_op_team_join_code_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const $=id=>document.getElementById(id);
  let timer=0;

  function loadTeam(){
    try{
      if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){
        const t=window.DFOpCloud.team();
        if(t)return t;
      }
    }catch(e){}
    try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}
  }
  function digits(v){
    const s=String(v==null?'':v).replace(/\D/g,'');
    return s.length>=6&&s.length<=12?s:'';
  }
  function savedCode(){
    try{return digits(localStorage.getItem(CODE_KEY)||'')}catch(e){return ''}
  }
  function bootstrapCode(){
    try{
      const u=new URL(location.href),code=digits(u.searchParams.get('teamcode')||'');
      if(!code)return '';
      const t=loadTeam();
      if(!t||String(t.role||'').toLowerCase()!=='owner')return '';
      localStorage.setItem(CODE_KEY,code);
      u.searchParams.delete('teamcode');
      history.replaceState(null,'',u.pathname+(u.searchParams.toString()?'?'+u.searchParams.toString():'')+u.hash);
      return code;
    }catch(e){return ''}
  }
  function hasCloudSession(){
    try{
      if(String(sessionStorage.getItem(TOKEN_KEY)||'').trim())return true;
      if(String(localStorage.getItem(ACCESS_KEY)||'').trim())return true;
    }catch(e){}
    return false;
  }
  async function copy(code,btn){
    try{await navigator.clipboard.writeText(code)}catch(e){prompt('Código da equipe:',code)}
    if(btn){btn.textContent='✅ COPIADO';setTimeout(()=>{if(btn.isConnected)btn.textContent='📋 COPIAR CÓDIGO'},1300)}
  }
  function style(){
    if($('dfTeamCodeSafeStyle'))return;
    const s=document.createElement('style');s.id='dfTeamCodeSafeStyle';
    s.textContent='#dfTeamCodeSafe{margin-top:8px;border:1px dashed #22c55e;background:#0b2417;color:#86efac;border-radius:10px;padding:10px;font-size:13px;font-weight:900;word-break:break-all}#dfTeamCodeSafeActions{display:grid;grid-template-columns:1fr;gap:7px;margin-top:8px}#dfTeamCodeSafeActions button{border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:11px;font-weight:900}#dfTeamCodeSafeNote{margin-top:7px;color:#94a3b8;font-size:10px;line-height:1.4}';
    document.head.appendChild(s);
  }
  function patch(){
    bootstrapCode();
    const t=loadTeam(),box=$('dfOpTeamCloud');
    if(!box||!t||String(t.role||'').toLowerCase()!=='owner')return false;
    style();
    const code=savedCode();
    let line=$('dfTeamCodeSafe');
    if(!line){
      line=document.createElement('div');line.id='dfTeamCodeSafe';
      const teamLine=Array.from(box.querySelectorAll('.ctCode')).find(e=>/Equipe:/i.test(e.textContent||''));
      if(teamLine)teamLine.insertAdjacentElement('afterend',line);else box.prepend(line);
    }
    line.innerHTML=code?'Código da equipe para conectar outro celular: <b>'+code+'</b>':'Código da equipe não está salvo neste navegador.';
    let actions=$('dfTeamCodeSafeActions');
    if(!actions){actions=document.createElement('div');actions.id='dfTeamCodeSafeActions';line.insertAdjacentElement('afterend',actions)}
    actions.innerHTML=code?'<button id="dfTeamCodeSafeCopy" type="button">📋 COPIAR CÓDIGO</button>':'';
    const copyBtn=$('dfTeamCodeSafeCopy');if(copyBtn)copyBtn.onclick=()=>copy(code,copyBtn);

    let note=$('dfTeamCodeSafeNote');
    if(!note){note=document.createElement('div');note.id='dfTeamCodeSafeNote';actions.insertAdjacentElement('afterend',note)}
    if(hasCloudSession()){
      note.textContent='✅ Sessão da nuvem disponível.';
      const r=$('dfCloudRefresh');if(r){r.disabled=false;r.style.opacity='';r.title='';}
    }else{
      note.textContent='⚠️ Este acesso pelo navegador está sem a sessão automática da nuvem. O código continua disponível e a tela não fica presa tentando recuperar acesso.';
      const r=$('dfCloudRefresh');if(r){r.disabled=true;r.style.opacity='.55';r.title='Abra pelo acesso do app para sincronizar a nuvem.'}
      const admin=$('dfTeamAdminV97');if(admin)admin.style.display='none';
      const runtime=$('dfCloudRuntimeMsg');if(runtime&&/Não consegui|aguardando|atualizar/i.test(runtime.textContent||''))runtime.textContent='⚠️ Sincronização pausada neste acesso pelo navegador.';
    }
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(patch,80)}
  function boot(){bootstrapCode();schedule();const mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('df-ui-ready',schedule);window.addEventListener('df-team-changed',schedule);window.addEventListener('df-team-joined',schedule);window.addEventListener('pageshow',schedule);setTimeout(schedule,500);setTimeout(schedule,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
