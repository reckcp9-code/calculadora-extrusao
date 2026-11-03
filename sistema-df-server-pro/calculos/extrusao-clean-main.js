(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const TXT=s=>String(s||'').toLocaleLowerCase('pt-BR');
  let active='ex';
  let tries=0;

  function addStyle(){
    if($('dfExCleanStyle'))return;
    const st=document.createElement('style');
    st.id='dfExCleanStyle';
    st.textContent=[
      'body.dfExActive #appContent>.brand{display:none!important}',
      'body.dfExActive #appContent{padding-top:8px!important}',
      'body.dfExActive .foot{display:none!important}',
      'body.dfExActive #dfUpdateNotify,body.dfExActive .dfUpdateNotify,body.dfExActive .updateNotify,body.dfExActive .toast,body.dfExActive .notification,body.dfExActive .installBanner,body.dfExActive .pwaInstall{display:none!important}',
      'body.dfExActive #pgEx{margin-top:0!important}',
      '#pgEx.dfCleanReady>.card:not(.dfCleanMoved){display:none!important}',
      '#pgEx.dfCleanReady #dfContact_pgEx{display:none!important}',
      '#dfExCleanShell{margin:0 0 14px}',
      '#dfExCleanHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}',
      '#dfExCleanTitle{font-size:22px;font-weight:950;letter-spacing:.4px;color:#fff}',
      '#dfExCleanBadge{font-size:11px;color:#ffd36a;border:1px solid rgba(245,160,0,.55);background:rgba(245,160,0,.10);border-radius:999px;padding:6px 9px;font-weight:950}',
      '#dfExCleanTabs{display:flex;gap:7px;overflow-x:auto;padding:3px 0 12px;scrollbar-width:none}',
      '#dfExCleanTabs::-webkit-scrollbar{display:none}',
      '.dfExCleanBtn{flex:0 0 auto;min-width:82px;border:1px solid #29405a;background:linear-gradient(180deg,#0c1b2c,#07111d);color:#e5eef8;border-radius:10px;padding:12px 9px;font-size:10.5px;font-weight:950;text-transform:uppercase;letter-spacing:.15px;line-height:1.1}',
      '.dfExCleanBtn.on{border-color:#f5a000;color:#111;background:linear-gradient(180deg,#ffc43b,#f59e0b);box-shadow:0 0 0 1px rgba(255,176,0,.22),0 8px 26px rgba(255,176,0,.14)}',
      '.dfExPanel{display:none}',
      '.dfExPanel.on{display:block}',
      '.dfExPanel>.card{margin-bottom:0!important}',
      'body.dfExActive #pgEx .card{background:linear-gradient(180deg,rgba(12,28,46,.96),rgba(6,14,24,.96))!important;border-color:#29405a!important;border-radius:18px!important;box-shadow:0 18px 45px rgba(0,0,0,.25)!important}',
      'body.dfExActive #pgEx .tag{display:none!important}',
      'body.dfExActive #pgEx h2{font-size:24px!important;line-height:1.1!important;margin-top:2px!important}',
      'body.dfExActive #pgEx input,body.dfExActive #pgEx select{background:#07111d!important;border-color:#36516c!important;border-radius:12px!important;font-size:18px!important;font-weight:800!important}',
      'body.dfExActive #pgEx .result{border-color:#f5a000!important;background:linear-gradient(180deg,rgba(255,176,0,.13),rgba(255,176,0,.04))!important}',
      'body.dfExActive #pgEx .result span{color:#ffd36a!important;font-weight:950!important}',
      'body.dfExActive #pgEx .result b{color:#ffd36a!important}',
      '@media(max-width:560px){body.dfExActive .w{padding:8px 10px 26px!important}body.dfExActive .tabs{margin:0 0 8px!important;top:0!important}#dfExCleanTitle{font-size:21px}.dfExCleanBtn{min-width:78px;padding:11px 8px;font-size:10px}body.dfExActive #pgEx h2{font-size:23px!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function cardText(el){return TXT(el?el.textContent:'')}
  function byText(pg,parts){
    const cards=Array.from(pg.querySelectorAll(':scope > .card'));
    return cards.find(c=>parts.every(p=>cardText(c).includes(p)));
  }
  function panel(id){return $('dfExPanel_'+id)}

  function buildShell(pg){
    let shell=$('dfExCleanShell');
    if(shell)return shell;
    shell=document.createElement('div');
    shell.id='dfExCleanShell';
    shell.innerHTML='<div id="dfExCleanHead"><div id="dfExCleanTitle">EXTRUSÃO</div><div id="dfExCleanBadge">MODO LIMPO</div></div>'+
      '<div id="dfExCleanTabs" role="tablist">'+
      '<button class="dfExCleanBtn on" type="button" data-exclean="ex">Extrusão</button>'+
      '<button class="dfExCleanBtn" type="button" data-exclean="bob">Bobina</button>'+
      '<button class="dfExCleanBtn" type="button" data-exclean="micra">Corrigir<br>Micra</button>'+
      '<button class="dfExCleanBtn" type="button" data-exclean="rpm">Puxador<br>/ Massa</button>'+
      '<button class="dfExCleanBtn" type="button" data-exclean="prod">Produção<br>+%</button>'+
      '</div><div id="dfExCleanPanels">'+
      '<div id="dfExPanel_ex" class="dfExPanel on"></div>'+
      '<div id="dfExPanel_bob" class="dfExPanel"></div>'+
      '<div id="dfExPanel_micra" class="dfExPanel"></div>'+
      '<div id="dfExPanel_rpm" class="dfExPanel"></div>'+
      '<div id="dfExPanel_prod" class="dfExPanel"></div>'+
      '</div>';
    pg.insertBefore(shell,pg.firstChild);
    shell.querySelectorAll('[data-exclean]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.exclean||'ex')));
    return shell;
  }

  function choose(id){
    active=id||'ex';
    document.querySelectorAll('#dfExCleanTabs [data-exclean]').forEach(b=>b.classList.toggle('on',(b.dataset.exclean||'')===active));
    document.querySelectorAll('#dfExCleanPanels .dfExPanel').forEach(p=>p.classList.toggle('on',p.id==='dfExPanel_'+active));
    setTimeout(refreshMode,0);
  }

  function move(el,id){
    const p=panel(id);
    if(!el||!p)return;
    if(el.parentElement!==p)p.appendChild(el);
    el.classList.add('dfCleanMoved');
  }

  function organize(){
    const pg=$('pgEx');
    if(!pg)return false;
    addStyle();
    buildShell(pg);
    pg.classList.add('dfCleanReady');

    const ex=byText(pg,['peso ideal por metro']) || $('dfExPanel_ex')?.querySelector('.card');
    const micra=byText(pg,['descobrir micra']) || byText(pg,['micra real']) || $('dfExPanel_micra')?.querySelector('.card');
    const rpm=byText(pg,['corrigir micra por peso']) || byText(pg,['corrigir pelo puxador']) || $('dfExPanel_rpm')?.querySelector('.card');
    const prod=byText(pg,['aumentar / diminuir produção']) || byText(pg,['calcular nova produção']) || $('dfExPanel_prod')?.querySelector('.card');
    const bob=$('dfBobinaCard') || $('dfExPanel_bob')?.querySelector('.card');

    move(ex,'ex');
    move(bob,'bob');
    move(micra,'micra');
    move(rpm,'rpm');
    move(prod,'prod');

    if(!panel('bob')?.children.length){
      const empty=$('dfExBobWait')||document.createElement('div');
      empty.id='dfExBobWait';
      empty.className='card';
      empty.innerHTML='<h2>Bobina</h2><div class="hint">Carregando cálculo da bobina...</div>';
      panel('bob')?.appendChild(empty);
    }else{
      const w=$('dfExBobWait');if(w)w.remove();
    }
    choose(active);
    refreshMode();
    return true;
  }

  function refreshMode(){
    const pg=$('pgEx');
    const app=$('appContent');
    const on=!!(pg&&pg.classList.contains('on')&&app&&getComputedStyle(app).display!=='none');
    document.body.classList.toggle('dfExActive',on);
    if(on)organize();
  }

  function boot(){
    organize();
    refreshMode();
    const bt=$('btEx');
    if(bt&&!bt.dfExCleanBound){bt.dfExCleanBound=true;bt.addEventListener('click',()=>setTimeout(()=>{active='ex';organize();refreshMode();},40));}
    document.addEventListener('click',ev=>{
      if(ev.target&&ev.target.closest&&ev.target.closest('.tab'))setTimeout(refreshMode,80);
    },true);
    const iv=setInterval(()=>{tries++;organize();refreshMode();if(tries>30)clearInterval(iv)},300);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('df-ui-ready',()=>setTimeout(boot,80));
})();
