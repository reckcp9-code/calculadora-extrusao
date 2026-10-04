(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_NATIVE_LOADER_V1)return;window.DF_PRODUCAO_PDF_NATIVE_LOADER_V1=true;
var s=document.createElement('script');
s.src='./producao-pdf-native-v1.js?v=20261004-native-pdf-v1';
s.async=false;
s.onload=function(){try{console.info('DF Produção: PDF nativo carregado.')}catch(e){}};
s.onerror=function(){try{console.error('DF Produção: falha ao carregar PDF nativo.')}catch(e){}};
document.head.appendChild(s);
})();
