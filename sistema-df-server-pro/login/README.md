# Login e ativação — Sistema DF Server Pro

Módulo isolado para a tela de entrada, digitação da key, liberação do aplicativo, recuperação de acesso, vínculo do dispositivo, entrada automática de usuários existentes, tratamento de key pausada e reativação.

Os arquivos em `codigo/` são cópias exatas dos módulos da base 1.0.778. **Não alterar ou apagar os carregadores originais até atualizar e testar os imports, service worker e publicação.**

Fluxo esperado: usuário novo digita key manualmente; usuário existente válido entra direto; key pausada bloqueia; reativação e reset devem ser validados no servidor; saída da equipe não provoca entrada automática.
