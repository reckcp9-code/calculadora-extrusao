# Dados do Dono e Recuperação — DF Server Pro

## Objetivo
A key de acesso identifica o dono, mas **não deve armazenar os dados**. O servidor Cloudflare D1/R2 é a fonte de verdade; o vínculo seguro é `owner_account_id -> team_id(s) -> registros`. Uma key é credencial revogável, não banco de dados nem única prova de propriedade.

## Escopo de recuperação
- Equipes de Produção e Formulação, membros, papéis e códigos.
- Máquinas, produtos, formulações, materiais e configurações.
- OPs em andamento, pendentes, prontas, histórico, produção e relatórios.
- Fotos no R2 com metadados e permissões no D1.
- Preferências compartilhadas e vínculos de propriedade.

## Fluxo no celular novo
1. Digitar a key e autenticar a identidade do dono, com verificação adicional para mudança de aparelho.
2. Validar a licença no servidor; localizar o `owner_account_id` e equipes autorizadas.
3. Carregar primeiro o estado canônico do D1 e as referências R2; aplicar as preferências da equipe.
4. Sincronizar atualizações por cursor/versão e exibir confirmação de recuperação concluída.
5. Reconciliar apenas operações offline válidas, com IDs idempotentes; nunca sobrescrever o servidor com cache vazio do aparelho novo.

## Regras essenciais
- Operador usa sua própria credencial e papel; não assume a key do dono.
- Sincronização entre operadores independe de o dono estar online.
- Pausar ou revogar key bloqueia autenticação conforme política, sem apagar registros.
- Recuperação e transferência de propriedade exigem autorização do servidor e trilha de auditoria.
- Não salvar key em texto puro, não usar key como ID de equipe e não vincular dados a identificadores de aparelho.
- D1 e R2 devem ter backups/recuperação testados; dados excluídos intencionalmente não podem ressurgir após reinstalação.

## Status
**Arquitetura e arquivos de referência separados.** Ainda falta implementar endpoints de recuperação, migração de schema, UI e testes ponta a ponta. Não declarar recuperação automática pronta antes disso.
