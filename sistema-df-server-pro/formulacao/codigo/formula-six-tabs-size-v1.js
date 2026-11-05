/* Visual-only: six equal action tabs in Formulação > OPs Automáticas. */
(function(){'use strict';if(window.DFFormulaSixTabsSizeV1)return;window.DFFormulaSixTabsSizeV1=true;
const css=document.createElement('style');css.id='dfFormulaSixTabsSizeV1';css.textContent=`
#pgFo .dfPATabs,#pgFo .dfPAQuickTabs,#pgFo .dfOpsTabs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:100%!important;overflow:visible!important}
#pgFo .dfPATabs>button,#pgFo .dfPAQuickTabs>button,#pgFo .dfOpsTabs>button{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:66px!important;height:100%!important;padding:12px 8px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:normal!important;line-height:1.2!important;font-weight:700!important}
@media(max-width:380px){#pgFo .dfPATabs,#pgFo .dfPAQuickTabs,#pgFo .dfOpsTabs{gap:7px!important}#pgFo .dfPATabs>button,#pgFo .dfPAQuickTabs>button,#pgFo .dfOpsTabs>button{font-size:12px!important;padding:10px 5px!important}}
`;document.head.appendChild(css);
})();