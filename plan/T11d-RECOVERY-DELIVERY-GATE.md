# T11d — impedir ativação prematura de recovery

20/10/2026. AUTH-13. Integrador único. Dependência: T11c continua bloqueada por SMTP.

Paths: backend-admin.py, backend_admin_test.py, spec001/docs/checkpoints. configure-client hoje ativaria recovery se PATCH/template retornassem sucesso, apesar de entrega não comprovada. Remover configuração Auth/template desse comando; sempre escrever false na configuração pública e informar recovery_enabledfalse/email_sentfalse. SMTP/template devem ser preparados somente em futura T11c com revisão/entrega manual, não automaticamente.

Aceite: configuração nova e reexecução sobre true ficamfalse, sem PATCH/GET extra de Auth ou email; preservar guardas de origem/chave privada. check completo, sem mutação remota nesta tarefa e sem mudar sessão/UI.
