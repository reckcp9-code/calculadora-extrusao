(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let marker=null,originalParent=null,originalNext=null,opened=false;

  function addStyle(){
    if($('dfMedidaCloneCss'))return;
    const s=document.createElement('style');s.id='dfMedidaCloneCss';s.textContent=[
      '#dfMedidaInlineBtn{width:auto;margin:0 0 0 8px;padding:9px 13px;border:1px solid #f5a000;background:#211400;color:#ffd36a;border-radius:12px;font-weight:900;white-space:nowrap}',
      '#dfMedidaOverlay{position:fixed;inset:0;z-index:1000004;background:#080b13;overflow:auto;padding:14px}',
      '#dfMedidaOverlay[hidden]{display:none!important}',
      '#dfMedidaOverlay .dfMedidaWrap{max-width:760px;margin:auto}',
      '#dfMedidaOverlay .dfMedidaTop{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#080b13ee;padding:8px 0 12px}',
      '#dfMedidaOverlay .dfMedidaTop h2{margin:0}',
      '#dfMedidaMin{width:auto;margin:0;padding:10px 14px}',
      '#dfMedidaHost #pgEx{display:block!important}',
      '#dfMedidaHost #pgEx.page{display:block!important}',
      '@media(max-width:560px){#dfMedidaInlineBtn{margin-left:6px;padding:8px 10px;font-size:12px}.dfMedidaTop{align-items:flex-start}}'
    ].join('');document.head.appendChild(s);
  }

  function ensureOverlay(){
    addStyle();
    if($('dfMedidaOverlay'))return;
    const d=document.createElement('div');d.id='dfMedidaOverlay';d.hidden=true;
    d.innerHTML='<div class="dfMedidaWrap"><div class="dfMedidaTop"><h2>📐 MEDIDA</h2><button id="dfMedidaMin" class="calcBtn alt" type="button">— MINIMIZAR</button></div><div id="dfMedidaHost"></div></div>';
    document.body.appendChild(d);
    $('dfMedidaMin').onclick=closeMedida;
  }

  function placeButton(){
    ensureOverlay();
    const nome=$('foNome');if(!nome)return false;
    const holder=nome.parentElement;if(!holder)return false;
    const label=holder.querySelector('label');
    if(label)label.textContent='Cliente:';
    let row=holder.querySelector('.dfClienteMedidaRow');
    if(!row){
      row=document.createElement('div');row.className='dfClienteMedidaRow';row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0 6px';
      if(label){holder.insertBefore(row,label);row.appendChild(label);label.style.margin='0'}
      else holder.insertBefore(row,nome);
    }
    let b=$('dfMedidaInlineBtn');
    if(!b){b=document.createElement('button');b.id='dfMedidaInlineBtn';b.type='button';b.textContent='📐 MEDIDA';b.onclick=openMedida}
    if(b.parentElement!==row)row.appendChild(b);
    const old=$('dfMedidaBtn');if(old)old.remove();
    return true;
  }

  function openMedida(ev){
    if(ev){ev.preventDefault();ev.stopPropagation()}
    ensureOverlay();
    const pg=$('pgEx'),host=$('dfMedidaHost'),overlay=$('dfMedidaOverlay');
    if(!pg||!host||!overlay)return;
    if(!marker){
      marker=document.createComment('df-pgEx-origin');
      originalParent=pg.parentNode;originalNext=pg.nextSibling;
      originalParent.insertBefore(marker,pg);
    }
    host.appendChild(pg);
    pg.classList.add('on');
    overlay.hidden=false;overlay.scrollTop=0;document.body.style.overflow='hidden';opened=true;
  }

  function closeMedida(){
    const pg=$('pgEx'),overlay=$('dfMedidaOverlay');
    if(pg&&marker&&marker.parentNode){marker.parentNode.insertBefore(pg,marker.nextSibling);pg.classList.remove('on')}
    if(overlay)overlay.hidden=true;
    document.body.style.overflow='';opened=false;
    const pgFo=$('pgFo');if(pgFo)pgFo.classList.add('on');
    const btFo=$('btFo');if(btFo)btFo.classList.add('on');
  }

  function restoreIfNeeded(){
    if(!opened)return;
    if(!$('dfMedidaOverlay')||$('dfMedidaOverlay').hidden)closeMedida();
  }

  function run(){placeButton();setTimeout(placeButton,150);setTimeout(placeButton,600);setTimeout(placeButton,1400)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('df-ui-ready',run);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)closeMedida()});
  document.addEventListener('click',()=>setTimeout(placeButton,70),true);
})();