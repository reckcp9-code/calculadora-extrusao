(function(){
  'use strict';

  function addStyle(){
    if(document.getElementById('dfOpPhotoSourceStyle'))return;
    const s=document.createElement('style');
    s.id='dfOpPhotoSourceStyle';
    s.textContent=`
      #dfOpPhotoSource{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:2px 0 10px}
      #dfOpPhotoSource button{min-height:48px;border-radius:13px;padding:12px 10px;font-size:13px;font-weight:950;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #dfOpTakePhoto{border:1px solid #f5a000;background:#241600;color:#ffd36a}
      #dfOpUploadPhoto{border:1px solid #475569;background:#0f172a;color:#e2e8f0}
      #dfOpPhoto.dfOpPhotoHidden{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}
      @media(max-width:420px){#dfOpPhotoSource{grid-template-columns:1fr}#dfOpPhotoSource button{min-height:46px}}
    `;
    document.head.appendChild(s);
  }

  function mount(){
    addStyle();
    const input=document.getElementById('dfOpPhoto');
    if(!input)return false;
    if(input.dataset.dfPhotoSourceMounted==='1')return true;
    input.dataset.dfPhotoSourceMounted='1';
    input.classList.add('dfOpPhotoHidden');

    const wrap=document.createElement('div');
    wrap.id='dfOpPhotoSource';

    const camera=document.createElement('button');
    camera.id='dfOpTakePhoto';
    camera.type='button';
    camera.textContent='📷 TIRAR FOTO';

    const upload=document.createElement('button');
    upload.id='dfOpUploadPhoto';
    upload.type='button';
    upload.textContent='🖼️ ENVIAR FOTO';

    camera.addEventListener('click',function(){
      try{input.value=''}catch(e){}
      input.setAttribute('accept','image/*');
      input.setAttribute('capture','environment');
      input.click();
    });

    upload.addEventListener('click',function(){
      try{input.value=''}catch(e){}
      input.setAttribute('accept','image/*');
      input.removeAttribute('capture');
      input.click();
    });

    wrap.append(camera,upload);
    input.parentNode.insertBefore(wrap,input);
    return true;
  }

  function boot(){
    if(mount())return;
    const root=document.body||document.documentElement;
    if(!root)return;
    const obs=new MutationObserver(function(){if(mount())obs.disconnect()});
    obs.observe(root,{childList:true,subtree:true});
    setTimeout(function(){if(mount())obs.disconnect()},500);
    setTimeout(function(){if(mount())obs.disconnect()},1500);
    setTimeout(function(){if(mount())obs.disconnect()},3000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('df-ui-ready',function(){setTimeout(mount,100)});
})();
