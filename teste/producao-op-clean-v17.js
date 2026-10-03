(function(){
'use strict';
if(window.DFProducaoCleanV17)return;window.DFProducaoCleanV17=true;

function hideDateField(text){
  document.querySelectorAll('#dfPrRoot label').forEach(function(label){
    if(String(label.textContent||'').trim()!==text)return;
    var box=label.parentElement;
    if(box){box.style.display='none';box.setAttribute('aria-hidden','true');}
  });
}

function clean(){
  var root=document.getElementById('dfPrRoot');
  if(!root)return;

  var hero=root.querySelector('.dfPrHero');
  if(hero){
    hero.style.display='none';
    hero.setAttribute('aria-hidden','true');
  }

  hideDateField('Data inicial');
  hideDateField('Data final');

  var card=document.querySelector('#dfPrBody .dfPrCard');
  if(card){
    var title=card.firstElementChild;
    if(title&&/Nova OP semanal/i.test(title.textContent||'')){
      title.textContent=String(title.textContent||'').replace('Nova OP semanal','Nova OP');
    }
  }
}

function start(){
  clean();
  var root=document.getElementById('dfPrRoot');
  if(!root){setTimeout(start,100);return;}
  new MutationObserver(function(){requestAnimationFrame(clean)}).observe(root,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
