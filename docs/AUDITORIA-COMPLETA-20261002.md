# Auditoria completa — DF EXTRUSOR PRO

Data: 2026-10-02/03
Branch: `auditoria-completa-20261002`
Base auditada: `main` em `d778131d5500f90b847bb1249de2e1f9dd62044f`
Última validação principal: `df7b770acbe1da63ff7273b5b34f98caffc77504`

## Objetivo

Revisar estabilidade, erros de JavaScript/JSON, carregamento, PWA/offline, estrutura, módulos antigos e risco de regressão sem alterar a versão original antes da validação.

## Estado do projeto

- Aplicação web estática, sem `package.json` e sem dependências npm para atualizar.
- Auditoria automática criada em `.github/workflows/df-enterprise-audit.yml`.
- O auditor verifica sintaxe de todos os `.js`, JSON válido, arquivos críticos, referências do `index.html`, duplicações, módulos de teste ativos, PWA/offline e sinais de conflito/desempenho.
- Estado final da validação do carregador: 69 módulos JavaScript ativos, 327 JavaScripts no repositório, 85 candidatos a legado/teste, **0 erros**.

## Correções aplicadas nesta branch

### 1. PWA/offline

Arquivo: `sw.js`

- Cache antigo com nome de teste substituído por cache próprio da auditoria.
- `acessar.html` incluído no pré-cache.
- Módulos críticos atuais incluídos no pré-cache.
- Navegação passou a priorizar a cópia local quando disponível e atualizar em segundo plano.
- Rede limitada por timeout para reduzir tela presa com sinal ruim.
- `index.html`, `acessar.html` e `app-shell.html` podem responder pelo cache enquanto atualizam.

### 2. Auditoria automática

Arquivo: `.github/workflows/df-enterprise-audit.yml`

- Validação de sintaxe de todos os JavaScripts.
- Validação de JSON.
- Verificação de arquivos críticos ausentes.
- Verificação de arquivos referenciados pelo `index.html`.
- Verificação de referências duplicadas.
- Inventário de candidatos a legado.
- Checagem de APIs globais alteradas, MutationObservers, timers rápidos e registros de Service Worker.
- Relatório gerado como artefato mesmo se houver falha.

### 3. Módulo antigo quebrado isolado

O arquivo `op-smart-reader-v4.js` apresentava erro de sintaxe e não era referenciado pelo aplicativo ativo.

Ação: isolado como `legacy/op-smart-reader-v4.js.txt`. O histórico permanece preservado no Git, mas o arquivo não participa mais da base JavaScript validada.

Status: **DESCONTINUADO / ISOLADO**.

### 4. Módulos ativos promovidos de teste para produção

O carregador da branch de auditoria já aponta para nomes de produção:

- `formula-mobile-nav-fix-v1.js`
- `team-formulas-duplicates-v2.js`
- `formula-material-picker-v1.js`
- `op-production-now-product-details-v172.js`
- `op-production-now-client-v175.js`

A biblioteca de formulações prontas foi promovida para:

- `formula-ready-library-v2.js`

Os arquivos antigos com `test/teste` permanecem no repositório somente para histórico/rollback até a validação funcional final; eles não são mais referências ativas do `index.html` da branch auditada.

### 5. Pesquisa de materiais otimizada

O seletor de materiais mantém:

- pesquisa;
- favoritos;
- preço;
- toque para selecionar.

Foi removido o observador global permanente do documento. A atualização passou a ocorrer por eventos da tela de Formulação e eventos de ciclo de vida do app.

### 6. Sacolas otimizada

O comportamento de digitação rápida e os textos de caixa/fardo foram mantidos.

Foi removido o MutationObserver permanente do `body`; os textos são atualizados ao entrar na tela, em eventos do app e em verificações pontuais.

### 7. Service Worker consolidado

O módulo `push-background-repair-v1.js` não registra mais outro Service Worker. Ele reutiliza o registro existente criado pelo núcleo do app.

Resultado: a auditoria final identifica **um único registro ativo de Service Worker**, em `app-bundle.js`.

### 8. Cache do carregador renovado

Na branch auditada:

- BUILD: `20261003-enterprise-audit-v1`
- shell cache: `df-app-shell-source-v36`
- shell key: `__df_base_shell_v178__.html`

Isso evita misturar o shell antigo com a estrutura revisada durante o teste.

## Alertas restantes — não são erros automáticos

A última auditoria do carregador passou com **0 erros**, mas manteve três alertas de arquitetura que exigem revisão cuidadosa, não remoção automática:

1. **9 módulos alteram APIs globais**. Parte deles faz autenticação, proteção de exclusão e sincronização de OPs/Formulações. Exemplo: `formula-delete-tombstone-v1.js` impede que uma formulação apagada seja ressuscitada; `team-formulas-duplicates-v2.js` agenda a sincronização da biblioteca.
2. **13 módulos usam MutationObserver com subtree**. Vários são observadores limitados a telas/contêineres específicos e não devem ser removidos sem teste funcional.
3. **12 módulos possuem timers abaixo de 500 ms**. Muitos são timers de inicialização que se encerram após encontrar o elemento esperado; devem ser reduzidos individualmente, não em massa.

Esses três alertas ficam como dívida técnica controlada para uma segunda fase de otimização, após validação funcional da presente branch.

## Itens que NÃO devem ser removidos

- `formula-delete-tombstone-v1.js`: protege exclusões contra ressincronização antiga.
- `team-formulas-duplicates-v2.js`: sincroniza formulações da equipe e permite nomes iguais por ID.
- `backup-manual-only-v1.js`: mantém o fluxo de backup manual e regras atuais de Formulação.
- wrappers de autenticação do `app-bundle.js`/`auth-self-heal-v1.js`: não devem ser eliminados sem substituir a injeção/renovação de token.

## Candidatos a legado

O repositório ainda possui 85 candidatos por nomenclatura (`preview-*`, `*-test*`, pasta `teste/`, backups antigos etc.). Eles **não serão apagados em massa**.

Política adotada:

1. confirmar que o arquivo não é referenciado por `index.html`, Service Worker ou carregamento dinâmico;
2. manter histórico/rollback até a validação funcional;
3. mover para `legacy/` ou excluir em uma limpeza posterior dedicada;
4. nunca remover recurso apenas por causa do nome do arquivo.

## Governança recomendada

A branch `main` está sem proteção e sem status checks obrigatórios. Para uso empresarial, recomenda-se:

- exigir PR para `main`;
- exigir a auditoria automática antes de merge;
- impedir push direto em produção;
- manter rollback por versão.

## Critério para publicação

Nenhuma alteração desta auditoria deve ir para `main` sem:

1. auditoria automática sem erros — **ATENDIDO**;
2. referências ativas sem módulos de teste — **ATENDIDO NA BRANCH**;
3. validação funcional em celular de Acesso, Extrusão, Sacolas, Custo, Formulação e OPs — **PENDENTE**;
4. autorização explícita do responsável para publicar — **PENDENTE**.
