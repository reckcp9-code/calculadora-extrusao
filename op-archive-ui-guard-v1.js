(function(){
'use strict';
if(window.DFOpArchiveUiGuardV1)return;window.DFOpArchiveUiGuardV1=true;
function archiveActive(){const p=document.getElementById('dfPaneArchive');return !!(p&&p.classList.contains('on'))}
document.addEventListener('change',function(e){
  if(!archiveActive())return;
  if(e.target&&e.target.id==='dfOpMonth'&&e.isTrusted===false){e.preventDefault();e.stopImmediatePropagation()}
},true);
})();
