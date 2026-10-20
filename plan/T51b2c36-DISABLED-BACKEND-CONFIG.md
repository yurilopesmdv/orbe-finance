# T51b2c36 — Preparar segredos do backend com flagsfalse

MPG-50. Integrador único. Depende MPG-49/46. Paths: scripts/financial-config.py, tests/admin/financial_config_test.py, package/spec/TASKS/STATE/ACCOUNT-ACTIVATION/RELEASE-READINESS. SemleiturasPluggy/tabelasfinanceiras.

1. Fixar projeto e provar guard/recibos/migrations antes de preparar7segredos.
2. Ler perfil0600 e chavesdo próprio projeto em memória, comparar digestsecret; preservarmetadata/Auth/outrossegredos e recusarconflitos.
3. Configurar somentefaltantes false, verificar digests e hashesdeartefatos; reconciliar sóversõeslegítimas de funçãodevidoà atualizaçãodeambiente.
4. Testar cenárioidempotente/conflito/preservação/hashmismatch/digestinvalid/semfinanças e executarconfigdesativada real, smokes e checkpoint.

Aceite: flagsfalse verificadas, nenhuma keyapiPluggy persistida e nenhuma conta consultada; nenhum comando de ativação oferecido neste helper. Bloqueios de privacidade/OF/dependências/homologação continuam separados.
