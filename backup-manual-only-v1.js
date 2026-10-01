(function(){
  'use strict';

  // Camada preventiva: entra antes dos módulos carregados sob demanda (OP/relatórios)
  // e monitora falhas de carregamento dos módulos críticos.
  if(!window.DFProductionStabilityV1 && !document.getElementById('dfProductionStabilityLoader')){
    var stability=document.createElement('script');
    stability.id='dfProductionStabilityLoader';
    stability.src='./production-stability-v1.js?v=20260930-stability-test-v1';
    stability.defer=true;
    document.head.appendChild(stability);
  }

  // Proteção de dados: mantém snapshots independentes das formulações, materiais e OPs.
  if(!window.DFDataIntegrityV1 && !document.getElementById('dfDataIntegrityLoader')){
    var integrity=document.createElement('script');
    integrity.id='dfDataIntegrityLoader';
    integrity.src='./data-integrity-v1.js?v=20260930-integrity-test-v1';
    integrity.defer=true;
    document.head.appendChild(integrity);
  }

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
