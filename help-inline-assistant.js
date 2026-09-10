(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  let speaking=false;
  let parts=[];
  let partIndex=0;

  const topics=[
    {
      key:'inicio',
      title:'Visão geral',
      text:'O DF EXTRUSOR PRO reúne as principais ferramentas para extrusão de filme plástico, sacolas, custos, formulação, bobinas, correções de micra, produção, PDF e ordem de produção.'
    },
    {
      key:'extrusao',
      title:'Extrusão',
      text:'Na Extrusão você informa largura do filme, comprimento quando necessário, micra desejada e densidade. O sistema calcula o peso ideal por metro. Também é possível descobrir a micra real pelo peso medido de um metro, calcular bobina, corrigir micra pelo puxador ou pela massa e aumentar ou diminuir a produção mantendo uma relação de referência entre massa e puxador.'
    },
    {
      key:'sacolas',
      title:'Sacolas',
      text:'Na área Sacolas você informa largura, comprimento, densidade e desconto de alça ou recorte. Logo abaixo fica o cálculo de micra para peso do saco. Na outra aba você informa a quantidade de sacos para calcular o peso do rolo. As medidas ficam organizadas para facilitar o uso na produção.'
    },
    {
      key:'custo',
      title:'Custo',
      text:'Na área Custo você calcula o custo do produto, preço de venda, margem e lucro. O sistema pode usar dados vindos de outras partes do aplicativo ou valores digitados manualmente, conforme a tela disponível.'
    },
    {
      key:'formulacao',
      title:'Formulação',
      text:'Na Formulação você cadastra os materiais, informa as porcentagens e a quantidade total que deseja produzir. O sistema calcula automaticamente quantos quilos usar de cada matéria prima. A formulação deve fechar em cem por cento para a mistura ficar correta.'
    },
    {
      key:'op',
      title:'OP e PDF',
      text:'A Ordem de Produção e os relatórios usam os dados preenchidos no sistema para organizar as informações de produção. A OP pode reunir formulação, medidas, micra, materiais, porcentagens, quantidade e campos de acompanhamento da produção. Os relatórios podem ser visualizados e impressos conforme as funções disponíveis no aplicativo.'
    },
    {
      key:'favoritos',
      title:'Favoritos e ajuda',
      text:'Use Favoritos para acessar mais rápido as funções que você usa com frequência. Use Ajuda sempre que quiser consultar este guia ou ouvir as explicações em voz alta.'
    }
  ];

  function canSpeak(){
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  function esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function addStyle(){
    if($('dfInlineHelpStyle'))return;
    const s=document.createElement('style');
    s.id='dfInlineHelpStyle';
    s.textContent=`
      #dfInlineHelp{
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
      #dfInlineHelp.open{display:block!important}
      #dfInlineHelp .dfHelpHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
      #dfInlineHelp .dfHelpTitle{font-size:20px;font-weight:950;color:#fff;line-height:1.1}
      #dfInlineHelp .dfHelpSub{margin-top:5px;color:#94a3b8;font-size:12px;line-height:1.4}
      #dfInlineHelp .dfHelpClose{flex:0 0 auto;width:36px;height:36px;border:1px solid #334155;border-radius:10px;background:#111827;color:#e5eef8;font-size:19px;font-weight:900}
      #dfInlineHelp .dfVoiceBox{border:1px solid #f5a000;border-radius:14px;background:#211400;padding:12px;margin:11px 0}
      #dfInlineHelp .dfVoiceTitle{font-size:14px;font-weight:950;color:#ffd36a;margin-bottom:5px}
      #dfInlineHelp .dfVoiceText{font-size:12px;color:#e5e7eb;line-height:1.4;margin-bottom:10px}
      #dfInlineHelp .dfVoiceActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #dfInlineHelp .dfVoiceBtn{min-height:42px;border-radius:11px;border:1px solid #16a34a;background:#0c321c;color:#86efac;font-weight:950;font-size:11px}
      #dfInlineHelp .dfVoiceBtn.stop{border-color:#7f1d1d;background:#230b0b;color:#fca5a5}
      #dfInlineHelp .dfHelpStatus{margin-top:8px;min-height:18px;font-size:11px;font-weight:800;color:#94a3b8}
      #dfInlineHelp .dfHelpTopics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
      #dfInlineHelp .dfHelpTopic{border:1px solid #334155;border-radius:12px;background:#111827;padding:11px;color:#e5eef8;text-align:left;min-height:84px}
      #dfInlineHelp .dfHelpTopic b{display:block;color:#ffd36a;font-size:12px;margin-bottom:5px}
      #dfInlineHelp .dfHelpTopic span{display:block;color:#cbd5e1;font-size:10.5px;line-height:1.35;font-weight:600}
      #dfInlineHelp .dfHelpTopic:active{transform:scale(.985)}
      @media(max-width:560px){
        #dfInlineHelp{padding:13px 11px}
        #dfInlineHelp .dfVoiceActions{grid-template-columns:1fr 1fr}
        #dfInlineHelp .dfHelpTopics{grid-template-columns:1fr}
        #dfInlineHelp .dfHelpTopic{min-height:0}
      }
    `;
    document.head.appendChild(s);
  }

  function panelHtml(){
    const topicHtml=topics.map(t=>
      '<button type="button" class="dfHelpTopic" data-help-topic="'+esc(t.key)+'"><b>'+esc(t.title)+'</b><span>'+esc(t.text)+'</span></button>'
    ).join('');

    return '<div class="dfHelpHead">'+
      '<div><div class="dfHelpTitle">🔊 Assistente de voz</div><div class="dfHelpSub">Explica como usar o DF EXTRUSOR PRO. Você pode ouvir tudo ou tocar em uma parte específica.</div></div>'+
      '<button type="button" class="dfHelpClose" id="dfInlineHelpClose" aria-label="Fechar ajuda">×</button>'+
      '</div>'+
      '<div class="dfVoiceBox">'+
        '<div class="dfVoiceTitle">ASSISTENTE DF</div>'+
        '<div class="dfVoiceText">Toque em OUVIR TUDO para receber uma explicação completa do aplicativo em voz alta.</div>'+
        '<div class="dfVoiceActions"><button type="button" id="dfInlineHelpReadAll" class="dfVoiceBtn">🔊 OUVIR TUDO</button><button type="button" id="dfInlineHelpStop" class="dfVoiceBtn stop">⏹ PARAR</button></div>'+
        '<div id="dfInlineHelpStatus" class="dfHelpStatus">Pronto para ajudar.</div>'+
      '</div>'+
      '<div class="dfHelpTopics">'+topicHtml+'</div>';
  }

  function ensurePanel(){
    addStyle();
    const box=$('dfQuickAccess');
    if(!box)return null;
    let p=$('dfInlineHelp');
    if(!p){
      p=document.createElement('div');
      p.id='dfInlineHelp';
      p.setAttribute('aria-hidden','true');
      p.innerHTML=panelHtml();
      box.appendChild(p);

      $('dfInlineHelpClose')?.addEventListener('click',function(){closePanel()});
      $('dfInlineHelpReadAll')?.addEventListener('click',function(){readAll()});
      $('dfInlineHelpStop')?.addEventListener('click',function(){stopSpeak('Leitura parada.')});
      p.addEventListener('click',function(e){
        const b=e.target.closest('[data-help-topic]');
        if(!b)return;
        const topic=topics.find(t=>t.key===b.dataset.helpTopic);
        if(topic)readTopic(topic);
      });
    }else if(p.parentElement!==box){
      box.appendChild(p);
    }
    return p;
  }

  function setStatus(text,kind){
    const el=$('dfInlineHelpStatus');
    if(!el)return;
    el.textContent=text;
    el.style.color=kind==='ok'?'#86efac':kind==='bad'?'#fca5a5':kind==='warn'?'#fbbf24':'#94a3b8';
  }

  function pickVoice(){
    try{
      const vs=speechSynthesis.getVoices()||[];
      return vs.find(v=>/pt-BR/i.test(v.lang))||vs.find(v=>/^pt/i.test(v.lang))||null;
    }catch(e){return null}
  }

  function speakNext(){
    if(!speaking)return;
    if(partIndex>=parts.length){
      speaking=false;
      setStatus('Explicação finalizada.','ok');
      return;
    }
    const u=new SpeechSynthesisUtterance(parts[partIndex]);
    u.lang='pt-BR';
    u.rate=.92;
    u.pitch=1;
    const v=pickVoice();
    if(v)u.voice=v;
    u.onstart=function(){setStatus('Assistente falando '+(partIndex+1)+' de '+parts.length+'...','ok')};
    u.onend=function(){partIndex++;setTimeout(speakNext,140)};
    u.onerror=function(){speaking=false;setStatus('Não consegui continuar a leitura. Toque em ouvir novamente.','bad')};
    try{
      speechSynthesis.speak(u);
      setTimeout(function(){try{speechSynthesis.resume()}catch(e){}},200);
    }catch(e){
      speaking=false;
      setStatus('Este navegador não liberou a voz.','bad');
    }
  }

  function startParts(list){
    if(!canSpeak()){
      setStatus('Este aparelho ou navegador não suporta leitura em voz alta.','bad');
      return;
    }
    try{speechSynthesis.cancel()}catch(e){}
    parts=list.filter(Boolean);
    partIndex=0;
    speaking=true;
    setStatus('Preparando a explicação...','warn');
    setTimeout(speakNext,100);
  }

  function readAll(){
    startParts([
      'Bem vindo ao assistente do DF EXTRUSOR PRO. Vou explicar as principais partes do aplicativo.'
    ].concat(topics.map(t=>t.title+'. '+t.text)).concat([
      'Fim da explicação. Você pode abrir a ajuda novamente e tocar em qualquer assunto para ouvir somente aquela parte.'
    ]));
  }

  function readTopic(topic){
    startParts([topic.title+'. '+topic.text]);
  }

  function stopSpeak(msg){
    speaking=false;
    try{if(canSpeak())speechSynthesis.cancel()}catch(e){}
    if(msg)setStatus(msg,'warn');
  }

  function openPanel(){
    const p=ensurePanel();
    if(!p)return;
    p.classList.add('open');
    p.setAttribute('aria-hidden','false');
    const help=$('btAj');
    if(help)help.classList.add('on');
    requestAnimationFrame(function(){
      try{p.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}
    });
  }

  function closePanel(){
    const p=$('dfInlineHelp');
    if(p){p.classList.remove('open');p.setAttribute('aria-hidden','true')}
    const help=$('btAj');
    if(help)help.classList.remove('on');
    stopSpeak();
  }

  function togglePanel(){
    const p=ensurePanel();
    if(!p)return;
    if(p.classList.contains('open'))closePanel();else openPanel();
  }

  function interceptHelp(e){
    const b=e.target&&e.target.closest?e.target.closest('#btAj'):null;
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    togglePanel();
  }

  function init(){
    addStyle();
    ensurePanel();
    document.addEventListener('click',interceptHelp,true);
    window.addEventListener('df-ui-ready',function(){setTimeout(ensurePanel,80)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(ensurePanel,80)});
    try{if(canSpeak())speechSynthesis.onvoiceschanged=pickVoice}catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
