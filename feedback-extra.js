(function(){
  'use strict';
  const DRAFT_KEY='df_feedback_draft_v1';
  const SUPPORT_PHONE='5547992825006';

  function $(id){return document.getElementById(id)}
  function esc(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

  function addStyle(){
    if($('dfFeedbackStyle'))return;
    const st=document.createElement('style');
    st.id='dfFeedbackStyle';
    st.textContent=[
      '.tabs.dfFeedbackTabs{grid-template-columns:repeat(6,1fr)!important}',
      '.dfFeedbackCard{border-color:#334155!important}',
      '.dfFeedbackStars{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0 4px}',
      '.dfFeedbackStar{border:1px solid #475569;background:#0f172a;color:#cbd5e1;border-radius:12px;padding:11px 5px;font-weight:900;font-size:15px;cursor:pointer}',
      '.dfFeedbackStar.on{border-color:#f59e0b;background:#241600;color:#ffd36a}',
      '.dfFeedbackText{width:100%;min-height:130px;resize:vertical;border:1px solid #334155;background:#0f172a;color:#fff;border-radius:12px;padding:13px 12px;font:inherit;line-height:1.4}',
      '.dfFeedbackStatus{margin-top:10px;font-size:12px;font-weight:800;color:#94a3b8;line-height:1.45}',
      '.dfFeedbackStatus.ok{color:#86efac}',
      '.dfFeedbackStatus.warn{color:#fbbf24}',
      '.dfFeedbackActions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}',
      '@media(max-width:560px){.tabs.dfFeedbackTabs{grid-template-columns:repeat(3,1fr)!important}.dfFeedbackActions{grid-template-columns:1fr}.dfFeedbackStars{gap:5px}.dfFeedbackStar{font-size:13px;padding:10px 2px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function pageHtml(){
    return '<section id="pgFb" class="page">'+
      '<div class="card dfFeedbackCard">'+
        '<span class="tag">Feedback</span>'+
        '<h2>💬 Enviar feedback</h2>'+
        '<div class="hint">Conte o que você achou do DF EXTRUSOR PRO, informe um erro ou mande uma sugestão de melhoria.</div>'+
        '<label>Tipo de feedback</label>'+
        '<select id="dfFeedbackType">'+
          '<option value="Sugestão">Sugestão</option>'+
          '<option value="Problema / erro">Problema / erro</option>'+
          '<option value="Melhoria">Melhoria</option>'+
          '<option value="Elogio">Elogio</option>'+
          '<option value="Outro">Outro</option>'+
        '</select>'+
        '<label>Sua nota para o app</label>'+
        '<div class="dfFeedbackStars" id="dfFeedbackStars">'+
          '<button type="button" class="dfFeedbackStar" data-score="1">⭐ 1</button>'+
          '<button type="button" class="dfFeedbackStar" data-score="2">⭐ 2</button>'+
          '<button type="button" class="dfFeedbackStar" data-score="3">⭐ 3</button>'+
          '<button type="button" class="dfFeedbackStar" data-score="4">⭐ 4</button>'+
          '<button type="button" class="dfFeedbackStar" data-score="5">⭐ 5</button>'+
        '</div>'+
        '<label>Nome (opcional)</label>'+
        '<input id="dfFeedbackName" placeholder="Seu nome ou empresa">'+
        '<label>Mensagem</label>'+
        '<textarea id="dfFeedbackText" class="dfFeedbackText" placeholder="Ex.: Gostaria que tivesse... / Encontrei um problema quando..."></textarea>'+
        '<div class="dfFeedbackActions">'+
          '<button id="dfFeedbackSend" class="calcBtn" type="button">ENVIAR FEEDBACK</button>'+
          '<button id="dfFeedbackClear" class="calcBtn alt" type="button">LIMPAR</button>'+
        '</div>'+
        '<div id="dfFeedbackStatus" class="dfFeedbackStatus">O feedback abre direto no WhatsApp da DF Manutenção e Consultoria.</div>'+
      '</div>'+
    '</section>';
  }

  function ensureUi(){
    addStyle();
    const tabs=document.querySelector('#appContent .tabs')||document.querySelector('.tabs');
    if(tabs){
      tabs.classList.add('dfFeedbackTabs');
      if(!$('btFb')){
        const b=document.createElement('button');
        b.id='btFb';
        b.className='tab';
        b.type='button';
        b.textContent='FEEDBACK';
        b.addEventListener('click',showFeedback);
        tabs.appendChild(b);
      }
    }
    const app=$('appContent');
    if(app&&!$('pgFb')){
      const foot=app.querySelector('.foot');
      if(foot)foot.insertAdjacentHTML('beforebegin',pageHtml());
      else app.insertAdjacentHTML('beforeend',pageHtml());
      bindPage();
      restoreDraft();
    }
  }

  function hideFeedback(){
    const pg=$('pgFb'),bt=$('btFb');
    if(pg)pg.classList.remove('on');
    if(bt)bt.classList.remove('on');
  }

  function showFeedback(){
    document.querySelectorAll('#appContent .page').forEach(p=>p.classList.remove('on'));
    document.querySelectorAll('#appContent .tab').forEach(b=>b.classList.remove('on'));
    const pg=$('pgFb'),bt=$('btFb');
    if(pg)pg.classList.add('on');
    if(bt)bt.classList.add('on');
    const title=$('heroTitle'),sub=$('heroSub');
    if(title)title.textContent='DF EXTRUSOR PRO';
    if(sub)sub.textContent='FEEDBACK • SUGESTÕES • MELHORIAS • SUPORTE';
    try{history.replaceState(null,'','./#feedback')}catch(e){}
    scrollTo(0,0);
  }

  let score=0;
  function setScore(v){
    score=Number(v)||0;
    document.querySelectorAll('.dfFeedbackStar').forEach(b=>b.classList.toggle('on',Number(b.dataset.score)<=score));
    saveDraft();
  }

  function saveDraft(){
    try{
      const data={
        type:$('dfFeedbackType')?.value||'Sugestão',
        score,
        name:$('dfFeedbackName')?.value||'',
        text:$('dfFeedbackText')?.value||''
      };
      localStorage.setItem(DRAFT_KEY,JSON.stringify(data));
    }catch(e){}
  }

  function restoreDraft(){
    try{
      const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'{}');
      if($('dfFeedbackType')&&d.type)$('dfFeedbackType').value=d.type;
      if($('dfFeedbackName'))$('dfFeedbackName').value=d.name||'';
      if($('dfFeedbackText'))$('dfFeedbackText').value=d.text||'';
      if(d.score)setScore(d.score);
    }catch(e){}
  }

  function clearDraft(){
    score=0;
    if($('dfFeedbackType'))$('dfFeedbackType').value='Sugestão';
    if($('dfFeedbackName'))$('dfFeedbackName').value='';
    if($('dfFeedbackText'))$('dfFeedbackText').value='';
    document.querySelectorAll('.dfFeedbackStar').forEach(b=>b.classList.remove('on'));
    try{localStorage.removeItem(DRAFT_KEY)}catch(e){}
    const st=$('dfFeedbackStatus');
    if(st){st.textContent='Campos limpos.';st.className='dfFeedbackStatus ok'}
  }

  function sendFeedback(){
    const type=$('dfFeedbackType')?.value||'Sugestão';
    const name=String($('dfFeedbackName')?.value||'').trim();
    const text=String($('dfFeedbackText')?.value||'').trim();
    const st=$('dfFeedbackStatus');
    if(!text){
      if(st){st.textContent='Digite sua mensagem antes de enviar.';st.className='dfFeedbackStatus warn'}
      $('dfFeedbackText')?.focus();
      return;
    }
    const lines=[
      '💬 *FEEDBACK — DF EXTRUSOR PRO*',
      '',
      '*Tipo:* '+type,
      '*Nota:* '+(score?score+' / 5':'Não informada'),
      name?'*Nome:* '+name:'',
      '',
      '*Mensagem:*',
      text,
      '',
      '*Versão:* '+(document.querySelector('.dfSystemVer')?.textContent||'DF EXTRUSOR PRO')
    ].filter(Boolean);
    const url='https://wa.me/'+SUPPORT_PHONE+'?text='+encodeURIComponent(lines.join('\n'));
    saveDraft();
    const w=window.open(url,'_blank','noopener');
    if(st){
      st.textContent=w?'WhatsApp aberto com o feedback pronto para enviar.':'O navegador bloqueou o WhatsApp. Libere pop-ups e tente novamente.';
      st.className='dfFeedbackStatus '+(w?'ok':'warn');
    }
  }

  function bindPage(){
    if($('dfFeedbackStars')&&!$('dfFeedbackStars').dataset.bound){
      $('dfFeedbackStars').dataset.bound='1';
      $('dfFeedbackStars').addEventListener('click',e=>{
        const b=e.target.closest('[data-score]');
        if(b)setScore(b.dataset.score);
      });
    }
    ['dfFeedbackType','dfFeedbackName','dfFeedbackText'].forEach(id=>{
      const el=$(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('input',saveDraft);el.addEventListener('change',saveDraft)}
    });
    const send=$('dfFeedbackSend');
    if(send&&!send.dataset.bound){send.dataset.bound='1';send.addEventListener('click',sendFeedback)}
    const clear=$('dfFeedbackClear');
    if(clear&&!clear.dataset.bound){clear.dataset.bound='1';clear.addEventListener('click',clearDraft)}
  }

  function wrapShow(){
    const original=window.show;
    if(typeof original!=='function'||original.dfFeedbackWrapped)return;
    function wrapped(p){hideFeedback();return original.apply(this,arguments)}
    wrapped.dfFeedbackWrapped=true;
    wrapped.dfFeedbackOriginal=original;
    window.show=wrapped;
  }

  function openFromHash(){
    if(location.hash==='#feedback')setTimeout(showFeedback,80);
  }

  function init(){
    ensureUi();
    wrapShow();
    openFromHash();
    setTimeout(()=>{ensureUi();wrapShow()},400);
    setTimeout(()=>{ensureUi();wrapShow()},1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
