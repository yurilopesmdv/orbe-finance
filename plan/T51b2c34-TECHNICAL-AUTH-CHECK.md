# T51b2c34 — Verificar credenciais técnicas sem finanças

MPG-49. Integrador único. Depende MPG-28/46. Paths: provider-profile.py e testesadmin/provider_profile_test.py, spec/TASKS/STATE/ACCOUNT-ACTIVATION. Nenhum GETitem/accounts/consentimento/valor.

1. Refatorar leitorprivado para obtersnapshotvalidado sem alterar init/check redigidos/offline.
2. Adicionar authenticate fixo com TLS/noProxy/noRedirect/timeout/bounds e retorno somentebooleano.
3. Testar destino/body/nenhumaAPIkeyemsaída/erros/bounds/redirect; regressões.
4. Chamar sóAuthreal e registrar resultado redigido, sem usar ou guardarAPIkey. Não pedir atualização deperfil em caso de falha enquanto titularindisponível; prosseguir tarefasindependentes.
