# Calculadora de Extrusão DF

Calculadora web para estimar gramas por metro e descobrir a micra real do filme tubular.

## Recursos
- cálculo de g/m
- cálculo inverso da micra pelo peso de 1 metro
- densidade pré-definida ou manual para material reciclado
- interface simples para celular

Abra `index.html` no navegador.


## Migração controlada — auditoria em andamento (04/11/2026)

- A branch `main` continua sendo a fonte da versão publicada até validação da migração.
- Backup: `backup-main-antes-migracao-pastas-20261104`.
- Os diretórios `sistema-df-server-pro/codigo-ativo-auditoria/` e `painel-administrativo/codigo-ativo-auditoria/` contêm **121 cópias exatas** de arquivos selecionados por referências diretas nas páginas de entrada.
- Há **377 arquivos na main ainda não copiados** para essa área; isso **não significa** que sejam descartáveis. Incluem dependências dinâmicas, rotas de produção, scripts de infraestrutura e testes.
- NÃO excluir arquivos da raiz, `teste/`, `.github/`, Worker, D1 ou R2 até mapear importações, `fetch`, `importScripts`, URLs dinâmicas, Service Worker e publicar/testar o novo layout.
- Próximas verificações: mapa recursivo de dependências; rotas reais; carregamentos por JS; ajustes de caminhos; testes de acesso, produção, formulação, relatórios, sincronização, fotos e PWA; publicação e só então remoção dos órfãos comprovados.


## Auditoria de dependências — 04/11/2026

Migração NÃO pronta para exclusão na main. Foram copiadas 121 referências iniciais; 377 arquivos da main ainda não classificados. Referências nas entradas: index.html=90, app-shell.html=3, gerar-acesso.html=20, painel-administrativo-df.html=20, op-producao.html=13, sw.js=78. Referências ao diretório teste no Service Worker exigem investigação. Antes de excluir: mapear dependências recursivas, scripts dinâmicos, rotas, Worker, PWA, corrigir caminhos, testar produção/formulação/sincronização e validar publicação. Backup: backup-main-antes-migracao-pastas-20261104. Não excluir arquivos ativos nem dados D1/R2.
