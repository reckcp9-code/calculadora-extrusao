/* DF EXTRUSOR PRO — viewport responsivo, sem zoom por gestos.
   Escopo exclusivamente visual: nao altera OPs, dados, eventos de sincronizacao ou contas. */
(function(){
  'use strict';
  if(window.DFViewportResponsiveLockV1)return;
  window.DFViewportResponsiveLockV1=true;

  var viewport='width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
  var meta=document.querySelector('meta[name="viewport"]');
  if(!meta){
    meta=document.createElement('meta');
    meta.name='viewport';
    document.head.appendChild(meta);
  }
  if(meta.getAttribute('content')!==viewport)meta.setAttribute('content',viewport);

  var style=document.createElement('style');
  style.id='dfViewportResponsiveLockV1';
  style.textContent=[
    'html,body{width:100%;max-width:100%;min-width:0;overflow-x:clip!important;overscroll-behavior-x:none;touch-action:pan-x pan-y}',
    'body{box-sizing:border-box}',
    'main,#appContent,#dfProdAuto{max-width:100%;min-width:0}',
    'img,video,canvas,svg,iframe{max-width:100%}',
    '@media (hover:none) and (pointer:coarse){input:not([type=checkbox]):not([type=radio]),textarea,select{font-size:max(16px,1em)}}'
  ].join('\n');
  document.head.appendChild(style);

  // iOS Safari pode ignorar user-scalable=no; previne somente gestos de ampliar/reduzir.
  function blockGesture(e){if(e.cancelable)e.preventDefault()}
  document.addEventListener('gesturestart',blockGesture,{passive:false,capture:true});
  document.addEventListener('gesturechange',blockGesture,{passive:false,capture:true});
  document.addEventListener('touchmove',function(e){
    if(e.touches&&e.touches.length>1&&e.cancelable)e.preventDefault();
  },{passive:false,capture:true});

  // Zoom feito com trackpad/CTRL+roda em navegadores que permitem cancelamento.
  document.addEventListener('wheel',function(e){
    if(e.ctrlKey&&e.cancelable)e.preventDefault();
  },{passive:false,capture:true});
  document.addEventListener('keydown',function(e){
    if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
    if(['+','-','=','0','Add','Subtract','NumpadAdd','NumpadSubtract','Numpad0'].includes(e.key)&&e.cancelable)e.preventDefault();
  },true);
})();