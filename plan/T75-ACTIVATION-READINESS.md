# T75 — Preparação final da ativação

21/10/2026. O titular priorizou ativar seus bancos no app. Não reimplementar telas já entregues nem repetir validações sem alteração. Integração é somente para leitura; nenhuma ferramenta acessa saldos/extratos. Seguir SEC-02/06/14/17/18, MPG-01/06 e SEC-42.

## T75a — Chaves e configuração operacional

Responsável: integrador único. Dependências: T22c26, T23c10/publicação21/10. Paths: scripts/movement-keys.py, financial-config.py, testes administrativos e documentos de estado. Gerar duas chaves independentes de32bytes pelo CSPRNG, perfil privado fora do Metro, arquivo600/diretório700, sem imprimir valores, sobrescrever ou rotacionar chave existente. Leitura estrita antes de qualquer configuração remota. Provisionar somente os segredos faltantes e flags de movimentos/investimentosfalse, preservando codegate financeirooff e configuração de metadados. Conferir digests e identidade/fontes das funções; mudança de versão por env precisa de reconciliação comprovada. Aceite: validação local de formato/idempotência/ACL/links/erro semconteúdo, scanner com chaves novas, configuração remota idempotente com flagsfalse e smokesoff. Nenhuma conta ativada artificialmente.

## T75b — Origem e segurança

Revalidar fontes oficiais e distinguir requisito ainda não implementado de evidência externa inexistente. Recursos de item MeuPluggy não comprovam, por si, a origem original de cada banco. Não chamar endpoints financeiros, importar cookies ou marcar verifiedAt/capacidades manualmente. Advisories sempatch não são resolvidos por maisfixtures ou mudança de exceção. Produzir lista objetiva do que impede a ativação e da ação mínima possível; nenhum contato externo sem autorização.
