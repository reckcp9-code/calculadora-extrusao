(function(){
  'use strict';
  if(window.DFUiConsistencyV1)return;
  window.DFUiConsistencyV1=true;

  function cleanNumberText(value){
    return String(value??'')
      .replace(/R\$/gi,'')
      .replace(/\s+/g,'')
      .replace(/[^0-9.,+\-]/g,'');
  }

  function parsePtNumber(value){
    let s=cleanNumberText(value);
    if(!s||s==='+'||s==='-')return 0;

    let sign='';
    if(s[0]==='+'||s[0]==='-'){sign=s[0];s=s.slice(1)}
    s=s.replace(/[+\-]/g,'');
    if(!s)return 0;

    if(s.includes(',')){
      const comma=s.lastIndexOf(',');
      const intPart=s.slice(0,comma).replace(/[.,]/g,'');
      const fracPart=s.slice(comma+1).replace(/[.,]/g,'');
      s=(intPart||'0')+(fracPart?'.'+fracPart:'');
    }else{
      const dots=(s.match(/\./g)||[]).length;
      if(dots===1){
        const parts=s.split('.');
        const a=(parts[0]||'0').replace(/\D/g,'');
        const b=(parts[1]||'').replace(/\D/g,'');
        if(a==='0'||b.length<=2){
          s=(a||'0')+(b?'.'+b:'');
        }else if(b.length===3){
          s=(a+b)||'0';
        }else{
          s=(a||'0')+(b?'.'+b:'');
        }
      }else if(dots>1){
        const parts=s.split('.');
        const last=parts[parts.length-1].replace(/\D/g,'');
        const looksGrouped=parts.slice(1).every(p=>/^\d{3}$/.test(p));
        if(looksGrouped){
          s=parts.join('').replace(/\D/g,'');
        }else if(last.length>0&&last.length<=2){
          const intPart=parts.slice(0,-1).join('').replace(/\D/g,'');
          s=(intPart||'0')+'.'+last;
        }else{
          s=parts.join('').replace(/\D/g,'');
        }
      }else{
        s=s.replace(/\D/g,'');
      }
    }

    const n=Number((sign==='-'?'-':'')+s);
    return Number.isFinite(n)?n:0;
  }

  window.DFParsePtNumber=parsePtNumber;

  function labelText(el){
    try{
      if(el.labels&&el.labels.length)return Array.from(el.labels).map(x=>x.textContent||'').join(' ');
      const p=el.closest('div,section,article,label');
      const l=p&&p.querySelector? p.querySelector('label'):null;
      return l?l.textContent||'':'';
    }catch(e){return''}
  }

  function numericField(el){
    return !!(el&&el.tagName==='INPUT'&&
      el.type!=='number'&&
      /^(decimal|numeric)$/.test(String(el.getAttribute('inputmode')||'').toLowerCase()));
  }

  function skipNumberFormat(el){
    const ctx=((el.id||'')+' '+(el.name||'')+' '+labelText(el)).toLocaleLowerCase('pt-BR');
    return /(?:c[oó]d(?:igo)?|qr|telefone|whats|celular|cpf|cnpj|cep|licen[cç]a|senha|password|\bpin\b|chave|token)/i.test(ctx);
  }

  function groupDigits(s){
    s=String(s||'').replace(/^0+(?=\d)/,'');
    if(!s)return'0';
    return s.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  }

  function formatNumericValue(el){
    if(!numericField(el)||skipNumberFormat(el))return;
    if(el.closest&&el.closest('#dfCostFabrilV273'))return;

    let raw=cleanNumberText(el.value);
    if(!raw||raw==='+'||raw==='-')return;

    let sign='';
    if(raw[0]==='+'||raw[0]==='-'){sign=raw[0];raw=raw.slice(1)}
    raw=raw.replace(/[+\-]/g,'');

    const mode=String(el.getAttribute('inputmode')||'decimal').toLowerCase();
    let intDigits='',frac='',hasDecimal=false;

    if(mode==='numeric'){
      intDigits=raw.replace(/\D/g,'');
    }else if(raw.includes(',')){
      const i=raw.lastIndexOf(',');
      intDigits=raw.slice(0,i).replace(/\D/g,'');
      frac=raw.slice(i+1).replace(/\D/g,'').slice(0,6);
      hasDecimal=true;
    }else{
      const dots=(raw.match(/\./g)||[]).length;
      if(dots===1){
        const p=raw.split('.');
        const a=(p[0]||'').replace(/\D/g,'');
        const b=(p[1]||'').replace(/\D/g,'').slice(0,6);
        const decimal=raw.endsWith('.')||a==='0'||b.length<=2;
        if(decimal){intDigits=a;frac=b;hasDecimal=true}
        else intDigits=a+b;
      }else if(dots>1){
        const parts=raw.split('.');
        const last=(parts.pop()||'').replace(/\D/g,'').slice(0,6);
        const looksGrouped=parts.concat(last).slice(1).every(x=>/^\d{3}$/.test(x));
        if(looksGrouped){
          intDigits=raw.replace(/\D/g,'');
        }else if(last.length<=2){
          intDigits=parts.join('').replace(/\D/g,'');
          frac=last;hasDecimal=true;
        }else intDigits=raw.replace(/\D/g,'');
      }else intDigits=raw.replace(/\D/g,'');
    }

    if(!intDigits)intDigits='0';
    let next=sign+groupDigits(intDigits);
    if(hasDecimal)next+=','+frac;

    if(el.value!==next){
      const atEnd=document.activeElement===el;
      el.value=next;
      if(atEnd){
        try{el.setSelectionRange(next.length,next.length)}catch(e){}
      }
    }
  }

  function textField(el){
    if(!el)return false;
    if(el.isContentEditable)return true;
    if(el.tagName==='TEXTAREA')return true;
    if(el.tagName!=='INPUT')return false;
    const type=String(el.type||'text').toLowerCase();
    if(['password','email','url','number','date','time','month','week','datetime-local','file','checkbox','radio','range','color','hidden'].includes(type))return false;
    if(numericField(el))return false;
    return true;
  }

  function uppercaseField(el){
    if(!textField(el)||el.hasAttribute('data-df-preserve-case'))return;
    if(el.isContentEditable){
      const t=el.textContent||'',u=t.toLocaleUpperCase('pt-BR');
      if(t!==u)el.textContent=u;
      return;
    }
    const v=String(el.value||''),u=v.toLocaleUpperCase('pt-BR');
    if(v===u)return;
    const start=el.selectionStart,end=el.selectionEnd;
    el.value=u;
    try{if(start!=null&&end!=null)el.setSelectionRange(start,end)}catch(e){}
  }

  function addStyle(){
    if(document.getElementById('dfUiConsistencyV1Style'))return;
    const st=document.createElement('style');
    st.id='dfUiConsistencyV1Style';
    st.textContent=`
      html,body{max-width:100%!important;overflow-x:hidden!important;overscroll-behavior-x:none}
      #appContent,.w{width:100%!important;max-width:760px!important;margin-left:auto!important;margin-right:auto!important}
      .page,.page.on,#pgEx,#pgSa,#pgCu,#pgFo{width:100%!important;max-width:100%!important;margin-left:auto!important;margin-right:auto!important;overflow-x:clip!important}
      .page>*,
      .card,.formRow,.savedItem,.result,.kpi,
      .dfMatMgr,.dfMatPanel,.dfMatItem,.dfMatEditor,
      #dfCostSimpleV154,#dfCostFabrilV273,#dfFormulaCore,#dfFormulaOps,
      .dfOpsCard,.dfOpsHero,.df-fp-box,.df-mp-box,.dfOpModalBox{
        max-width:100%!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }
      .grid>*,
      .cfGrid>*,.cfPair>*,
      .dfMatSummary>*,.dfMatEditor>*{min-width:0!important}
      input,select,textarea,button{max-width:100%!important;min-width:0}
      img,video,canvas{max-width:100%!important}
      table{max-width:100%}
      .tabs,#dfCostNavV273,#dfFormulaSubnav,.dfOpsTabs,.production-nav{
        width:100%!important;
        max-width:100%!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }
      .dfMatPanel,.df-fp-box,.df-mp-box,.dfOpModalBox,.licenseBox{left:auto!important;right:auto!important}
      input:not([type=password]):not([type=email]):not([type=url]):not([inputmode=decimal]):not([inputmode=numeric]),
      textarea{ text-transform:uppercase }
    `;
    document.head.appendChild(st);
  }

  function resetHorizontal(){
    try{document.documentElement.scrollLeft=0}catch(e){}
    try{document.body.scrollLeft=0}catch(e){}
  }

  document.addEventListener('input',function(e){
    const el=e.target;
    if(numericField(el)){
      formatNumericValue(el);
      return;
    }
    uppercaseField(el);
  },true);

  document.addEventListener('change',function(e){
    const el=e.target;
    if(numericField(el))formatNumericValue(el);
    else uppercaseField(el);
  },true);

  document.addEventListener('focusin',function(e){
    const el=e.target;
    if(textField(el)){
      try{el.setAttribute('autocapitalize','characters')}catch(_){}
    }
  },true);

  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('.tab,#dfCostNavV273 button,#dfFormulaSubnav button,.dfOpsTabs button,.dfMatMgrBtn,.dfMatClose')){
      setTimeout(resetHorizontal,0);
      setTimeout(resetHorizontal,80);
    }
  },true);

  function boot(){
    addStyle();
    resetHorizontal();
    document.querySelectorAll('input[inputmode="decimal"],input[inputmode="numeric"]').forEach(formatNumericValue);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('df-ui-ready',()=>setTimeout(boot,40));
  window.addEventListener('pageshow',()=>setTimeout(resetHorizontal,40));
})();