(function(){
  'use strict';
  const REG_KEY='df_op_qr_registry_v1';
  const nativeOpen=window.open.bind(window);

  function pn(v){let s=String(v||'').trim().replace(/\s/g,'');if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:0}
  function loadReg(){try{return JSON.parse(localStorage.getItem(REG_KEY)||'{}')}catch(e){return{}}}
  function saveReg(r){try{localStorage.setItem(REG_KEY,JSON.stringify(r))}catch(e){}}
  function makeId(){const d=new Date(),p=n=>String(n).padStart(2,'0');return 'DFOP-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
  function parseExpected(html){
    try{
      const doc=new DOMParser().parseFromString(html,'text/html');
      const text=(doc.body?.innerText||'').replace(/\s+/g,' ').trim();
      const title=(doc.querySelector('title')?.textContent||'').replace(/^OP\s*/i,'').trim();
      const grab=re=>{const m=text.match(re);return m?String(m[1]||'').trim():''};
      let micra=pn(grab(/Espessura de extrus[aã]o dupla\s*([0-9.,]+)/i));if(micra>0&&micra<2)micra*=1000;
      const materials=[];
      doc.querySelectorAll('table.mat tr').forEach(tr=>{const td=Array.from(tr.querySelectorAll('td'));if(td.length>=3){const name=(td[1]?.textContent||'').trim(),pct=pn(td[2]?.textContent||'');if(name&&pct>0)materials.push({name,pct})}});
      return{
        title:title||grab(/Cliente\s*\/\s*Formula[cç][aã]o\s*([^U]{2,80}?)(?:UF:|FASE)/i)||'',
        date:grab(/Data emiss[aã]o:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i),
        totalKg:pn(grab(/Peso l[ií]quido(?:\s*\/\s*produ[cç][aã]o)?\s*([0-9.,]+)\s*KG/i)),
        largura:pn(grab(/Largura da bobina\s*([0-9.,]+)/i)),
        micra,
        gm:pn(grab(/Gramatura\s*([0-9.,]+)/i)),
        materials,
        text:text.slice(0,12000)
      };
    }catch(e){return{}}
  }
  function register(id,expected){const r=loadReg();r[id]={id,createdAt:new Date().toISOString(),expected:expected||{}};const keys=Object.keys(r).sort((a,b)=>String(r[b]?.createdAt||'').localeCompare(String(r[a]?.createdAt||'')));keys.slice(500).forEach(k=>delete r[k]);saveReg(r);try{window.dispatchEvent(new CustomEvent('df-op-qr-created',{detail:r[id]}))}catch(e){}}

  function inject(html){
    if(typeof html!=='string'||!/ORDEM\s+DE\s+PRODU(?:Ç|C)[AÃ]O/i.test(html))return html;
    const id=makeId(),expected=parseExpected(html);register(id,expected);
    const makeCell=span=>'<td colspan="'+(span||3)+'" class="dfQrCell"><div class="dfQrWrap"><div id="dfQrCode"></div><div><b>QR DA OP</b><small>'+id+'</small></div></div></td>';
    let out=html;
    const codeCell=/<td\b([^>]*)>\s*(?:c[oó]d(?:igo|\.)?\s*(?:de\s*)?barra)\s*<\/td>/i;
    out=out.replace(codeCell,function(_m,attrs){const cm=String(attrs||'').match(/colspan\s*=\s*["']?(\d+)/i);return makeCell(cm?cm[1]:3)});
    if(out===html){
      const loose=/<td\b([^>]*)>[\s\S]{0,100}?(?:c[oó]d(?:igo|\.)?\s*(?:de\s*)?barra)[\s\S]{0,100}?<\/td>/i;
      out=out.replace(loose,function(_m,attrs){const cm=String(attrs||'').match(/colspan\s*=\s*["']?(\d+)/i);return makeCell(cm?cm[1]:3)});
    }
    if(out===html){
      const delivery=/<td\b([^>]*)>\s*PREVIS[AÃ]O\s+ENTREGA:\s*<\/td>/i;
      out=out.replace(delivery,function(m){return makeCell(3)+m});
    }
    if(out===html)return html;
    const css='<style>.dfQrCell{padding:2px 5px!important}.dfQrWrap{display:flex;align-items:center;justify-content:center;gap:7px;min-height:52px}.dfQrWrap #dfQrCode{width:56px;height:56px;display:grid;place-items:center;background:#fff}.dfQrWrap canvas,.dfQrWrap img{width:56px!important;height:56px!important}.dfQrWrap b{font-size:8px;display:block;color:#111}.dfQrWrap small{font-size:5.6px;display:block;max-width:100px;word-break:break-all;line-height:1.1;color:#111}</style>';
    const lib='<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>';
    out=out.replace('</head>',css+lib+'</head>');
    const boot='<script>(function(){var id='+JSON.stringify(id)+';function q(){try{var e=document.getElementById("dfQrCode");if(e&&window.QRCode&&!e.dataset.ok){e.dataset.ok="1";new QRCode(e,{text:id,width:112,height:112,correctLevel:QRCode.CorrectLevel.H})}}catch(x){}}var n=0,t=setInterval(function(){q();if(++n>35)clearInterval(t)},100);q()})();<\/script>';
    out=out.replace('</body>',boot+'</body>');
    out=out.replace(/setTimeout\(function\(\)\{window\.focus\(\);window\.print\(\)\},(?:450|500|600)\)/g,'setTimeout(function(){window.focus();window.print()},2600)');
    return out;
  }

  window.open=function(){
    const real=nativeOpen.apply(window,arguments);if(!real)return real;
    try{
      const docProxy=new Proxy({}, {
        get(_t,p){const d=real.document;if(p==='write')return function(){const a=Array.from(arguments);if(a.length)a[0]=inject(a[0]);return d.write.apply(d,a)};const v=d[p];return typeof v==='function'?v.bind(d):v},
        set(_t,p,v){real.document[p]=v;return true}
      });
      return new Proxy(real,{get(t,p){if(p==='document')return docProxy;const v=t[p];return typeof v==='function'?v.bind(t):v},set(t,p,v){t[p]=v;return true}});
    }catch(e){return real}
  };

  window.DF_OP_QR_REGISTRY={load:loadReg};
})();
