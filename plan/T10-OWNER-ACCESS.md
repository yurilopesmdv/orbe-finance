# T10 — Proprietário e cadastro restrito

Estado: done quanto a provisionamento/autorização, 19/10/2026. 19/10/2026. AUTH-01/02. T08 concluída. Responsável sequencial. Paths migration nova, backend-admin.py, testes SQL/admin e checkpoints.

Migration cria registro privado singleton e função booleana baseada em auth.uid, sem parâmetros arbitrários. Cliente sem escrita/leitura direta. Política signup já desligada na T08. Administração verifica conta confirmada/não anônima antes de registrar UUID fornecido no arquivo privado. Não atualizar dono existente por conveniência.

Testes rollback com dois usuários inventados, sem sessão, ausência de registro e grants; nenhuma senha/email real. Provisionamento efetivo depende de o usuário criar conta diretamente no painel e informar somente UUID via env. SMTP/recuperação ainda precisam da T11 e revisão operacional; não alegar concluídos.

Helper de migrations deve percorrer arquivos versionados e verificar hashes no histórico antes de qualquer aplicação; baseline remota anterior obrigatória. Projeto precisa continuar sendo Orbe confirmado; comandos não aceitam SQL arbitrário.

## Evidência T10a

Migration 20261019180000 aplicada e hash conferido. Teste transacional real executou chamadas como authenticated/anon, dono permitido, segunda identidade/sem sessão/registro ausente negados, sem leitura cliente ao registro. Rollback e zero identidades temporárias conferidos. TypeScript e109 testes locais passaram (9 guardas administrativos). T10b depende de ORBE_OWNER_USER_ID fornecido privadamente pelo titular; em sua ausência, função continua negando todos. Login/recuperação ainda não integrados/testados.

## Provisionamento T10b

Titular criou sua identidade diretamente no Dashboard e forneceu UUID no arquivo privado. set-owner verificou conta confirmada/não anônima, provisionou singleton e confirmou registro. Nenhum e-mail/senha foi lido ou impresso. Login com senha do titular ainda será testado por ele no app (T11/T38); não declarar essa interação executada.
