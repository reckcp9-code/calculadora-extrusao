# MAPA DE MANUTENÇÃO — DF EXTRUSOR

> Guia para localizar o módulo certo antes de corrigir bugs. Esta branch é a reorganização em andamento; a publicação `main` ainda usa arquivos na raiz. Não excluir os carregadores antigos até migrar os imports e testar.

| Problema / pedido | Pasta para trabalhar |
|---|---|
| Tela inicial, menus, interface | `sistema-df-server-pro/telas/` |
| Key, login, recuperação de acesso | `sistema-df-server-pro/login/` |
| Dados do dono, troca de celular, equipe vinculada | `sistema-df-server-pro/login/dados-do-dono/` |
| Formulações e OP de formulação | `sistema-df-server-pro/formulacao/codigo/` |
| Materiais e receitas | `sistema-df-server-pro/formulacao/materiais/` |
| Dados salvos da formulação | `sistema-df-server-pro/formulacao/dados-salvos/` |
| Relatórios de formulação | `sistema-df-server-pro/formulacao/relatorios/` |
| OPs, baixa, pendentes, prontas | `sistema-df-server-pro/producao/ops/` |
| Equipes e sincronização de produção | `sistema-df-server-pro/producao/sincronizacao/` |
| Persistência de produção | `sistema-df-server-pro/producao/dados-salvos/` |
| PDFs e impressão de produção | `sistema-df-server-pro/producao/relatorios/pdf/` |
| Calculadoras, custos e sacolas | `sistema-df-server-pro/calculos/` |
| Rede, Cloudflare, cache, PWA, performance | `sistema-df-server-pro/infraestrutura/codigo/` |
| Login do painel, keys e recuperação | `painel-administrativo/login/` |
| Dono no painel e recuperação de conta | `painel-administrativo/login/dados-do-dono/` |
| Keys e licenças administrativas | `painel-administrativo/acesso-e-licencas/` |
| Permissões e equipes no painel | `painel-administrativo/equipes-e-permissoes/` |
| Interface do painel | `painel-administrativo/interface/` |
| Publicação do painel | `painel-administrativo/publicacao/` |
| Documentos PDF administrativos | `painel-administrativo/relatorios/pdf/` |

## Fluxo de manutenção
1. Identificar o módulo pela tabela.
2. Conferir o arquivo realmente carregado pela versão publicada, incluindo `index.html`, `app-shell.html` e `sw.js`.
3. Alterar somente o módulo necessário, preservando contratos de API, permissões e banco D1/R2.
4. Testar dono e operador, celulares diferentes, offline e sincronização quando pertinente.
5. Publicar apenas após validação; então remover cópias antigas e atualizar este mapa.

## Versões preservadas
- `reserva-df-extrusor-v778` — base 1.0.778.
- `reserva-df-extrusor-v620-1` — base 1.0.620.1.

## Pendências
- Referências de runtime ainda usam a raiz; duplicatas não podem ser apagadas sem migração.
- Os módulos de login e dados do dono são estruturas de organização, não recuperação de conta completa já testada.
- Arquivos antigos de PDF ainda exigem auditoria de chamadas antes de excluir.
- Páginas de TV foram retiradas desta branch de trabalho, mas continuam nas versões de reserva e na `main` publicada.
