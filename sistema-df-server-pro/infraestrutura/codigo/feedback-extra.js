(function(){
  'use strict';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const DRAFT_KEY='df_feedback_draft_v1';
  const POSTS_KEY='df_feedback_posts_v1';
  const OWNER_KEY='df_feedback_owner_v1';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const SUPPORT_PHONE='5547992825006';
  const MAX_POSTS=100;

  function $(id){return document.getElementById(id)}
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
  function fmtDate(v){try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return''}}
  function ownerKey(){
    let k='';try{k=localStorage.getItem(OWNER_KEY)||''}catch(e){}
    if(!k){k=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));try{localStorage.setItem(OWNER_KEY,k)}catch(e){}}
    return k;
  }
  function deviceId(){try{return localStorage.getItem(DEVICE_KEY)||''}catch(e){return''}}
  function token(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch(e){return''}}

  async function cloud(path,body){
    const headers={'Content-Type':'application/json','X-DF-Device':deviceId()};
    const tk=token();if(tk)headers.Authorization='Bearer '+tk;
    const r=await fetch(API+path,{method:'POST',headers,body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||('Erro HTTP '+r.status));
    return j;
  }

  function addStyle(){
    if($('dfFeedbackStyle'))return;
    const st=document.createElement('style');st.id='dfFeedbackStyle';
    st.textContent=[
      '.tabs.dfFeedbackTabs{grid-template-columns:repeat(6,1fr)!important}',
      '.dfFeedbackCard{border-color:#334155!important}',
      '.dfFeedbackStars{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0 4px}',
      '.dfFeedbackStar{border:1px solid #475569;background:#0f172a;color:#cbd5e1;border-radius:12px;padding:11px 5px;font-weight:900;font-size:15px;cursor:pointer}',
      '.dfFeedbackStar.on{border-color:#f59e0b;background:#241600;color:#ffd36a}',
      '.dfFeedbackText{width:100%;min-height:130px;resize:vertical;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:13px 12px;font:inherit;line-height:1.4}',
      '.dfFeedbackStatus{margin-top:10px;font-size:12px;font-weight:800;color:#94a3b8;line-height:1.45}.dfFeedbackStatus.ok{color:#86efac}.dfFeedbackStatus.warn{color:#fbbf24}',
      '.dfFeedbackActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}',
      '.dfFeedbackWall{margin-top:14px}.dfFeedbackWallHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.dfFeedbackWallHead h2{margin:0}',
      '.dfFeedbackEmpty{border:1px dashed #334155;background:#0f172a;border-radius:14px;padding:18px;text-align:center;color:#94a3b8;font-size:13px}',
      '.dfFeedbackPost{border:1px solid #334155;background:#0f172a;border-radius:15px;padding:13px;margin-top:10px}.dfFeedbackPost.pending{border-color:#92400e}',
      '.dfFeedbackPostTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.dfFeedbackPostName{font-weight:900;color:#f8fafc}.dfFeedbackPostMeta{font-size:11px;color:#94a3b8;margin-top:3px;line-height:1.35}',
      '.dfFeedbackPostType{display:inline-block;border:1px solid #475569;border-radius:999px;padding:4px 7px;color:#cbd5e1;font-size:10px;font-weight:900;margin-top:7px}.dfFeedbackPending{display:inline-block;margin-left:5px;border:1px solid #92400e;border-radius:999px;padding:4px 7px;color:#fbbf24;font-size:10px;font-weight:900}',
      '.dfFeedbackPostText{white-space:pre-wrap;word-break:break-word;color:#e2e8f0;line-height:1.45;margin-top:10px}.dfFeedbackPostDelete{border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:9px;padding:6px 8px;font-size:10px;font-weight:900;cursor:pointer;flex:0 0 auto}',
      '.dfFeedbackWallNote{font-size:11px;color:#64748b;line-height:1.45;margin-top:8px}',
      '@media(max-width:560px){.tabs.dfFeedbackTabs{grid-template-columns:repeat(3,1fr)!important}.dfFeedbackActions{grid-template-columns:1fr}.dfFeedbackStars{gap:5px}.dfFeedbackStar{font-size:13px;padding:10px 2px}.dfFeedbackPostTop{gap:6px}}'
    ].join('');document.head.appendChild(st);
  }

  function pageHtml(){return '<section id="pgFb" class="page">'+
    '<div class="card dfFeedbackCard"><span class="tag">Feedback</span><h2>💬 Enviar feedback</h2><div class="hint">Seu comentário pode ficar visível para todos os usuários do DF EXTRUSOR PRO.</div>'+ 
    '<label>Tipo de feedback</label><select id="dfFeedbackType"><option value="Sugestão">Sugestão</option><option value="Problema / erro">Problema / erro</option><option value="Melhoria">Melhoria</option><option value="Elogio">Elogio</option><option value="Outro">Outro</option></select>'+ 
    '<label>Sua nota para o app</label><div class="dfFeedbackStars" id="dfFeedbackStars"><button type="button" class="dfFeedbackStar" data-score="1">⭐ 1</button><button type="button" class="dfFeedbackStar" data-score="2">⭐ 2</button><button type="button" class="dfFeedbackStar" data-score="3">⭐ 3</button><button type="button" class="dfFeedbackStar" data-score="4">⭐ 4</button><button type="button" class="dfFeedbackStar" data-score="5">⭐ 5</button></div>'+ 
    '<label>Nome (opcional)</label><input id="dfFeedbackName" maxlength="60" placeholder="Seu nome ou empresa"><label>Mensagem</label><textarea id="dfFeedbackText" maxlength="1000" class="dfFeedbackText" placeholder="Ex.: Gostaria que tivesse... / Encontrei um problema quando..."></textarea>'+ 
    '<div class="dfFeedbackActions"><button id="dfFeedbackSend" class="calcBtn" type="button">PUBLICAR PARA TODOS</button><button id="dfFeedbackClear" class="calcBtn alt" type="button">LIMPAR</button></div><div id="dfFeedbackStatus" class="dfFeedbackStatus">Se a internet estiver indisponível, o comentário fica pendente neste aparelho e tenta sincronizar depois.</div></div>'+ 
    '<div class="card dfFeedbackCard dfFeedbackWall"><div class="dfFeedbackWallHead"><h2>🗣 Comentários da comunidade</h2><span class="tag" id="dfFeedbackCount">0</span></div><div id="dfFeedbackPosts"></div><div class="dfFeedbackWallNote" id="dfFeedbackWallNote">Carregando mural compartilhado...</div></div></section>'}

  function loadPosts(){try{const a=JSON.parse(localStorage.getItem(POSTS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function savePosts(a){try{localStorage.setItem(POSTS_KEY,JSON.stringify((a||[]).slice(0,MAX_POSTS)))}catch(e){}}
  function stars(v){const n=Math.max(0,Math.min(5,Number(v)||0));return n?'⭐'.repeat(n):'Sem nota'}
  function renderPosts(){
    const box=$('dfFeedbackPosts');if(!box)return;const posts=loadPosts();const count=$('dfFeedbackCount');if(count)count.textContent=String(posts.length);
    if(!posts.length){box.innerHTML='<div class="dfFeedbackEmpty">Ainda não há comentários publicados.</div>';return}
    box.innerHTML=posts.map(p=>'<div class="dfFeedbackPost '+(p.pending?'pending':'')+'"><div class="dfFeedbackPostTop"><div><div class="dfFeedbackPostName">'+esc(p.name||'Anônimo')+'</div><div class="dfFeedbackPostMeta">'+esc(fmtDate(p.createdAt))+' • '+esc(stars(p.score))+'</div><span class="dfFeedbackPostType">'+esc(p.type||'Feedback')+'</span>'+(p.pending?'<span class="dfFeedbackPending">AGUARDANDO NUVEM</span>':'')+'</div>'+((p.canDelete||p.pending)?'<button class="dfFeedbackPostDelete" type="button" data-feedback-delete="'+esc(p.id)+'">EXCLUIR</button>':'')+'</div><div class="dfFeedbackPostText">'+esc(p.text||'')+'</div></div>').join('');
  }

  async function loadCloudPosts(showStatus=true){
    if(!navigator.onLine){if(showStatus)setWall('OFFLINE — mostrando a última cópia salva neste aparelho.','warn');renderPosts();return false}
    try{
      const j=await cloud('/feedback/list',{ownerKey:ownerKey()});
      const posts=Array.isArray(j.posts)?j.posts:Array.isArray(j.items)?j.items:[];
      const pending=loadPosts().filter(p=>p.pending);
      const ids=new Set(posts.map(p=>String(p.id)));
      savePosts([...pending.filter(p=>!ids.has(String(p.id))),...posts].slice(0,MAX_POSTS));renderPosts();
      if(showStatus)setWall('Mural sincronizado com a nuvem. Estes comentários aparecem para todos os usuários licenciados.','ok');
      return true;
    }catch(e){if(showStatus)setWall('A nuvem do Feedback ainda não está conectada. Mostrando os comentários salvos neste aparelho.','warn');renderPosts();return false}
  }

  function setWall(text,kind=''){const e=$('dfFeedbackWallNote');if(e){e.textContent=text;e.style.color=kind==='ok'?'#86efac':kind==='warn'?'#fbbf24':'#64748b'}}
  function localPending(data){const posts=loadPosts();const id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);posts.unshift({id,createdAt:new Date().toISOString(),type:data.type,score:data.score,name:data.name,text:data.text,pending:true,canDelete:true});savePosts(posts);renderPosts();return id}

  async function publish(data){
    const localId=localPending(data);
    if(!navigator.onLine)return {cloud:false,localId};
    try{
      await cloud('/feedback/create',{ownerKey:ownerKey(),type:data.type,score:data.score,name:data.name,text:data.text});
      savePosts(loadPosts().filter(p=>String(p.id)!==String(localId)));
      await loadCloudPosts(false);return {cloud:true};
    }catch(e){return {cloud:false,localId,error:e}}
  }

  async function syncPending(){
    if(!navigator.onLine)return;
    const pending=loadPosts().filter(p=>p.pending);if(!pending.length){await loadCloudPosts(false);return}
    let changed=false;
    for(const p of pending){try{await cloud('/feedback/create',{ownerKey:ownerKey(),type:p.type,score:p.score,name:p.name,text:p.text});savePosts(loadPosts().filter(x=>String(x.id)!==String(p.id)));changed=true}catch(e){break}}
    if(changed)await loadCloudPosts(false);
  }

  async function deletePost(id){
    const p=loadPosts().find(x=>String(x.id)===String(id));if(!p)return;
    if(p.pending){savePosts(loadPosts().filter(x=>String(x.id)!==String(id)));renderPosts();return}
    try{await cloud('/feedback/delete',{ownerKey:ownerKey(),id});await loadCloudPosts(false);setWall('Comentário excluído da nuvem.','ok')}
    catch(e){setWall('Não foi possível excluir. Somente quem publicou pode excluir o próprio comentário.','warn')}
  }

  function ensureUi(){
    addStyle();const tabs=document.querySelector('#appContent .tabs')||document.querySelector('.tabs');
    if(tabs){tabs.classList.add('dfFeedbackTabs');if(!$('btFb')){const b=document.createElement('button');b.id='btFb';b.className='tab';b.type='button';b.textContent='FEEDBACK';b.addEventListener('click',showFeedback);tabs.appendChild(b)}}
    const app=$('appContent');if(app&&!$('pgFb')){const foot=app.querySelector('.foot');if(foot)foot.insertAdjacentHTML('beforebegin',pageHtml());else app.insertAdjacentHTML('beforeend',pageHtml());bindPage();restoreDraft();renderPosts();loadCloudPosts()}
  }
  function hideFeedback(){const pg=$('pgFb'),bt=$('btFb');if(pg)pg.classList.remove('on');if(bt)bt.classList.remove('on')}
  function showFeedback(){document.querySelectorAll('#appContent .page').forEach(p=>p.classList.remove('on'));document.querySelectorAll('#appContent .tab').forEach(b=>b.classList.remove('on'));const pg=$('pgFb'),bt=$('btFb');if(pg)pg.classList.add('on');if(bt)bt.classList.add('on');if($('heroTitle'))$('heroTitle').textContent='DF EXTRUSOR PRO';if($('heroSub'))$('heroSub').textContent='FEEDBACK • COMENTÁRIOS PÚBLICOS • SUGESTÕES • MELHORIAS';try{history.replaceState(null,'','./#feedback')}catch(e){}renderPosts();loadCloudPosts();scrollTo(0,0)}

  let score=0;
  function setScore(v){score=Number(v)||0;document.querySelectorAll('.dfFeedbackStar').forEach(b=>b.classList.toggle('on',Number(b.dataset.score)<=score));saveDraft()}
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify({type:$('dfFeedbackType')?.value||'Sugestão',score,name:$('dfFeedbackName')?.value||'',text:$('dfFeedbackText')?.value||''}))}catch(e){}}
  function restoreDraft(){try{const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');if($('dfFeedbackType')&&d.type)$('dfFeedbackType').value=d.type;if($('dfFeedbackName'))$('dfFeedbackName').value=d.name||'';if($('dfFeedbackText'))$('dfFeedbackText').value=d.text||'';if(d.score)setScore(d.score)}catch(e){}}
  function clearDraft(message='Campos limpos.'){score=0;if($('dfFeedbackType'))$('dfFeedbackType').value='Sugestão';if($('dfFeedbackName'))$('dfFeedbackName').value='';if($('dfFeedbackText'))$('dfFeedbackText').value='';document.querySelectorAll('.dfFeedbackStar').forEach(b=>b.classList.remove('on'));try{localStorage.removeItem(DRAFT_KEY)}catch(e){}const st=$('dfFeedbackStatus');if(st){st.textContent=message;st.className='dfFeedbackStatus ok'}}

  async function sendFeedback(){
    const type=$('dfFeedbackType')?.value||'Sugestão',name=String($('dfFeedbackName')?.value||'').trim(),text=String($('dfFeedbackText')?.value||'').trim(),st=$('dfFeedbackStatus');
    if(!text){if(st){st.textContent='Digite sua mensagem antes de publicar.';st.className='dfFeedbackStatus warn'}$('dfFeedbackText')?.focus();return}
    if(st){st.textContent='Publicando comentário...';st.className='dfFeedbackStatus'}
    const result=await publish({type,score,name,text});
    const lines=['💬 *FEEDBACK — DF EXTRUSOR PRO*','','*Tipo:* '+type,'*Nota:* '+(score?score+' / 5':'Não informada'),name?'*Nome:* '+name:'','','*Mensagem:*',text,'','*Versão:* '+(document.querySelector('.dfSystemVer')?.textContent||'DF EXTRUSOR PRO')].filter(Boolean);
    const w=window.open('https://wa.me/'+SUPPORT_PHONE+'?text='+encodeURIComponent(lines.join('\n')),'_blank','noopener');
    clearDraft(result.cloud?'Comentário publicado para todos na nuvem. '+(w?'WhatsApp aberto.':''):'Comentário salvo como pendente. Assim que a nuvem estiver conectada ele será sincronizado.');
    if(st&&!result.cloud)st.className='dfFeedbackStatus warn';
    setWall(result.cloud?'Mural sincronizado com a nuvem.':'Aguardando conexão do banco de Feedback no Worker.',result.cloud?'ok':'warn');
  }

  function bindPage(){
    if($('dfFeedbackStars')&&!$('dfFeedbackStars').dataset.bound){$('dfFeedbackStars').dataset.bound='1';$('dfFeedbackStars').addEventListener('click',e=>{const b=e.target.closest('[data-score]');if(b)setScore(b.dataset.score)})}
    ['dfFeedbackType','dfFeedbackName','dfFeedbackText'].forEach(id=>{const el=$(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('input',saveDraft);el.addEventListener('change',saveDraft)}});
    const send=$('dfFeedbackSend');if(send&&!send.dataset.bound){send.dataset.bound='1';send.addEventListener('click',sendFeedback)}
    const clear=$('dfFeedbackClear');if(clear&&!clear.dataset.bound){clear.dataset.bound='1';clear.addEventListener('click',()=>clearDraft())}
    const posts=$('dfFeedbackPosts');if(posts&&!posts.dataset.bound){posts.dataset.bound='1';posts.addEventListener('click',e=>{const b=e.target.closest('[data-feedback-delete]');if(!b)return;if(confirm('Excluir este comentário?'))deletePost(b.dataset.feedbackDelete)})}
  }
  function wrapShow(){const original=window.show;if(typeof original!=='function'||original.dfFeedbackWrapped)return;function wrapped(p){hideFeedback();return original.apply(this,arguments)}wrapped.dfFeedbackWrapped=true;wrapped.dfFeedbackOriginal=original;window.show=wrapped}
  function openFromHash(){if(location.hash==='#feedback')setTimeout(showFeedback,80)}
  function init(){ensureUi();wrapShow();openFromHash();setTimeout(()=>{ensureUi();wrapShow();renderPosts();syncPending()},500);setTimeout(()=>{ensureUi();wrapShow();renderPosts();syncPending()},1500)}
  window.addEventListener('online',()=>{syncPending();loadCloudPosts()});
  window.dfRenderFeedbackPosts=renderPosts;window.dfSyncFeedback=syncPending;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
