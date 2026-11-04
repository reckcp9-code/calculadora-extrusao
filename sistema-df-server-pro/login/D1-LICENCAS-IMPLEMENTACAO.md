# D1 exclusivo para licenças DF Extrusor

Banco criado na Cloudflare: `df-extrusor-licencas`.

Banco operacional existente `df-extrusor-pro` permanece separado.

## Tabelas

- `owners`: identificador permanente do proprietário.
- `licenses`: fingerprint da key (não guardar key em texto puro), status, geração de reset e proprietário.
- `license_devices`: dispositivos autorizados e revogados.
- `owner_teams`: vínculo do proprietário às equipes de Produção e Formulação.
- `license_audit`: histórico de pausa, reativação, reset e ações administrativas.

## Regras de integração ainda pendentes

1. Migrar/vincular as keys existentes sem alterar as licenças atuais nem bloquear usuários.
2. Criar Worker autenticado com binding D1 exclusivo. **Nunca expor D1 nem credenciais administrativas no frontend.**
3. Fazer o login validar a key online na primeira entrada; emitir sessão de dispositivo, armazenada de forma segura.
4. Nas entradas seguintes, abrir diretamente a interface com verificação silenciosa da sessão; pausas e resets revogam acesso.
5. Reset deve aumentar `generation` e revogar sessões, sem apagar `owner_id`, equipes, OPs, formulações ou fotos.
6. Recuperação de propriedade exige verificação de identidade; a key isoladamente não pode transferir equipe.
7. Garantir que a autorização dos operadores não dependa de o dono estar conectado.

**Estado:** D1 e esquema criados. Nenhuma key foi migrada, nenhum Worker ou frontend foi redirecionado. Não publicar o login novo antes dos testes.
