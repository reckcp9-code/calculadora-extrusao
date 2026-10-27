# Saída da Equipe de Produção — fluxo aprovado (1.0.618)

Aprovado em 2026-10-27 após teste real no celular do operador.

Requisitos de regressão: ao sair da Equipe de Produção, remover OPs Salvas, Prontas, Pendentes, Fotos (incluindo IndexedDB `df_ops_fotos_v2` e `df_producao_ops_fotos_v1`), Mês e cadastros locais de Produção; não reconectar automaticamente; não excluir dados do servidor; preservar licença e dados de Extrusão.

A rotina está em `producao-equipe-separada-v2.js`, função `wipeProductionLocal`. Não alterar esta função durante correções de Pendentes sem teste específico de regressão.

Este arquivo registra o comportamento aprovado; não é um mecanismo de bloqueio automático de alterações.
