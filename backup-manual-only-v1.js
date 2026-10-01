(function(){
  'use strict';
  var s=document.createElement('script');
  s.src='./backup-manual-lite-v2.js?v=20260912-hotfix-trava-v148';
  s.defer=true;
  document.head.appendChild(s);

  // Hotfix produção: permitir várias formulações com o mesmo nome.
  var f=document.createElement('script');
  f.src='./formula-allow-same-name-v1.js?v=20261001-formula-dup-v58';
  f.defer=true;
  document.head.appendChild(f);
})();
