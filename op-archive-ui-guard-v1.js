(function(){
'use strict';
if(window.DFOpArchiveUiGuardV1)return;window.DFOpArchiveUiGuardV1=true;
function archiveActive(){const p=document.getElementById('dfPaneArchive');return !!(p&&p.classList.contains('on'))}
document.addEventListener('change',function(e){
  if(!archiveActive())return;
  if(e.target&&e.target.id==='dfOpMonth'&&e.isTrusted===false){e.preventDefault();e.stopImmediatePropagation()}
},true);
function loadMaintenance(){
  if(window.DFOpPhotoArchiveMaintenanceV1||document.getElementById('dfPhotoArchiveMaintenanceLoader'))return;
  const s=document.createElement('script');s.id='dfPhotoArchiveMaintenanceLoader';s.src='./op-photo-archive-maintenance-v1.js?v=20260929-photo-maint-v48';s.defer=true;document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadMaintenance,350),{once:true});else setTimeout(loadMaintenance,350);
window.addEventListener('df-ui-ready',()=>setTimeout(loadMaintenance,250));
})();
