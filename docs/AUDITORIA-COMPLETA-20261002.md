# Auditoria completa — DF EXTRUSOR PRO

Data: 2026-10-02/03
Branch: `auditoria-completa-20261002`
Base auditada: `main` em `d778131d5500f90b847bb1249de2e1f9dd62044f`

## Objetivo

Revisar estabilidade, erros de JavaScript/JSON, carregamento, PWA/offline, estrutura, módulos antigos e risco de regressão sem alterar a versão original antes da validação.

## Estado do projeto

- Aplicação web estática, sem `package.json` e sem dependências npm para atualizar.
- Auditoria automática criada em `.github/workflows/df-enterprise-audit.yml`.
- O auditor verifica sintaxe de todos os `.js`, JSON válido, arquivos críticos, referências do `index.html`, duplicações, módulos de teste ativos e cobertura do cache offline.
- Na primeira varredura útil: 69 módulos JavaScript ativos, 328 JavaScripts no repositório e 85 candidatos a teste/legado.

## Correções já aplicadas nesta branch

### 1. PWA/offline

Arquivo: `sw.js`

- Cache de produção/teste antigo renomeado para cache próprio da auditoria.
- `acessar.html` incluído no pré-cache.
- Módulos críticos atuais incluídos no pré-cache.
- Navegação alterada para usar cache local imediatamente quando disponível e atualizar em segundo plano.
- Rede limitada por timeout para evitar tela presa quando o sinal cai.
- `index.html`, `acessar.html` e `app-shell.html` passam a aceitar resposta em cache enquanto atualizam.

### 2. Auditoria automática

Arquivo: `.github/workflows/df-enterprise-audit.yml`

- Validação de sintaxe de todos os JavaScripts.
- Validação de JSON.
- Verificação de arquivos críticos ausentes.
- Verificação de arquivos referenciados pelo `index.html`.
- Inventário de módulos ativos com nomenclatura de teste.
- Inventário de candidatos a legado.
- Relatório gerado como artefato mesmo se houver falha.

### 3. Módulo antigo quebrado isolado

O arquivo `op-smart-reader-v4.js` apresentava erro de sintaxe e não era referenciado pelo aplicativo ativo.

Ação: isolado como `legacy/op-smart-reader-v4.js.txt` na branch de auditoria. O histórico permanece preservado no Git, mas o arquivo não participa mais da base JavaScript validada.

Status: **DESCONTINUADO / ISOLADO**.

### 4. Nomes de produção preparados para módulos já usados

Foram criadas cópias com nomes de produção, preservando a lógica atual:

- `formula-material-picker-v1.js`
- `formula-mobile-nav-fix-v1.js`
- `team-formulas-duplicates-v2.js`
- `op-production-now-product-details-v172.js`
- `op-production-now-client-v175.js`
- `formula-ready-library-v2.js`

O seletor de materiais de produção foi limpo do selo/código de teste. A navegação mobile de Formulação foi ajustada para carregar `formula-ready-library-v2.js` em vez de `teste/formulas-prontas-v2.js`.

**Importante:** o `index.html` atual ainda referencia algumas versões com nome `test/teste`. A troca definitiva das referências deve ser feita e validada em preview antes de remover os arquivos antigos.

## Módulos que NÃO devem ser apagados agora

Os seguintes arquivos têm nome de teste/legado, mas ainda estão referenciados pelo app atual e portanto não são lixo:

- `formula-mobile-nav-fix-test-v1.js`
- `teste/team-formulas-duplicates-v2.js`
- `formula-material-picker-test-v1.js`
- `op-production-now-product-details-test-v172.js`
- `op-production-now-client-test-v175.js`

Eles só podem ser descontinuados depois que o carregador apontar para as cópias de produção e o preview passar nos testes funcionais.

`backup-manual-only-v1.js` também é ativo e não deve ser removido; ele carrega o backup manual e a regra de permitir formulações de mesmo nome.

## Candidatos a legado

Existem dezenas de previews, variantes `*-test*`, páginas de leitura antigas e arquivos dentro de `teste/`. Eles não serão apagados em massa. A política adotada é:

1. confirmar que não são referenciados pelo `index.html`, `sw.js` ou por carregamento dinâmico;
2. mover para `legacy/` ou excluir somente após validação;
3. nunca remover recurso ativo apenas por causa do nome do arquivo.

## Governança recomendada

A branch `main` está sem proteção de branch e sem status checks obrigatórios. Para uso empresarial, recomenda-se habilitar proteção da `main`, revisão/PR e exigir a auditoria automática antes de merge.

## Publicação

Nenhuma alteração desta auditoria deve ir para `main` sem:

1. auditoria automática sem erros;
2. preview funcional em celular;
3. validação de acesso, Extrusão, Sacolas, Custo, Formulação e OPs;
4. autorização explícita para publicar.
