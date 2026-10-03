(function(){
'use strict';
if(window.DFProducaoCleanV16)return;window.DFProducaoCleanV16=true;

function hideDateField(text){
  document.querySelectorAll('#dfPrRoot label').forEach(function(label){
    if(String(label.textContent||'').trim()!==text)return;
    var box=label.parentElement;
    if(box){box.style.display='none';box.setAttribute('aria-hidden','true');}
  });
}

function cleanHero(){
  var hero=document.querySelector('#dfPrRoot .dfPrHero');
  if(!hero)return;
  var title=hero.querySelector('h2');
  if(title)title.style.display='none';
  var first=hero.firstElementChild;
  if(first&&!first.classList.contains('dfPrSector')&&!first.classList.contains('dfPrTabs'))first.style.display='none';
  var meta=hero.querySelector('.dfPrMeta');
  if(meta)meta.style.display='none';
  hero.classList.add('dfPrHeroCompact');
}

function cleanNewCard(){
  var body=document.getElementById('dfPrBody');
  if(!body)return;
  var card=body.querySelector('.dfPrCard');
  if(card){
    var first=card.firstElementChild;
    if(first&&/Nova OP semanal/i.test(first.textContent||''))first.textContent=String(first.textContent||'').replace('Nova OP semanal','Nova OP');
  }
  hideDateField('Data inicial');
  hideDateField('Data final');
}

function apply(){
  cleanHero();
  cleanNewCard();
}

function css(){
  if(document.getElementById('dfProdCleanV16Css'))return;
  var s=document.createElement('style');
  s.id='dfProdCleanV16Css';
  s.textContent=`
    #dfPrRoot .dfPrHero.dfPrHeroCompact{padding:10px 14px 14px!important}
    #dfPrRoot .dfPrHero.dfPrHeroCompact .dfPrSector{margin-top:0!important}
    #dfPrRoot .dfPrHero.dfPrHeroCompact .dfPrTabs{margin-top:10px!important}
  `;
  document.head.appendChild(s);
}

function start(){
  css();apply();
  var root=document.getElementById('dfPrRoot');
  if(!root){setTimeout(start,120);return;}
  new MutationObserver(function(){requestAnimationFrame(apply)}).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('[data-sector],[data-pane]'))setTimeout(apply,0);
  },true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
