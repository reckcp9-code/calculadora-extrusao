(function(){
  'use strict';

  // O acesso ao DF EXTRUSOR agora exige internet.
  // Mantemos este arquivo apenas para compatibilidade com versões antigas do shell.
  try{localStorage.removeItem('df_offline_auth_v1')}catch(e){}
})();
