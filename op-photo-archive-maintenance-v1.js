(function(){
'use strict';
if(window.DFOpPhotoArchiveMaintenanceV1)return;window.DFOpPhotoArchiveMaintenanceV1=true;
function load(){
  if(window.DFOpPhotoMaintenanceSafeV2||document.getElementById('dfPhotoMaintenanceSafeV2Loader'))return;
  const s=document.createElement('script');s.id='dfPhotoMaintenanceSafeV2Loader';s.src='./op-photo-maintenance-safe-v2.js?v=20260929-photo-stable-v50';s.defer=true;document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,250),{once:true});else setTimeout(load,250);
window.addEventListener('df-ui-ready',()=>setTimeout(load,250));
})();
