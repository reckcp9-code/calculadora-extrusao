(function(root){
  'use strict';

  const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};

  function extrusao(input){
    const largura=num(input.largura),micra=num(input.micra),densidade=num(input.densidade),pesoMedido=num(input.pesoMedido);
    const pesoIdeal=largura&&micra&&densidade?largura*micra*densidade*.01:0;
    const micraReal=largura&&pesoMedido&&densidade?pesoMedido/(largura*densidade*.01):0;
    const diferencaMicraPct=micraReal&&micra?((micraReal-micra)/micra)*100:0;
    return{pesoIdeal,micraReal,diferencaMicraPct};
  }

  function correcao(input){
    const base=extrusao(input),pesoMedido=num(input.pesoMedido),massa=num(input.massa),puxador=num(input.puxador),ar=num(input.ar);
    const pesoIdeal=base.pesoIdeal;
    const diferencaPct=pesoIdeal&&pesoMedido?((pesoMedido-pesoIdeal)/pesoIdeal)*100:0;
    const puxadorRecomendado=pesoIdeal&&pesoMedido&&puxador?puxador*pesoMedido/pesoIdeal:0;
    const massaRecomendada=pesoIdeal&&pesoMedido&&massa?massa*pesoIdeal/pesoMedido:0;
    return{pesoIdeal,pesoMedido,diferencaPct,puxadorRecomendado,massaRecomendada,deltaPuxador:puxadorRecomendado?puxadorRecomendado-puxador:0,deltaMassa:massaRecomendada?massaRecomendada-massa:0,ar};
  }

  function producao(input){
    const massa=num(input.massa),puxador=num(input.puxador),ar=num(input.ar),percentual=num(input.percentual),fator=1+percentual/100;
    return{massaNova:massa?massa*fator:0,puxadorNovo:puxador?puxador*fator:0,arNovo:ar?ar*fator:0,relacaoAtual:massa&&puxador?massa/puxador:0,relacaoNova:massa&&puxador?(massa*fator)/(puxador*fator):0};
  }

  function sacola(input){
    const largura=num(input.largura),comprimento=num(input.comprimento),micra=num(input.micra),densidade=num(input.densidade),descontoPct=num(input.descontoPct),quantidade=num(input.quantidade);
    const pesoUnidade=largura&&comprimento&&micra&&densidade?largura*comprimento*micra*densidade/10000*(1-descontoPct/100):0;
    return{pesoUnidade,pesoQuantidadeKg:pesoUnidade&&quantidade?pesoUnidade*quantidade/1000:0,unidadesPorKg:pesoUnidade?1000/pesoUnidade:0,pesoMilKg:pesoUnidade};
  }

  function custo(input){
    const pesoKg=num(input.pesoKg),custoKg=num(input.custoKg),vendaKg=num(input.vendaKg),quantidade=num(input.quantidade)||1;
    const custoUnidade=pesoKg*custoKg,vendaUnidade=pesoKg*vendaKg,lucroUnidade=vendaUnidade-custoUnidade;
    return{custoUnidade,vendaUnidade,lucroUnidade,custoTotal:custoUnidade*quantidade,vendaTotal:vendaUnidade*quantidade,lucroTotal:lucroUnidade*quantidade};
  }

  function formulacao(input){
    const totalKg=num(input.totalKg),rows=Array.isArray(input.rows)?input.rows:[];
    let totalPct=0,somaKg=0,custoTotal=0;
    const itens=rows.map(row=>{const pct=num(row.pct),precoKg=num(row.precoKg),kg=totalKg*pct/100,custo=kg*precoKg;totalPct+=pct;somaKg+=kg;custoTotal+=custo;return{pct,precoKg,kg,custo}});
    return{itens,totalPct,somaKg,custoTotal,custoKgFinal:totalKg?custoTotal/totalKg:0,diferencaPara100:100-totalPct};
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
