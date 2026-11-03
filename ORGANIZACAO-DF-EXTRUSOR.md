# Organização DF Extrusor — duas bases preservadas

## Bases de recuperação (ramificações independentes)
- `reserva-df-extrusor-v778`: cópia exata da versão 1.0.778 antes da reorganização.
- `reserva-df-extrusor-v620-1`: versão 1.0.620.1 identificada pelo `app-version.json` do commit `0a0fcdc8995dca0dfaf589de9b41ab25a253f95b`.
- `base-atual-df-extrusor-v778`: trabalho de organização, ainda **não publicado**.
- `main`: aplicação publicada; não remover ou substituir sem validação.

## Sistema DF Server Pro
- `sistema-df-server-pro/telas/codigo/`: interface e telas.
- `sistema-df-server-pro/login/codigo/`: login, digitação de key, recuperação e acesso automático.
- `sistema-df-server-pro/formulacao/codigo/`: lógica de formulação.
- `sistema-df-server-pro/formulacao/materiais/`: catálogo e gerenciamento de materiais.
- `sistema-df-server-pro/formulacao/dados-salvos/`: código de persistência das formulações, não os registros D1.
- `sistema-df-server-pro/producao/ops/`: ordens de produção.
- `sistema-df-server-pro/producao/sincronizacao/`: comunicação e consistência entre operadores.
- `sistema-df-server-pro/producao/dados-salvos/`: código de persistência de produção, não os registros D1.
- `sistema-df-server-pro/producao/relatorios/`: relatórios e PDF.
- `sistema-df-server-pro/calculos/`: cálculos de extrusão, sacolas e custos.
- `sistema-df-server-pro/infraestrutura/codigo/`: autenticação, serviços, cache, conectividade e demais integrações.
- `sistema-df-server-pro/documentacao/`: documentação.

## Painel Administrativo
- `painel-administrativo/interface/codigo/`: interface do painel.
- `painel-administrativo/login/codigo/`: login administrativo, recuperação, ativação e reativação de keys.
- `painel-administrativo/equipes-e-permissoes/codigo/`: equipes, dono, operadores e permissões.
- `painel-administrativo/acesso-e-licencas/codigo/`: keys e licenças.
- `painel-administrativo/publicacao/codigo/`: atualização e publicação do painel.

## Pendências para exclusão total
A raiz ainda contém arquivos executáveis carregados pelo aplicativo publicado. As novas pastas são cópias organizadas, não um runtime integralmente migrado. Antes de apagar os arquivos da raiz: corrigir todos os caminhos relativos, service worker e PWA; testar abertura no iPhone, autenticação, equipes, produção, formulação, sincronização D1/R2, relatórios e painel; implantar e validar; só então excluir duplicatas da raiz. 

**Não apagar dados D1/R2 nem o histórico necessário às duas versões preservadas.**
