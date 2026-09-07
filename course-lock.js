(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function addStyle(){
    if($('dfCourseLockStyle'))return;
    const st=document.createElement('style');
    st.id='dfCourseLockStyle';
    st.textContent=[
      '.dfCourseLocked{opacity:.58!important;filter:grayscale(.35);cursor:not-allowed!important;position:relative}',
      '.dfCourseLocked::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(245,158,11,.28)}'
    ].join('');
    document.head.appendChild(st);
  }

  function isCourseTarget(el){
    if(!el)return false;
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
    const href=String(el.getAttribute&&el.getAttribute('href')||'').toLowerCase();
    const onclick=String(el.getAttribute&&el.getAttribute('onclick')||'').toLowerCase();
    return href.includes('curso.html')||onclick.includes('curso.html')||text==='CURSO'||text==='🔒 CURSO'||text.includes('CONHECER CURSO DE EXTRUSÃO');
  }

  function lockOne(el){
    if(!el||el.dataset.dfCourseLocked==='1')return;
    el.dataset.dfCourseLocked='1';
    el.classList.add('dfCourseLocked');
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
    if(text.toUpperCase()==='CURSO')el.textContent='🔒 CURSO';
    else if(text.toUpperCase()==='CONHECER CURSO DE EXTRUSÃO')el.textContent='🔒 CONHECER CURSO DE EXTRUSÃO';
    if(el.hasAttribute('onclick')){el.dataset.dfCourseOldOnclick=el.getAttribute('onclick')||'';el.removeAttribute('onclick')}
    if(el.tagName==='A'&&el.hasAttribute('href')){el.dataset.dfCourseOldHref=el.getAttribute('href')||'';el.setAttribute('href','#')}
    el.setAttribute('aria-disabled','true');
    el.title='Curso bloqueado temporariamente';
  }

  function lockAll(){
    addStyle();
    document.querySelectorAll('button,a').forEach(function(el){if(isCourseTarget(el))lockOne(el)});
  }

  function blockClick(e){
    const el=e.target&&e.target.closest?e.target.closest('button,a'):null;
    if(!el||!isCourseTarget(el))return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    alert('🔒 CURSO BLOQUEADO\n\nEssa área ainda está bloqueada e será liberada depois.');
  }

  function init(){
    lockAll();
    setTimeout(lockAll,180);
    setTimeout(lockAll,650);
    setTimeout(lockAll,1500);
    document.addEventListener('click',blockClick,true);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(lockAll,30)});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
