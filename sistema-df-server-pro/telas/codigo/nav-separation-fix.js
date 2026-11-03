(function(){
  'use strict';

  function $(id){return document.getElementById(id)}

  function onlyHelp(){
    const fb=$('pgFb');if(fb)fb.classList.remove('on');
    const fbBtn=$('btFb');if(fbBtn)fbBtn.classList.remove('on');
    const help=$('pgAj');if(help)help.classList.add('on');
    const helpBtn=$('btAj');if(helpBtn)helpBtn.classList.add('on');
  }

  function onlyFeedback(){
    const help=$('pgAj');if(help)help.classList.remove('on');
    const helpBtn=$('btAj');if(helpBtn)helpBtn.classList.remove('on');
    const fb=$('pgFb');if(fb)fb.classList.add('on');
    const fbBtn=$('btFb');if(fbBtn)fbBtn.classList.add('on');
  }

  function closeExtras(){
    const help=$('pgAj');if(help)help.classList.remove('on');
    const fb=$('pgFb');if(fb)fb.classList.remove('on');
    const helpBtn=$('btAj');if(helpBtn)helpBtn.classList.remove('on');
    const fbBtn=$('btFb');if(fbBtn)fbBtn.classList.remove('on');
  }

  function onClick(e){
    const btn=e.target&&e.target.closest?e.target.closest('button'):null;
    if(!btn)return;
    const id=btn.id||'';
    if(id==='btAj')setTimeout(onlyHelp,0);
    else if(id==='btFb')setTimeout(onlyFeedback,0);
    else if(['btEx','btSa','btCu','btFo'].includes(id))setTimeout(closeExtras,0);
  }

  document.addEventListener('click',onClick,true);

  function syncHash(){
    if(location.hash==='#ajuda')setTimeout(onlyHelp,0);
    else if(location.hash==='#feedback')setTimeout(onlyFeedback,0);
  }

  window.addEventListener('hashchange',syncHash);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncHash);
  else syncHash();
})();
