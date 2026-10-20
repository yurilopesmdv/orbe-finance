# T51b2c17 — Corrigir cardinalidade presumida

MPG-32. Integrador único. Depende inventárioMPG-30 e relato atual do titular. Paths: provider-items.py, testesadmin, spec009, TASKS/STATE/ACCOUNT-ACTIVATION. Sem migrations novas ou alteração de flags.

1. Substituir dois campos obrigatórios por lista de1a5 itens, com instituição unknown permitida.
2. Não presumir cobertura multibanco nem exigir duplicar/recriar conexão. Completo separa-se de identificável.
3. Migrar apenas template legado comprovadamente vazio, via gravação no próprio descritor0600; nunca alterar IDs preenchidos.
4. Validar um item, vários, ambiguidade, limites e preservação; regressões completas/scan/Git.

Aceite: único item válido aceito, nenhum banco inventado, SQL de staging anterior permanece estritamente bancário e não recebe unknown. Próxima fatia aplicador depende de instituição comprovada; verificar importação de Bradesco separadamente sem repetir consentimento bancário.
