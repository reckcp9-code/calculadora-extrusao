(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfQuickAccessStyle'))return;
    const st=document.createElement('style');
    st.id='dfQuickAccessStyle';
    st.textContent=[
      '#dfQuickAccess{display:none;grid-template-columns:repeat(3,1fr);gap:8px;background:#08090bee;border:1px solid #263244;border-radius:16px;padding:7px;margin:-4px 0 10px;box-shadow:0 10px 26px rgba(0,0,0,.18)}',
      '#dfQuickAccess .dfQuickBtn{width:100%;min-height:42px;margin:0;border:1px solid #334155;background:#111827;color:#cbd5e1;border-radius:11px;padding:10px 4px;font:900 10px system-ui;cursor:pointer}',
      '#dfQuickAccess .dfQuickBtn.on{background:#211400;border-color:#f5a000;color:#ffd36a}',
      '#dfQuickAccess .dfQuickBtn:active{transform:translateY(1px)}',
      '#appContent>.tabs{grid-template-columns:repeat(4,1fr)!important}',
      '@media(max-width:560px){#dfQuickAccess{gap:7px;padding:7px;margin:-2px 0 9px}#dfQuickAccess .dfQuickBtn{font-size:10px;padding:10px 2px;min-height:40px}#appContent>.tabs{grid-template-columns:repeat(4,1fr)!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function getCourseButton(tabs){
    if(!tabs)return null;
    const list=[...tabs.querySelectorAll('button')];
    return list.find(b=>String(b.textContent||'').trim().replace(/\s+/g,' ').toUpperCase()==='CURSO')||null;
  }

  function ensureBox(){
    const app=$('appContent');
    if(!app)return null;
    const brand=app.querySelector('.brand');
    if(!brand)return null;
    let box=$('dfQuickAccess');
    if(!box){
      box=document.createElement('div');
      box.id='dfQuickAccess';
      brand.insertAdjacentElement('afterend',box);
      box.addEventListener('click',function(e){
        const b=e.target.closest('button');
        if(!b)return;
        if(b.id==='btAj'||b.id==='btFb'){
          box.querySelectorAll('.dfQuickBtn').forEach(x=>x.classList.toggle('on',x===b));
        }
      });
    }else if(box.previousElementSibling!==brand){
      brand.insertAdjacentElement('afterend',box);
    }
    return box;
  }

  function organize(){
    addStyle();
    const app=$('appContent');
    if(!app)return;
    const tabs=app.querySelector('.tabs');
    const box=ensureBox();
    if(!tabs||!box)return;

    const course=getCourseButton(tabs)||[...box.querySelectorAll('button')].find(b=>String(b.textContent||'').trim().toUpperCase()==='CURSO');
    const help=$('btAj');
    const feedback=$('btFb');

    [course,help,feedback].forEach(function(btn){
      if(!btn)return;
      btn.classList.add('dfQuickBtn');
      box.appendChild(btn);
    });

    box.style.display=box.querySelector('button')?'grid':'none';
  }

  function init(){
    organize();
    setTimeout(organize,120);
    setTimeout(organize,450);
    setTimeout(organize,950);
    setTimeout(organize,1800);
    try{
      const app=$('appContent')||document.documentElement;
      const observer=new MutationObserver(function(){setTimeout(organize,30)});
      observer.observe(app,{childList:true,subtree:true});
    }catch(e){}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
