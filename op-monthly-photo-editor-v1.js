(function(){
'use strict';
if(window.DFMonthlyPhotoEditorV1)return;window.DFMonthlyPhotoEditorV1=true;
const OPS='df_formula_ops_auto_v2',API='https://df-extrusor-api.reck-cp9.workers.dev';
const read=()=>{try{const a=JSON.parse(localStorage.getItem(OPS)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const code=o=>String(o?.id||o?.qr||'').trim().toUpperCase();
const name=o=>String(o?.manualProductName||o?.clienteFormulacao||o?.nomeProduto||o?.produto||o?.title||'PRODUTO NÃO INFORMADO').trim();
const month=o=>String(o?.manualConfirmedAt||o?.completedAt||o?.baixadoEm||o?.updatedAt||o?.createdAt||'').slice(0,7);
function mount(){
 const tabs=document.querySelector('.dfOpsTabs'),monthButton=tabs?.querySelector('[data-pane="month"]');if(!tabs||!monthButton)return false;
 if(document.getElementById('dfMonthlyPhotoButton'))return true;
 const b=document.createElement('button');b.id='dfMonthlyPhotoButton';b.type='button';b.textContent='📸 FOTOS';monthButton.insertAdjacentElement('afterend',b);
 const pane=document.createElement('section');pane.id='dfMonthlyPhotoPane';pane.className='dfOpsPane';pane.innerHTML='<div class="dfOpsCard"><h3>📸 FOTOS • OPs BAIXADAS</h3><label>MÊS</label><input type="month" id="dfMonthlyPhotoMonth" style="width:100%;min-height:46px"><input id="dfMonthlyPhotoSearch" placeholder="PESQUISAR PRODUTO OU ID DA OP" style="width:100%;min-height:46px;margin-top:10px"><button id="dfMonthlyPhotoRefresh" class="dfOpsBtn alt" style="margin-top:10px">🔄 ATUALIZAR</button><div id="dfMonthlyPhotoRows" style="margin-top:12px"></div></div>';
 tabs.parentElement.appendChild(pane);
 const css=document.createElement('style');css.textContent='#dfMonthlyPhotoPane{display:none}#dfMonthlyPhotoPane.on{display:block}#dfMonthlyPhotoPane .dfMonthlyRow{padding:12px;border:1px solid #334155;border-radius:12px;margin:8px 0;background:#101a2d}#dfMonthlyPhotoPane .dfMonthlyRow button{margin-top:9px;width:100%;min-height:42px;border:1px solid #f5a000;background:#231900;color:#ffd36a;border-radius:10px;font-weight:800}#dfMonthlyPhotoPane input{background:#0b1220;border:1px solid #334155;border-radius:10px;padding:12px;color:#fff;font-size:16px}';document.head.appendChild(css);
 const m=pane.querySelector('#dfMonthlyPhotoMonth');m.value=new Date().toLocaleDateString('en-CA').slice(0,7);const search=pane.querySelector('#dfMonthlyPhotoSearch');
 function render(){
 const q=search.value.trim().toUpperCase(),selected=m.value;
 const rows=read().filter(o=>o?.status==='ok'&&code(o)&&month(o)===selected&&(!q||code(o).includes(q)||name(o).toUpperCase().includes(q))).sort((a,b)=>String(b.manualConfirmedAt||b.updatedAt||b.createdAt||'').localeCompare(String(a.manualConfirmedAt||a.updatedAt||a.createdAt||'')));
 const host=pane.querySelector('#dfMonthlyPhotoRows');host.replaceChildren();
 if(!rows.length){host.textContent='Nenhuma OP baixada encontrada neste mês neste aparelho.';return}
 rows.forEach(o=>{const r=document.createElement('div');r.className='dfMonthlyRow';r.innerHTML='<strong>'+esc(name(o))+'</strong><div style="font-size:12px;color:#94a3b8;overflow-wrap:anywhere">'+esc(code(o))+'</div><div>Produção: '+esc(o.produzido||0)+' kg • Apara: '+esc(o.apara||0)+' kg</div><button type="button">✏️ EDITAR • SALVAR E MANTER EM PRONTAS</button>';
 r.querySelector('button').onclick=()=>{const ready=tabs.querySelector('[data-pane="ok"]');if(ready)ready.click();setTimeout(()=>{const view=[...document.querySelectorAll('[data-view]')].find(x=>String(x.getAttribute('data-view')).toUpperCase()===code(o));if(view)view.click();else alert('OP não disponível para edição neste aparelho. Nenhum dado foi alterado.')},120)};
 host.appendChild(r)});
 }
 b.onclick=()=>{tabs.querySelectorAll('[data-pane]').forEach(x=>x.classList.remove('on'));b.classList.add('on');tabs.parentElement.querySelectorAll('.dfOpsPane').forEach(x=>x.classList.remove('on'));pane.classList.add('on');render()};
 tabs.addEventListener('click',e=>{if(e.target.closest('[data-pane]')){b.classList.remove('on');pane.classList.remove('on')}},true);
 m.onchange=render;search.oninput=render;pane.querySelector('#dfMonthlyPhotoRefresh').onclick=render;
 window.addEventListener('df-prontas-products-synced',()=>{if(pane.classList.contains('on'))render()});
 return true;
}
function boot(){if(mount())return;let n=0;const timer=setInterval(()=>{if(mount()||++n>60)clearInterval(timer)},300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();