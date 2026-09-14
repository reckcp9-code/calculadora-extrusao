(function(){
  'use strict';
  if(window.DFOpTeamCodePwaV166)return;
  window.DFOpTeamCodePwaV166=true;

  const TEAM_KEY='df_op_team_v1';
  const CODE_KEY='df_op_team_join_code_v1';
  const $=id=>document.getElementById(id);
  let timer=0,observer=null;

  function digits(v){
    const s=String(v==null?'':v).replace(/\D/g,'');
    return s.length>=6&&s.length<=12?s:'';
  }
  function loadTeam(){
    try{
      if(window.DFOpCloud&&typeof window.DFOpCloud.team==='function'){
        const t=window.DFOpCloud.team();
        if(t)return t;
      }
    }catch(e){}
    try{return JSON.parse(localStorage.getItem(TEAM_KEY)||'null')}catch(e){return null}
  }
  function savedCode(){
    try{
      const local=digits(localStorage.getItem(CODE_KEY)||'');
      if(local)return local;
      const t=loadTeam();
      return digits(t&&(t.joinCode||t.join_code||t.code||t.inviteCode||t.invite_code));
    }catch(e){return ''}
  }
  function saveCode(v){
    const code=digits(v);
    if(!code)return '';
    try{localStorage.setItem(CODE_KEY,code)}catch(e){}
    try{
      const t=loadTeam();
      if(t&&String(t.role||'').toLowerCase()==='owner'){
        localStorage.setItem(TEAM_KEY,JSON.stringify(Object.assign({},t,{joinCode:code})));
      }
    }catch(e){}
    try{window.dispatchEvent(new CustomEvent('df-team-changed',{detail:{team:loadTeam()}}))}catch(e){}
    return code;
  }
  function bootstrapFromUrl(){
    try{
      const u=new URL(location.href),code=digits(u.searchParams.get('teamcode')||'');
      if(!code)return;
      const t=loadTeam();
      if(t&&String(t.role||'').toLowerCase()==='owner'){
        saveCode(code);
        u.searchParams.delete('teamcode');
        history.replaceState(null,'',u.pathname+(u.searchParams.toString()?'?'+u.searchParams.toString():'')+u.hash);
      }
    }catch(e){}
  }
  function style(){
    if($('dfTeamCodePwaStyle'))return;
    const s=document.createElement('style');
    s.id='dfTeamCodePwaStyle';
    s.textContent='#dfTeamCodePwaV166{margin-top:8px;border:1px dashed #22c55e;background:#0b2417;color:#86efac;border-radius:10px;padding:10px;font-size:13px;font-weight:900;line-height:1.35}#dfTeamCodePwaV166 .dfPwaCodeRow{display:grid;grid-template-columns:1fr;gap:7px;margin-top:8px}#dfTeamCodePwaV166 input{width:100%;box-sizing:border-box;border:1px solid #334155;background:#08111f;color:#fff;border-radius:10px;padding:11px;font-size:16px}#dfTeamCodePwaV166 button{width:100%;border:1px solid #2563eb;background:#10234a;color:#bfdbfe;border-radius:10px;padding:10px;font-size:11px;font-weight:900}#dfTeamCodePwaV166 small{display:block;color:#94a3b8;margin-top:7px;font-size:10px;font-weight:700;line-height:1.4}';
    document.head.appendChild(s);
  }
  async function copy(code,btn){
    try{await navigator.clipboard.writeText(code)}catch(e){prompt('Código da equipe:',code)}
    if(btn){btn.textContent='✅ COPIADO';setTimeout(()=>{if(btn.isConnected)btn.textContent='📋 COPIAR CÓDIGO'},1300)}
  }
  function hideOldHelpers(){
    for(const id of ['dfTeamCodeSafe','dfTeamCodeSafeActions','dfTeamCodeSafeNote','dfTeamJoinCodePersist','dfTeamCodeActionsPersist']){
      const e=$(id);if(e)e.style.display='none';
    }
  }
  function render(){
    bootstrapFromUrl();
    const t=loadTeam(),box=$('dfOpTeamCloud');
    if(!box||!t||String(t.role||'').toLowerCase()!=='owner')return false;
    style();hideOldHelpers();
    let panel=$('dfTeamCodePwaV166');
    if(!panel){
      panel=document.createElement('div');panel.id='dfTeamCodePwaV166';
      const teamLine=Array.from(box.querySelectorAll('.ctCode')).find(e=>/Equipe:/i.test(e.textContent||''));
      if(teamLine)teamLine.insertAdjacentElement('afterend',panel);else box.prepend(panel);
    }
    const code=savedCode();
    if(code){
      panel.innerHTML='<div>Código da equipe: <b>'+code+'</b></div><div class="dfPwaCodeRow"><button id="dfPwaCopyCode" type="button">📋 COPIAR CÓDIGO</button></div><small>Este código fica salvo neste app para conectar outros celulares.</small>';
      const b=$('dfPwaCopyCode');if(b)b.onclick=()=>copy(code,b);
    }else{
      panel.innerHTML='<div>Código da equipe não está salvo neste app.</div><div class="dfPwaCodeRow"><input id="dfPwaCodeInput" inputmode="numeric" maxlength="12" placeholder="Digite o código da equipe"><button id="dfPwaSaveCode" type="button">💾 SALVAR CÓDIGO DA EQUIPE</button></div><small>No app instalado, o armazenamento pode ser separado do Safari. Informe o código uma única vez aqui.</small>';
      const input=$('dfPwaCodeInput'),b=$('dfPwaSaveCode');
      if(b)b.onclick=()=>{
        const c=saveCode(input&&input.value);
        if(!c){alert('Digite um código válido da equipe.');if(input)input.focus();return}
        render();
      };
    }
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(render,80)}
  function attachObserver(){
    const box=$('dfOpTeamCloud');
    if(!box)return;
    if(observer&&observer.__box===box)return;
    if(observer)observer.disconnect();
    observer=new MutationObserver(()=>{
      const p=$('dfTeamCodePwaV166');
      if(!p||p.parentNode!==box)schedule();
    });
    observer.__box=box;observer.observe(box,{childList:true});
  }
  function run(){schedule();setTimeout(attachObserver,120)}
  function boot(){bootstrapFromUrl();run();window.addEventListener('df-ui-ready',run);window.addEventListener('df-team-changed',run);window.addEventListener('df-team-joined',run);window.addEventListener('pageshow',run);setTimeout(run,500);setTimeout(run,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
