(function(){
  'use strict';
  if(window.DFOPLandscapePdf)return;

  const nativeOpen=window.open.bind(window);
  const PAGE_W=841.89;
  const PAGE_H=595.28;
  const MARGIN=18;
  const WIDTH=PAGE_W-(MARGIN*2);

  function clean(value){
    return String(value??'')
      .replace(/[\u2010-\u2015]/g,'-')
      .replace(/[\u2018\u2019]/g,"'")
      .replace(/[\u201c\u201d]/g,'"')
      .replace(/\s+/g,' ')
      .trim();
  }

  function latin(value){
    return clean(value).replace(/[^\x00-\xff]/g,function(ch){
      if(ch==='•')return '-';
      return '?';
    });
  }

  function esc(value){
    return latin(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  }

  function bytes(value){
    const out=new Uint8Array(value.length);
    for(let i=0;i<value.length;i++)out[i]=value.charCodeAt(i)&255;
    return out;
  }

  function makePdf(stream,title){
    stream=latin(stream);
    const objects=[];
    objects[1]='<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>';
    objects[2]='<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    objects[3]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+PAGE_W+' '+PAGE_H+'] /CropBox [0 0 '+PAGE_W+' '+PAGE_H+'] /Rotate 0 /Resources << /ProcSet [/PDF /Text] /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>';
    objects[4]='<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream';
    objects[5]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[6]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objects[7]='<< /Title ('+esc(title||'Ordem de Producao')+') /Creator (DF EXTRUSOR PRO) >>';

    let pdf='%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
    const offsets=[0];
    for(let i=1;i<objects.length;i++){
      offsets[i]=pdf.length;
      pdf+=i+' 0 obj\n'+objects[i]+'\nendobj\n';
    }
    const xref=pdf.length;
    pdf+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
    for(let i=1;i<objects.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    pdf+='trailer\n<< /Size '+objects.length+' /Root 1 0 R /Info 7 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
    return bytes(pdf);
  }

  function create(data){
    data=data||{};
    const ops=[];
    let y=PAGE_H-MARGIN;

    function rect(x,top,w,h,fill,strong){
      const bottom=top-h;
      if(strong)ops.push('1.35 w');
      if(Array.isArray(fill))ops.push(fill.join(' ')+' rg '+x.toFixed(2)+' '+bottom.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2)+' re B 0 0 0 rg');
      else if(fill!==undefined)ops.push(fill+' g '+x.toFixed(2)+' '+bottom.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2)+' re B 0 g');
      else ops.push(x.toFixed(2)+' '+bottom.toFixed(2)+' '+w.toFixed(2)+' '+h.toFixed(2)+' re S');
      if(strong)ops.push('.72 w');
    }

    function fit(value,w,size){
      const s=latin(value);
      const max=Math.max(1,Math.floor((w-6)/(size*.52)));
      return s.length>max?s.slice(0,Math.max(1,max-1))+'...':s;
    }

    function text(value,x,baseline,w,size,bold,align){
      value=fit(value,w,size);
      let tx=x+3;
      if(align==='center')tx=x+Math.max(3,(w-(value.length*size*.5))/2);
      else if(align==='right')tx=x+Math.max(3,w-3-(value.length*size*.5));
      ops.push('BT 0 g /'+(bold?'F2':'F1')+' '+size.toFixed(2)+' Tf '+tx.toFixed(2)+' '+baseline.toFixed(2)+' Td ('+esc(value)+') Tj ET');
    }

    function cell(x,top,w,h,content,options){
      options=options||{};
      rect(x,top,w,h,options.fill,options.strong);
      const lines=Array.isArray(content)?content:[{text:content,size:options.size||8,bold:options.bold}];
      if(lines.length===1){
        const line=lines[0]||{};
        const size=line.size||options.size||8;
        text(line.text||'',x,top-h+(h-size)/2+1,w,size,!!line.bold,options.align||line.align);
      }else{
        const first=lines[0]||{},second=lines[1]||{};
        text(first.text||'',x,top-6.4,w,first.size||5.8,!!first.bold,options.align||first.align);
        text(second.text||'',x,top-h+2.2,w,second.size||8.8,second.bold!==false,options.align||second.align);
      }
    }

    function spanRow(cells,h,cols){
      cols=cols||9;
      const unit=WIDTH/cols;
      let x=MARGIN;
      cells.forEach(function(c){
        const w=unit*(c.span||1);
        cell(x,y,w,h,c.lines!==undefined?c.lines:c.text,c);
        x+=w;
      });
      y-=h;
    }

    ops.push('0.72 w 0 G 0 g');

    spanRow([
      {span:5,text:'FERREIRA EMBALAGENS',size:14,bold:true},
      {span:2,text:'ORDEM DE PRODUCAO',size:9,bold:true,align:'center',fill:.86},
      {span:1,text:'Data emissao:',size:7,bold:true},
      {span:1,text:data.date||'',size:8,bold:true,align:'center'}
    ],21);
    spanRow([
      {span:3,lines:[{text:'CLIENTE / FORMULACAO',size:5.4},{text:data.name||'Formulação',size:10.5,bold:true}],fill:.95},
      {span:1,text:'UF:',size:7},
      {span:2,text:'FASE 1: EXTRUSAO',size:8.5,bold:true,align:'center',fill:.86},
      {span:1,text:'OS:',size:7,bold:true,align:'center'},
      {span:2,text:'',size:8}
    ],21);
    spanRow([
      {span:3,lines:[{text:'TAMANHO FINAL',size:5.4},{text:data.size||'_____',size:9,bold:true}],fill:.95},
      {span:3,text:'CODIGO DE BARRA',size:6.2,align:'center'},
      {span:3,text:'PREVISAO ENTREGA:',size:7,bold:true}
    ],21);
    spanRow([
      {span:3,lines:[{text:'PESO LIQUIDO / PRODUCAO',size:5.4},{text:data.production||'0 KG',size:9,bold:true}],fill:.95},
      {span:3,lines:[{text:'MISTURA CALCULADA',size:5.4},{text:data.mix||'0 KG',size:9,bold:true}],fill:.95},
      {span:3,text:'TOTAL (FD):',size:7,bold:true}
    ],21);

    y-=3;
    spanRow([{span:1,text:'CP:',size:7,bold:true,align:'center'},{span:8,lines:[{text:'DESCRICAO DO PRODUTO',size:5.4},{text:data.name||'Formulação',size:9.2,bold:true}],fill:.95}],18);
    spanRow([
      {span:3,lines:[{text:'ESPESSURA DUPLA (MICRA)',size:6.2,bold:true},{text:data.doubleMicra||'_____',size:11.2,bold:true}],fill:[1,.93,.42],strong:true},
      {span:3,lines:[{text:'ESPESSURA POR PAREDE',size:6.2,bold:true},{text:data.wallMicra||'_____',size:11.2,bold:true}],fill:[1,.93,.42],strong:true},
      {span:3,lines:[{text:'GRAMAS POR METRO',size:6.2,bold:true},{text:data.grams||'_____',size:11.2,bold:true}],fill:[1,.93,.42],strong:true}
    ],24);
    spanRow([
      {span:3,lines:[{text:'LARGURA DA BOBINA',size:6.2,bold:true},{text:data.width||'_____ CM',size:11.2,bold:true}],fill:[1,.93,.42],strong:true},
      {span:3,lines:[{text:'LARGURA DO BALAO',size:6.2,bold:true},{text:data.width||'_____ CM',size:11.2,bold:true}],fill:[1,.93,.42],strong:true},
      {span:3,text:'',size:8}
    ],24);
    spanRow([{span:9,lines:[{text:'OBSERVACOES IMPORTANTES',size:5.4},{text:'',size:8}]}],26);

    y-=3;
    const matWidths=[WIDTH*.07,WIDTH*.60,WIDTH*.12,WIDTH*.21];
    let x=MARGIN;
    ['MATERIAL','DESCRICAO DA MATERIA-PRIMA','%','KG DA MISTURA'].forEach(function(label,i){cell(x,y,matWidths[i],18,label,{size:7,bold:true,align:'center',fill:.86});x+=matWidths[i]});
    y-=18;
    const materials=Array.isArray(data.materials)?data.materials:[];
    for(let i=0;i<8;i++){
      const m=materials[i]||{};
      x=MARGIN;
      [m.code||String.fromCharCode(65+i),m.name||'',m.pct||'',m.kg||''].forEach(function(value,j){cell(x,y,matWidths[j],18,value,{size:j===1?7.3:7.6,bold:j!==1,align:j===1?'left':'center'});x+=matWidths[j]});
      y-=18;
    }

    y-=3;
    const prodLabels=[['DATA'],['OPERADOR'],['MAQUINA'],['APARAS','KG'],['QUANTIDADE','KG'],['COD.','PARADA'],['INICIO','PARADA'],['FINAL','PARADA'],['INICIO','PRODUCAO'],['FINAL','PRODUCAO'],['N.','BOBINAS']];
    const pw=WIDTH/11;
    x=MARGIN;
    prodLabels.forEach(function(parts){cell(x,y,pw,18,parts.map(function(v){return{text:v,size:5.3,bold:true}}),{align:'center',fill:.90});x+=pw});
    y-=18;
    for(let r=0;r<8;r++){
      x=MARGIN;
      for(let c=0;c<11;c++){cell(x,y,pw,16,'',{size:6});x+=pw}
      y-=16;
    }

    y-=3;
    const codeW=WIDTH/6;
    x=MARGIN;
    ['01 - TROCA DE TELA','02 - ACERTO','03 - M. MECANICA','04 - FALTA DE ENERGIA','05 - MATERIAL MOLHADO','06 - TESTE'].forEach(function(v){cell(x,y,codeW,14,v,{size:5.5,fill:.97});x+=codeW});
    y-=14;
    x=MARGIN;
    ['07 - M. ELETRICA','08 - LIMPEZA DA BORDA','09 - TROCA DE TELA','10 - OUTROS'].forEach(function(v){cell(x,y,codeW,14,v,{size:5.5,fill:.97});x+=codeW});
    cell(x,y,codeW*2,14,'DF EXTRUSOR PRO',{size:7,bold:true,align:'center',fill:.95});

    return makePdf(ops.join('\n'),'OP '+(data.name||''));
  }

  function open(data){
    const popup=nativeOpen('','_blank');
    if(!popup){alert('O navegador bloqueou o PDF da OP. Libere pop-up.');return false;}
    try{
      const blob=new Blob([create(data)],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      popup.location.replace(url);
      setTimeout(function(){URL.revokeObjectURL(url)},300000);
      return true;
    }catch(e){
      try{popup.close()}catch(_){}
      alert('Não foi possível criar o PDF da OP.');
      return false;
    }
  }

  window.DFOPLandscapePdf={create:create,open:open,page:{width:PAGE_W,height:PAGE_H}};
})();
