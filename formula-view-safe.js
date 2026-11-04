(function(){
  'use strict';
  const q=id=>document.getElementById(id);
  const pn=v=>{let s=String(v??'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0};
  const esc=t=>String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fm=(v,d=2)=>{const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—'};
  const money=v=>Number(v)>0?'R$ '+fm(v,2):'sem custo';
  const load=()=>{try{return window.loadForms?window.loadForms():JSON.parse(localStorage.getItem('df_formulacoes_v2')||'[]')}catch(e){return[]}};
  const save=a=>{try{localStorage.setItem('df_formulacoes_v2',JSON.stringify(a))}catch(e){}render();};
  const selected=()=>{const id=q('foSavedSelect')?.value;return load().find(f=>String(f.id)===String(id));};
  const mat=id=>{try{return window.materialById?window.materialById(id):null}catch(e){return null}};


  // Ficha técnica privada: nunca incluir no objeto compartilhado de formulação.
  const technicalTeam=()=>{try{return window.DFOpCloud?.team?.()||JSON.parse(localStorage.getItem('df_op_team_v1')||'null')}catch(e){return null}};
  const technicalOwner=()=>['owner','dono'].includes(String(technicalTeam()?.role||'').toLowerCase());
  const technicalApi='https://df-extrusor-api.reck-cp9.workers.dev';
  const technicalDevice=()=>{try{const x=window.DFDeviceIdentity?.get?.();if(x)return String(x)}catch(e){}for(const k of ['df_licenseauth_device_v1','df_device_id_v1','df_device_id']){const x=localStorage.getItem(k);if(x)return x}return String(window.DFAccessDeviceId||'')};
  const technicalTokenKey='df_secure_token_v2';
  async function technicalSession(force){
    let token=String(sessionStorage.getItem(technicalTokenKey)||'').trim();
    if(token&&!force)return token;
    const credential=String(localStorage.getItem('df_auto_access_credential_v1')||'').trim();
    const dev=technicalDevice();
    if(!credential||!dev)throw Error('Credencial do aplicativo indisponível. Entre novamente no aplicativo.');
    const r=await fetch(technicalApi+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false||!j.token)throw Error(j.error||'Não foi possível renovar a sessão.');
    token=String(j.token).trim();sessionStorage.setItem(technicalTokenKey,token);return token;
  }
  async function technicalPost(path,formulaId,technical,retry=true){
    const team=technicalTeam();if(!team?.teamId)throw Error('Conecte-se à equipe para acessar.');
    const token=await technicalSession(false),dev=technicalDevice();
    const body={teamId:String(team.teamId),formulaId:String(formulaId)};
    if(technical!==undefined)body.technical=technical;
    const response=await fetch(technicalApi+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body),cache:'no-store'});
    let result={};try{result=await response.json()}catch(e){}
    if(response.status===401&&retry){await technicalSession(true);return technicalPost(path,formulaId,technical,false)}
    if(!response.ok||result.ok===false)throw Error(result.error||'Erro no servidor: '+response.status);
    return result;
  }
  function technicalPinGate(f){
    const old=document.getElementById('dfTechPinGate');if(old)old.remove();
    const gate=document.createElement('div');gate.id='dfTechPinGate';
    gate.style.cssText='position:fixed;inset:0;background:#080b13;z-index:2147483646;padding:calc(env(safe-area-inset-top,0px) + 28px) 20px;overflow:auto;color:#f5f8ff;font:16px -apple-system,BlinkMacSystemFont,Arial';
    gate.innerHTML='<button type="button" id="dfTechPinBack" style="background:#15243a;border:1px solid #dca122;border-radius:12px;color:#ffd166;padding:12px">← VOLTAR</button><h2 style="margin:40px 0 12px">🔒 PARÂMETROS TÉCNICOS</h2><p style="color:#aabbd0">Digite a senha de acesso para continuar.</p><form id="dfTechPinForm"><input id="dfTechPinInput" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="Senha de 4 dígitos" style="width:100%;background:#0d1a2e;border:1px solid #39516d;border-radius:12px;color:#fff;font-size:22px;padding:16px;box-sizing:border-box"><p id="dfTechPinError" style="color:#ff9b9b"></p><button type="submit" style="width:100%;padding:16px;background:#0c3b26;color:#9bf2b9;border:1px solid #22c55e;border-radius:12px;font-weight:700">ENTRAR</button></form>';
    document.body.appendChild(gate);
    gate.querySelector('#dfTechPinBack').onclick=()=>gate.remove();
    gate.querySelector('#dfTechPinForm').onsubmit=e=>{
      e.preventDefault();
      if(gate.querySelector('#dfTechPinInput').value!=='9273'){gate.querySelector('#dfTechPinError').textContent='Senha incorreta.';return}
      gate.remove();technicalEditor(f).catch(err=>alert('Falha ao abrir parâmetros: '+String(err?.message||err)));
    };
  }
  async function technicalCommercialReport(f,t,w){
    const srv=await calcSaved(f);
    if(!srv)throw Error('Não foi possível calcular a composição.');
    const rows=Array.isArray(f.rows)?f.rows:[],items=Array.isArray(srv.itens)?srv.itens:[];
    const lines=rows.map((r,i)=>{const m=mat(r.id)||r,it=items[i]||{};return '<tr><td>'+esc(m.nome||r.nome||'')+'</td><td>'+fm(r.pct||0,2)+'%</td><td>'+fm(it.kg||0,3)+'</td><td>'+money(m.preco??r.preco??0)+'</td><td>'+money(it.custo||0)+'</td></tr>'}).join('');
    const field=(label,value)=>String(value??'').trim()?'<div class="detail"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>':'';
    const temps=[...(t.zones||[]),...(t.components||[])].filter(x=>x.name&&x.temperature).map(x=>field(x.name,x.temperature+' °C')).join('');
    const hasTech=Boolean(t.density||t.mfi||temps);
    const technical=hasTech?'<h3>03 / PARÂMETROS TÉCNICOS</h3><div class="details">'+field('Densidade (g/cm³)',t.density)+field('MFI (g/10 min)',t.mfi)+temps+'</div>':'';
    const client=field('Razão social',t.legalName)+field('Nome fantasia',t.tradeName)+field('CNPJ',t.cnpj);
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório técnico — '+esc(f.nome||'Formulação')+'</title><style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{font:11px Arial,sans-serif;color:#182234;margin:0;background:#fff}.toolbar{display:flex;gap:10px;padding:12px;background:#f2f4f7}.toolbar button{padding:10px;border-radius:7px;border:1px solid #999;background:#fff;font-weight:bold}.page{max-width:190mm;margin:auto;padding:9px}header{border-bottom:2px solid #b08b3b;padding-bottom:10px}header small{color:#987526;letter-spacing:2px}h1{font-size:21px;margin:8px 0 3px}h2{font-size:17px;margin:12px 0}h3{font-size:12px;margin:17px 0 8px;color:#334155}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.detail{border-left:2px solid #b08b3b;padding:5px 8px;min-width:0;overflow-wrap:anywhere}.detail small{display:block;color:#64748b;font-size:9px;margin-bottom:3px}.detail strong{font-size:11px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.metrics>div{border:1px solid #d6dbe2;border-radius:6px;padding:9px}.metrics small{display:block;color:#64748b}.metrics b{font-size:15px}table{border-collapse:collapse;width:100%;font-size:10px}th,td{border:1px solid #cbd0d7;padding:6px 5px;text-align:right}th:first-child,td:first-child{text-align:left}th{background:#f1f3f5}.signature{text-align:center;margin:22px auto 0;max-width:350px;border-top:1px solid #444;padding-top:6px;font-size:10px}.confidential{font-size:9px;text-align:center;color:#596273;margin-top:12px}@media print{.toolbar{display:none}.page{padding:0}h3{break-after:avoid}tr{break-inside:avoid}}</style></head><body><div class="toolbar"><button onclick="history.back()">← VOLTAR</button><button onclick="window.print()">IMPRIMIR / SALVAR PDF</button></div><main class="page"><header><small>DF EXTRUSOR PRO • DOCUMENTAÇÃO TÉCNICA</small><h1>DF Manutenção e Consultoria</h1><div>Relatório técnico de composição e custos</div></header><h2>'+esc(f.nome||'Formulação')+'</h2><div class="details">'+client+field('Identificação do registro',f.id)+'</div><h3>01 / INDICADORES DA COMPOSIÇÃO</h3><div class="metrics"><div><small>Quantidade total</small><b>'+fm(f.total||0,2)+' kg</b></div><div><small>Custo da formulação</small><b>'+money(srv.custoTotal||0)+'</b></div><div><small>Custo final por kg</small><b>'+money(srv.custoKgFinal||0)+'</b></div></div><h3>02 / COMPOSIÇÃO DETALHADA</h3><table><thead><tr><th>Material</th><th>%</th><th>Kg</th><th>Preço/kg</th><th>Custo</th></tr></thead><tbody>'+lines+'</tbody></table>'+technical+'<div class="signature"><b>DAVID ALEX FERREIRA</b><div>Técnico responsável pelo desenvolvimento</div><div>DF Manutenção e Consultoria</div><div>Assinatura: ______________________________</div></div><div class="confidential">Documento confidencial. Uso exclusivo do cliente identificado, quando informado. Reprodução ou compartilhamento sujeitos à autorização da DF Manutenção e Consultoria.</div><div class="confidential">Gerado em '+esc(new Date().toLocaleString('pt-BR'))+'</div></main></body></html>';
    if(!w)throw Error('Permita a abertura de janelas para gerar o relatório.');
    w.document.open();w.document.write(html);w.document.close();
  }
  function technicalRows(list,type){
    return (list||[]).map((x,i)=>'<div class="dfTechRow" data-kind="'+type+'"><input aria-label="Nome" placeholder="Nome" value="'+esc(x.name||'')+'"><input aria-label="Temperatura" placeholder="°C" value="'+esc(x.temperature||'')+'"><button type="button" data-remove-tech="'+i+'">×</button></div>').join('');
  }
  async function technicalEditor(f,serverData){
    let data=serverData||{zones:[{name:'Zona 1',temperature:''},{name:'Zona 2',temperature:''},{name:'Zona 3',temperature:''}],components:[]};
    document.getElementById('dfTechShade')?.remove();
    const shade=document.createElement('div');shade.id='dfTechShade';shade.style.cssText='position:fixed;inset:0;background:#080b13;z-index:2147483646;display:block;padding:0;overflow:hidden';
    shade.innerHTML='<style>#dfTechShade *{box-sizing:border-box}#dfTechShade .dfTechPage{background:#080b13;color:#f3f6fc;width:100%;height:100dvh;overflow-y:auto;overscroll-behavior:contain;padding:calc(env(safe-area-inset-top,0px) + 18px) 16px calc(env(safe-area-inset-bottom,0px) + 28px);font:15px -apple-system,BlinkMacSystemFont,Arial,sans-serif}#dfTechShade .dfTechTop{position:sticky;top:0;z-index:2;background:#080b13;padding:10px 0 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #25364d;margin-bottom:20px}#dfTechShade .dfTechBack{background:#14243a;color:#ffcc63;border:1px solid #d89b13;border-radius:12px;padding:12px 14px;font-weight:700}#dfTechShade h2{font-size:21px;margin:0;line-height:1.25}#dfTechShade h3{font-size:19px;margin:25px 0 14px}#dfTechShade label{display:block;color:#cbd5e1;margin:15px 0 8px}#dfTechShade input{display:block;width:100%;background:#0c1729;color:#f5f8ff;border:1px solid #38506b;border-radius:12px;padding:14px;font-size:16px;margin:7px 0 0;min-height:52px}#dfTechShade .dfTechRow{display:grid;grid-template-columns:minmax(0,1fr) 105px 40px;gap:8px;align-items:center;margin:10px 0}#dfTechShade .dfTechRow input{margin:0;min-width:0}#dfTechShade button{cursor:pointer}#dfTechShade .dfTechRow button{height:50px;border-radius:10px;background:#341a20;color:#ffb4b4;border:1px solid #7c3030}#dfTechShade .dfTechAction{background:#122b22;border:1px solid #16a34a;border-radius:12px;color:#91f0b4;padding:14px;font-weight:700}#dfTechShade .dfTechSave{background:#0b4229;border:1px solid #22c55e;color:#9af5b9;flex:1}#dfTechShade .dfTechFooter{display:flex;gap:10px;margin:24px 0}#dfTechShade .dfTechFooter button{padding:15px;border-radius:12px;font-weight:700}#dfTechShade .dfTechClose{background:#18283c;color:#f5f8ff;border:1px solid #43536c}#dfTechShade .dfTechIntro{color:#9eafc5;font-size:13px;margin:0 0 22px}</style><section class="dfTechPage"><header class="dfTechTop"><button type="button" class="dfTechBack" id="dfTechBack">← VOLTAR</button><h2>🔒 PARÂMETROS TÉCNICOS</h2></header><h3>'+esc(f.nome||'')+'</h3><p class="dfTechIntro">Exclusivo do dono • salvo no servidor</p><label>Razão social<input id="dfTechLegal" value="'+esc(data.legalName||'')+'"></label><label>Nome fantasia<input id="dfTechTrade" value="'+esc(data.tradeName||'')+'"></label><label>CNPJ<input id="dfTechCnpj" value="'+esc(data.cnpj||'')+'" placeholder="00.000.000/0000-00"></label><label>Densidade (g/cm³)<input id="dfTechDensity" value="'+esc(data.density||'')+'"></label><label>MFI (g/10 min)<input id="dfTechMfi" value="'+esc(data.mfi||'')+'"></label><h3>Zonas de temperatura</h3><div id="dfTechZones">'+technicalRows(data.zones,'zones')+'</div><button type="button" class="dfTechAction" id="dfTechAddZone">+ ADICIONAR ZONA</button><h3>Componentes adicionais</h3><div id="dfTechComponents">'+technicalRows(data.components,'components')+'</div><button type="button" class="dfTechAction" id="dfTechAddComponent">+ ADICIONAR COMPONENTE</button><div class="dfTechFooter"><button type="button" class="dfTechSave" id="dfTechSave">GERAR RELATÓRIO</button><button type="button" class="dfTechClose" id="dfTechClose">FECHAR</button></div></section>';
    document.body.appendChild(shade);
    if(!serverData){try{const result=await technicalPost('/op/team/formulas/technical/get',f.id);if(result.technical){shade.remove();return technicalEditor(f,result.technical)}}catch(e){const warning=document.createElement('div');warning.style.cssText='padding:10px;border:1px solid #b45309;border-radius:8px;background:#fff7ed;color:#7c2d12;margin:10px 0';warning.textContent='Não foi possível consultar os dados privados: '+e.message+'. Verifique sua conexão e o acesso como dono. Não salve até a conexão ser restabelecida.';shade.querySelector('section').insertBefore(warning,shade.querySelector('section').children[2]);shade.querySelector('#dfTechSave').disabled=true;}}

    const bindRemove=()=>shade.querySelectorAll('[data-remove-tech]').forEach(b=>b.onclick=()=>b.parentElement.remove());
    bindRemove();
    shade.querySelector('#dfTechAddZone').onclick=()=>{const n=shade.querySelectorAll('#dfTechZones .dfTechRow').length+1;shade.querySelector('#dfTechZones').insertAdjacentHTML('beforeend',technicalRows([{name:'Zona '+n,temperature:''}],'zones'));bindRemove()};
    shade.querySelector('#dfTechAddComponent').onclick=()=>{shade.querySelector('#dfTechComponents').insertAdjacentHTML('beforeend',technicalRows([{name:'',temperature:''}],'components'));bindRemove()};
    shade.querySelector('#dfTechClose').onclick=()=>shade.remove();
    shade.querySelector('#dfTechBack').onclick=()=>shade.remove();
    shade.querySelector('#dfTechSave').onclick=async()=>{
      const val=id=>shade.querySelector('#'+id).value.trim();
      const rows=id=>[...shade.querySelectorAll('#'+id+' .dfTechRow')].map(e=>({name:e.querySelectorAll('input')[0].value.trim(),temperature:e.querySelectorAll('input')[1].value.trim()})).filter(x=>x.name);
      const payload={legalName:val('dfTechLegal'),tradeName:val('dfTechTrade'),cnpj:val('dfTechCnpj'),density:val('dfTechDensity'),mfi:val('dfTechMfi'),zones:rows('dfTechZones'),components:rows('dfTechComponents')};
      const reportWindow=window.open('','_blank');if(!reportWindow){alert('Permita pop-ups para gerar o relatório.');return;}reportWindow.document.write('<title>Gerando relatório...</title><p>Salvando parâmetros e preparando relatório...</p>');
      try{await technicalPost('/op/team/formulas/technical/save',f.id,payload);await technicalCommercialReport(f,payload,reportWindow);shade.remove()}catch(e){reportWindow.close();alert('Não foi possível gerar o relatório: '+e.message)}
    };
  }

  function addComp(){
    if(q('exComp'))return;
    const exL=q('exL');if(!exL)return;
    const box=exL.closest('div');if(!box||!box.parentNode)return;
    const div=document.createElement('div');
    div.innerHTML='<label>Comprimento final / saco (cm)</label><input id="exComp" class="main" inputmode="decimal" placeholder="Ex.: 105"><div class="smallNote">Usado somente para puxar o tamanho final na OP. Não entra na conta de g/m.</div>';
    box.parentNode.insertBefore(div,box.nextSibling);
  }

  function getExtrusaoOP(){
    return{
      largura:pn(q('exL')?.value),
      comprimento:pn(q('exComp')?.value),
      micra:pn(q('exM')?.value),
      grama:typeof window.pesoMetroIdeal==='function'?Number(window.pesoMetroIdeal())||0:0
    };
  }

  function info(){
    const b=q('foSavedInfo'),f=selected();if(!b)return;
    if(!f){b.innerHTML='Selecione uma formulação salva.';return;}
    b.innerHTML='<b>'+esc(f.nome||'Formulação')+'</b><br>'+fm(f.total||0,2)+' kg • '+((f.rows||[]).length)+' materiais • '+money(f.custo||0);
  }

  function render(){
    const b=q('foSaved'),a=load();if(!b)return;
    if(!a.length){b.innerHTML='<div class="formNote">Nenhuma formulação salva ainda.</div>';return;}
    const current=q('foSavedSelect')?.value;
    const opts=a.map((f,i)=>'<option value="'+esc(f.id)+'" '+((current&&String(current)===String(f.id))||(!current&&i===0)?'selected':'')+'>'+esc(f.nome||'Formulação')+' — '+fm(f.total||0,2)+' kg</option>').join('');
    b.innerHTML='<div class="formRow"><label>Formulação salva</label><select id="foSavedSelect">'+opts+'</select><div id="foSavedInfo" class="formNote"></div><div class="savedBtns" style="grid-template-columns:repeat(4,minmax(0,1fr))"><button class="miniBtn" data-fosafe="technical">🔒 TÉCNICOS</button><button class="miniBtn" data-fosafe="pdf">PDF</button><button class="miniBtn" data-fosafe="op">OP</button><button class="delBtn" data-fosafe="del">EXCLUIR</button></div></div>';
    b.querySelectorAll('.savedBtns button').forEach(btn=>{btn.style.cssText='min-width:0;width:100%;box-sizing:border-box;white-space:normal;overflow-wrap:anywhere;word-break:normal;font-size:clamp(9px,2.5vw,12px);line-height:1.2;padding:12px 3px;text-align:center;min-height:54px'});
    q('foSavedSelect')?.addEventListener('change',info);info();
  }

  async function calcSaved(f){
    if(!f||typeof window.dfCalc!=='function')return null;
    const rows=(f.rows||[]).map(r=>({pct:Number(r.pct)||0,precoKg:Number((mat(r.id)||r).preco||r.preco)||0}));
    try{return await window.dfCalc('formulacao',{totalKg:Number(f.total)||0,rows});}catch(e){console.error(e);return null;}
  }

  async function saveFormulaSafe(){
    const nome=(q('foNome')?.value||'').trim()||'Formulação';
    const total=pn(q('foTotal')?.value);
    const rows=(typeof window.getFoRows==='function'?window.getFoRows():[]).filter(r=>r.id&&Number(r.pct)>0);
    if(!total){alert('Digite quantos kg quer fazer.');return;}
    if(!rows.length){alert('Escolha pelo menos 1 material.');return;}
    const tmp={total,rows};
    const srv=await calcSaved(tmp);if(!srv){alert('Não foi possível calcular a formulação no servidor.');return;}
    const d=Number(srv.diferencaPara100)||0;
    if(Math.abs(d)>0.05&&!confirm('A formulação não fechou 100%. Salvar mesmo assim?'))return;
    const rec={id:Date.now(),nome,total,rows,custo:Number(srv.custoTotal)||0,custoKg:Number(srv.custoKgFinal)||0,op:getExtrusaoOP(),criado:new Date().toISOString()};
    const a=load();a.unshift(rec);save(a);alert('Formulação salva.');
  }

  async function pdf(f){
    if(!f)return;
    const srv=await calcSaved(f);if(!srv){alert('Não foi possível gerar o PDF.');return;}
    const total=Number(f.total)||0,rows=f.rows||[],items=Array.isArray(srv.itens)?srv.itens:[];
    let trs='';
    rows.forEach((r,i)=>{const m=mat(r.id)||r,it=items[i]||{};trs+='<tr><td>'+esc(m.nome||r.nome||'')+'</td><td>'+fm(r.pct||0,2)+'%</td><td>'+fm(it.kg||0,3)+' kg</td><td>'+money(m.preco||r.preco||0)+'</td><td>'+money(it.custo||0)+'</td></tr>';});
    if(!trs)trs='<tr><td colspan="5">Sem materiais.</td></tr>';
    let html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Formulação '+esc(f.nome||'')+'</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h1{margin:0 0 4px}.top{border-bottom:3px solid #111;padding-bottom:12px}.box{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.kpi{border:1px solid #ddd;border-radius:10px;padding:10px}.kpi span{display:block;color:#555;font-size:12px}.kpi b{font-size:17px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ccc;padding:10px;text-align:left;font-size:13px}th{background:#eee}.foot{margin-top:26px;color:#666;font-size:12px}@media print{body{margin:18px}}</style></head><body><div class="top"><h1>DF Manutenção e Consultoria</h1><div>Relatório de Formulação</div></div><h2>'+esc(f.nome||'Formulação')+'</h2><div class="box"><div class="kpi"><span>Quantidade total</span><b>'+fm(total,3)+' kg</b></div><div class="kpi"><span>Total da porcentagem</span><b>'+fm(srv.totalPct||0,2)+'%</b></div><div class="kpi"><span>Custo total</span><b>'+money(srv.custoTotal||0)+'</b></div><div class="kpi"><span>Custo por kg final</span><b>'+money(srv.custoKgFinal||0)+'</b></div></div><table><thead><tr><th>Material</th><th>%</th><th>Kg</th><th>Valor/kg</th><th>Custo</th></tr></thead><tbody>'+trs+'</tbody></table><div class="foot">Gerado em '+esc(new Date().toLocaleString('pt-BR'))+' • DF EXTRUSOR PRO</div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';

    if(technicalOwner()&&technicalTeam()?.teamId){
      try{
        const j=await technicalPost('/op/team/formulas/technical/get',f.id);
        const t=j.technical;
        if(t){
          const has=[t.legalName,t.tradeName,t.cnpj,t.density,t.mfi,...(t.zones||[]).map(x=>x.temperature),...(t.components||[]).map(x=>x.temperature)].some(Boolean);
          if(has){
            const line=(k,v)=>v?'<div><b>'+k+':</b> '+esc(v)+'</div>':'';
            const temps=[...(t.zones||[]),...(t.components||[])].filter(x=>x.name&&x.temperature).map(x=>'<span style="display:inline-block;margin:3px 9px 3px 0">'+esc(x.name)+': <b>'+esc(x.temperature)+' °C</b></span>').join('');
            const detail='<section style="margin-top:12px;border-top:1px solid #ccc;padding-top:8px"><b>FICHA TÉCNICA / CLIENTE</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:11px">'+line('Razão social',t.legalName)+line('Nome fantasia',t.tradeName)+line('CNPJ',t.cnpj)+line('Densidade',t.density? t.density+' g/cm³':'')+line('MFI',t.mfi?t.mfi+' g/10 min':'')+'</div><div style="font-size:11px">'+temps+'</div></section>';
            const footer='<div style="margin-top:16px;text-align:center;font-size:10px;border-top:1px solid #aaa;padding-top:8px"><b>DAVID ALEX FERREIRA</b> — Técnico responsável pelo desenvolvimento<br>DF Manutenção e Consultoria<br><span style="font-size:9px">Documento confidencial, destinado exclusivamente ao cliente identificado.</span></div>';
            html=html.replace('<div class="foot">',detail+footer+'<div class="foot">').replace('body{font-family:Arial','@page{size:A4 portrait;margin:10mm}body{font-family:Arial').replace('th,td{border:1px solid #ccc;padding:10px','th,td{border:1px solid #ccc;padding:5px').replace('body{margin:28px}','body{margin:10px}');
          }
        }
      }catch(e){alert('Não foi possível consultar os dados técnicos privados. O PDF normal será gerado. '+e.message)}
    }
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela do PDF. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  function op(f){
    if(!f){alert('Formulação não encontrada.');return;}
    const nome=f.nome||'Formulação',total=Number(f.total)||0,rows=f.rows||[];
    const atual=getExtrusaoOP(),dados=f.op||{};
    const largura=Number(dados.largura||atual.largura)||0;
    const comprimento=Number(dados.comprimento||atual.comprimento)||0;
    const micra=Number(dados.micra||atual.micra)||0;
    const grama=Number(dados.grama||atual.grama)||0;
    const hoje=new Date().toLocaleDateString('pt-BR');
    const dupla=micra?fm(micra/100,2)+' mc':'_____';
    const parede=micra?fm(micra/200,2)+' mc':'_____';
    const gram=grama?fm(grama,1)+' g/m':'_____';
    const lb=largura?fm(largura,1).replace(',0','')+' CM':'_____ CM';
    const tamanho=largura&&comprimento&&micra?fm(largura,0)+' X '+fm(comprimento,0)+' X '+fm(micra/1000,3)+' mc':'';
    const letras=['A','B','C','D','E','F','G','H'];
    let matRows='';for(let i=0;i<8;i++){const r=rows[i]||{},m=r.id?(mat(r.id)||r):{},desc=m.nome||r.nome||'',pct=Number(r.pct)||0;matRows+='<tr class="'+((desc||pct)?'matFilled':'')+'"><td class="center b">'+letras[i]+'</td><td>'+esc(desc)+'</td><td class="center b">'+(pct?fm(pct,2)+'%':'')+'</td></tr>';}
    let prodRows='';for(let i=0;i<8;i++)prodRows+='<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>OP '+esc(nome)+'</title><style>@page{size:A4 landscape;margin:6mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:11.5px;background:#fff}.page{border:2px solid #111;padding:6px}.op{width:100%;border-collapse:collapse;table-layout:fixed}.op td,.op th{border:1px solid #333;padding:4px 5px;vertical-align:middle}.center{text-align:center}.b{font-weight:700}.logo{font-size:16px;font-weight:900;letter-spacing:.4px}.title{background:#111827!important;color:#fff!important;text-align:center;font-weight:900;letter-spacing:.4px}.hl{background:#fff200!important;font-weight:900}.hl2{background:#eaf3ff!important;font-weight:900}.hl3{background:#eaffea!important;font-weight:900}.top td{height:21px}.big{font-size:15px}.xbig{font-size:18px}.mat th{background:#111827!important;color:#fff!important}.mat td{height:22px}.matFilled td{background:#fffbe6!important;font-weight:700}.prod th{background:#e5e7eb!important;font-size:10px}.prod td{height:23px}.codes td{font-size:10.5px;background:#fafafa}.sectionGap{height:6px;border:0}.printHint{margin:0 0 6px;color:#555;font-size:11px}.obs{height:34px}.stamp{float:right;border:1px solid #333;border-radius:8px;padding:5px 12px;font-weight:900;background:#fff200}.miniTitle{font-size:10px;color:#333;font-weight:700;text-transform:uppercase}.value{font-size:14px;font-weight:900}@media print{body{margin:0}.printHint{display:none}.page{border:0;padding:0}}</style></head><body><div class="printHint">OP pronta para imprimir. Escolha salvar como PDF ou imprimir.</div><div class="page">'+
      '<table class="op top"><tr><td colspan="5" class="logo">FERREIRA EMBALAGENS</td><td class="title" colspan="2">ORDEM DE PRODUÇÃO</td><td class="b">Data emissão:</td><td class="hl center">'+esc(hoje)+'</td></tr><tr><td colspan="3" class="hl"><span class="miniTitle">Cliente / Formulação</span><br><span class="xbig">'+esc(nome)+'</span></td><td>UF:</td><td colspan="2" class="title">FASE 1: EXTRUSÃO</td><td class="b center">OS:</td><td colspan="2"></td></tr><tr><td colspan="3" class="hl2"><span class="miniTitle">Tamanho final</span><br><span class="value">'+esc(tamanho||'_____')+'</span></td><td colspan="3">cod de barra</td><td colspan="3" class="b">PREVISÃO ENTREGA:</td></tr><tr><td colspan="3" class="hl3"><span class="miniTitle">Peso líquido</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3" class="hl3"><span class="miniTitle">Peso bruto</span><br><span class="value">'+fm(total,0)+' KG</span></td><td colspan="3">Total (FD):</td></tr></table><div class="sectionGap"></div><table class="op"><tr><td class="b center" style="width:7%">CP:</td><td colspan="8" class="hl"><span class="miniTitle">Descrição do produto</span><br><span class="big">'+esc(nome)+'</span></td></tr><tr><td colspan="3" class="hl2"><span class="miniTitle">Espessura de extrusão dupla</span><br><b>'+dupla+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Espessura por parede</span><br><b>'+parede+'</b></td><td colspan="3" class="hl2"><span class="miniTitle">Gramatura</span><br><b>'+gram+'</b></td></tr><tr><td colspan="3" class="hl3"><span class="miniTitle">Largura da bobina</span><br><b>'+lb+'</b></td><td colspan="3" class="hl3"><span class="miniTitle">Largura do balão</span><br><b>'+lb+'</b></td><td colspan="3"></td></tr><tr><td colspan="9" class="obs"><span class="miniTitle">Observações importantes</span><br></td></tr></table><div class="sectionGap"></div><table class="op mat"><tr><th style="width:7%">MATERIAL</th><th>DESCRIÇÃO DA MATÉRIA-PRIMA</th><th style="width:10%">%</th></tr>'+matRows+'</table><div class="sectionGap"></div><table class="op prod"><tr><th>Data</th><th>Operador</th><th>Máquina</th><th>Aparas kg</th><th>Quantidade kg</th><th>Cód. parada</th><th>Início parada</th><th>Final parada</th><th>Início produção</th><th>Final produção</th><th>Nº bobinas</th></tr>'+prodRows+'</table><table class="op codes"><tr><td>01- troca de TELA</td><td>02-acerto</td><td>03-M.mecânica</td><td>04-falta de energia</td><td>05-material molhado</td><td>06-teste</td></tr><tr><td>07-M.elétrica</td><td>08-limpeza da borda</td><td>09-troca de tela</td><td>10-outros</td><td colspan="2"><span class="stamp">DF EXTRUSOR PRO</span></td></tr></table></div><script>setTimeout(function(){window.focus();window.print()},450)<\/script></body></html>';
    const w=window.open('','_blank');if(!w){alert('O navegador bloqueou a janela da OP. Libere pop-up.');return;}w.document.open();w.document.write(html);w.document.close();
  }

  // Captura o toque antes dos handlers globais de formulação no iOS.
  window.addEventListener('click',function(ev){
    const btn=ev.target?.closest?.('[data-fosafe="technical"]');
    if(!btn)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();
    if(!f){alert('Selecione uma formulação salva.');return;}
    technicalPinGate(f);
  },true);

  document.addEventListener('click',function(ev){
    if(ev.target?.id==='foSave'){
      ev.preventDefault();ev.stopImmediatePropagation();saveFormulaSafe();return;
    }
    const act=ev.target?.dataset?.fosafe;if(!act)return;
    ev.preventDefault();ev.stopImmediatePropagation();
    const f=selected();if(!f){alert('Selecione uma formulação.');return;}
    if(act==='technical'){technicalPinGate(f);return;}
    if(act==='open'){if(window.abrirFormula)window.abrirFormula(f,false);return;}
    if(act==='pdf'){pdf(f);return;}
    if(act==='op'){op(f);return;}
    if(act==='dup'){const a=load(),cp=JSON.parse(JSON.stringify(f));cp.id=Date.now();cp.nome=(f.nome||'Formulação')+' cópia';cp.criado=new Date().toISOString();a.unshift(cp);save(a);return;}
    if(act==='del'){if(!confirm('Excluir esta formulação?'))return;save(load().filter(x=>String(x.id)!==String(f.id)));}
  },true);

  function force(){window.renderForms=render;window.salvarFormula=saveFormulaSafe;window.getExtrusaoOP=getExtrusaoOP;window.printFormulaOp=op;addComp();render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(force,250));else setTimeout(force,250);
  [600,1200,2200].forEach(t=>setTimeout(force,t));
  document.addEventListener('click',()=>setTimeout(()=>{if(q('foSaved')&&!q('foSavedSelect'))force();},120),true);
})();
