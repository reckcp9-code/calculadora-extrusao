(function(){
  'use strict';

  const WHATSAPP='5547992825006';
  const $=id=>document.getElementById(id);

  function addStyle(){
    if($('dfHomeContactFeedbackStyle'))return;
    const s=document.createElement('style');
    s.id='dfHomeContactFeedbackStyle';
    s.textContent=`
      #dfFavBtn.dfWhatsAppHomeBtn{
        border-color:#16a34a!important;
        background:#0b2517!important;
        color:#86efac!important;
        white-space:normal!important;
        line-height:1.18!important;
      }
      #dfFavBtn.dfWhatsAppHomeBtn .dfWaTitle{display:block;font-weight:950;font-size:11px}
      #dfFavBtn.dfWhatsAppHomeBtn .dfWaNumber{display:block;margin-top:3px;font-weight:800;font-size:9.5px;color:#bbf7d0}

      #dfInlineFeedback{
        grid-column:1/-1!important;
        display:none;
        margin-top:3px;
        padding:15px;
        border:1px solid #334155;
        border-radius:16px;
        background:linear-gradient(180deg,#0e1928,#0a111d);
        box-shadow:0 16px 36px rgba(0,0,0,.28);
        text-align:left;
      }
      #dfInlineFeedback.open{display:block!important}
      #dfInlineFeedback .dfInlineFeedbackHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      #dfInlineFeedback .dfInlineFeedbackTitle{font-size:20px;font-weight:950;color:#fff;line-height:1.1}
      #dfInlineFeedback .dfInlineFeedbackSub{margin-top:5px;color:#94a3b8;font-size:12px;line-height:1.4}
      #dfInlineFeedbackClose{flex:0 0 auto;width:36px;height:36px;border:1px solid #334155;border-radius:10px;background:#111827;color:#e5eef8;font-size:19px;font-weight:900}
      #dfInlineFeedbackBody>.card{margin:0 0 12px!important}
      #dfInlineFeedbackBody>.card:last-child{margin-bottom:0!important}
      @media(max-width:560px){#dfInlineFeedback{padding:13px 11px}}
    `;
    document.head.appendChild(s);
  }

  function openWhatsApp(e){
    if(e){e.preventDefault();e.stopImmediatePropagation();}
    const url='https://wa.me/'+WHATSAPP;
    try{
      const w=window.open(url,'_blank','noopener,noreferrer');
      if(!w)location.href=url;
    }catch(err){location.href=url}
  }

  function setupWhatsApp(){
    const b=$('dfFavBtn');
    if(!b)return;
    if(!b.dataset.dfWhatsAppBound){
      b.dataset.dfWhatsAppBound='1';
      b.addEventListener('click',openWhatsApp,true);
    }
    b.classList.add('dfWhatsAppHomeBtn');
    b.setAttribute('aria-label','Abrir WhatsApp da DF Manutenção e Consultoria');
    b.innerHTML='<span class="dfWaTitle">📱 WHATSAPP</span><span class="dfWaNumber">47 99282-5006</span>';
  }

  function closeHelp(){
    const p=$('dfInlineHelp');
    if(p){p.classList.remove('open');p.setAttribute('aria-hidden','true')}
    const b=$('btAj');
    if(b)b.classList.remove('on');
    try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
  }

  function ensureFeedbackPanel(){
    const quick=$('dfQuickAccess');
    const page=$('pgFb');
    if(!quick||!page)return null;

    let panel=$('dfInlineFeedback');
    if(!panel){
      panel=document.createElement('div');
      panel.id='dfInlineFeedback';
      panel.setAttribute('aria-hidden','true');
      panel.innerHTML='<div class="dfInlineFeedbackHead"><div><div class="dfInlineFeedbackTitle">💬 Feedback</div><div class="dfInlineFeedbackSub">Envie sugestão, melhoria ou problema sem sair da tela principal.</div></div><button type="button" id="dfInlineFeedbackClose" aria-label="Fechar feedback">×</button></div><div id="dfInlineFeedbackBody"></div>';
      quick.appendChild(panel);
      $('dfInlineFeedbackClose')?.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();closeFeedback()});
    }else if(panel.parentElement!==quick){
      quick.appendChild(panel);
    }

    const body=$('dfInlineFeedbackBody');
    if(body){
      Array.from(page.children).forEach(function(el){
        if(el.classList&&el.classList.contains('card'))body.appendChild(el);
      });
    }
    return panel;
  }

  function openFeedback(){
    const panel=ensureFeedbackPanel();
    if(!panel)return;
    closeHelp();
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    const b=$('btFb');
    if(b)b.classList.add('on');
    requestAnimationFrame(function(){
      try{panel.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){panel.scrollIntoView()}
    });
  }

  function closeFeedback(){
    const panel=$('dfInlineFeedback');
    if(panel){panel.classList.remove('open');panel.setAttribute('aria-hidden','true')}
    const b=$('btFb');
    if(b)b.classList.remove('on');
  }

  function setupFeedbackButton(){
    const b=$('btFb');
    if(!b)return;
    if(!b.dataset.dfInlineFeedbackBound){
      b.dataset.dfInlineFeedbackBound='1';
      b.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        const panel=ensureFeedbackPanel();
        if(panel&&panel.classList.contains('open'))closeFeedback();
        else openFeedback();
      },true);
    }
  }

  function sync(){
    addStyle();
    setupWhatsApp();
    ensureFeedbackPanel();
    setupFeedbackButton();
  }

  function init(){
    sync();
    requestAnimationFrame(sync);
    setTimeout(sync,120);
    setTimeout(sync,500);
    setTimeout(sync,1200);

    document.addEventListener('click',function(e){
      const help=e.target.closest&&e.target.closest('#btAj');
      if(help)closeFeedback();
    },true);
    window.addEventListener('df-ui-ready',function(){setTimeout(sync,80)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(sync,80)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
