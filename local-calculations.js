(function(root){
  'use strict';

  const finite=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const pos=v=>Math.max(0,finite(v));
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,finite(v)));

  function extrusao(input){
    const largura=pos(input.largura),micra=pos(input.micra),densidade=pos(input.densidade),pesoMedido=pos(input.pesoMedido);
    const pesoIdeal=largura>0&&micra>0&&densidade>0?largura*micra*densidade*.01:0;
    const micraReal=largura>0&&pesoMedido>0&&densidade>0?pesoMedido/(largura*densidade*.01):0;
    const diferencaMicraPct=micraReal>0&&micra>0?((micraReal-micra)/micra)*100:0;
    return{pesoIdeal,micraReal,diferencaMicraPct};
  }

  function correcao(input){
    const base=extrusao(input),pesoMedido=pos(input.pesoMedido),massa=pos(input.massa),puxador=pos(input.puxador),ar=pos(input.ar);
    const pesoIdeal=base.pesoIdeal;
    const diferencaPct=pesoIdeal>0&&pesoMedido>0?((pesoMedido-pesoIdeal)/pesoIdeal)*100:0;
    const puxadorRecomendado=pesoIdeal>0&&pesoMedido>0&&puxador>0?puxador*pesoMedido/pesoIdeal:0;
    const massaRecomendada=pesoIdeal>0&&pesoMedido>0&&massa>0?massa*pesoIdeal/pesoMedido:0;
    return{pesoIdeal,pesoMedido,diferencaPct,puxadorRecomendado,massaRecomendada,deltaPuxador:puxadorRecomendado?puxadorRecomendado-puxador:0,deltaMassa:massaRecomendada?massaRecomendada-massa:0,ar};
  }

  function producao(input){
    const massa=pos(input.massa),puxador=pos(input.puxador),ar=pos(input.ar),percentual=finite(input.percentual);
    const fator=Math.max(0,1+percentual/100);
    return{massaNova:massa>0?massa*fator:0,puxadorNovo:puxador>0?puxador*fator:0,arNovo:ar>0?ar*fator:0,relacaoAtual:massa>0&&puxador>0?massa/puxador:0,relacaoNova:massa>0&&puxador>0&&fator>0?(massa*fator)/(puxador*fator):0};
  }

  function sacola(input){
    const largura=pos(input.largura),comprimento=pos(input.comprimento),micra=pos(input.micra),densidade=pos(input.densidade),descontoPct=clamp(input.descontoPct,0,100),quantidade=pos(input.quantidade);
    const pesoUnidade=largura>0&&comprimento>0&&micra>0&&densidade>0?largura*comprimento*micra*densidade/10000*(1-descontoPct/100):0;
    return{pesoUnidade,pesoQuantidadeKg:pesoUnidade>0&&quantidade>0?pesoUnidade*quantidade/1000:0,unidadesPorKg:pesoUnidade>0?1000/pesoUnidade:0,pesoMilKg:pesoUnidade};
  }

  function custo(input){
    const pesoKg=pos(input.pesoKg),custoKg=pos(input.custoKg),vendaKg=pos(input.vendaKg),quantidade=pos(input.quantidade)||1;
    const custoUnidade=pesoKg*custoKg,vendaUnidade=pesoKg*vendaKg,lucroUnidade=vendaUnidade-custoUnidade;
    return{custoUnidade,vendaUnidade,lucroUnidade,custoTotal:custoUnidade*quantidade,vendaTotal:vendaUnidade*quantidade,lucroTotal:lucroUnidade*quantidade};
  }

  function formulacao(input){
    const totalKg=pos(input.totalKg),rows=Array.isArray(input.rows)?input.rows:[];
    let totalPct=0,somaKg=0,custoTotal=0;
    const itens=rows.map(row=>{const pct=pos(row.pct),precoKg=pos(row.precoKg),kg=totalKg*pct/100,custo=kg*precoKg;totalPct+=pct;somaKg+=kg;custoTotal+=custo;return{pct,precoKg,kg,custo}});
    return{itens,totalPct,somaKg,custoTotal,custoKgFinal:totalKg>0?custoTotal/totalKg:0,diferencaPara100:100-totalPct};
  }

  function calculate(type,input){
    const data=input||{};
    if(type==='extrusao')return extrusao(data);
    if(type==='correcao')return correcao(data);
    if(type==='producao')return producao(data);
    if(type==='sacola')return sacola(data);
    if(type==='custo')return custo(data);
    if(type==='formulacao')return formulacao(data);
    throw new Error('Cálculo local não reconhecido: '+String(type||''));
  }

  const api={calculate};
  root.DFLocalCalculations=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);