# T50a — Segredos fora do Metro

Estado: done. Requisitos SEC-02/10/11/18/19. Dependências T08/T51a. Responsável: integrador único.

## Contrato

Migrar automaticamente o conteúdo administrativo já existente para ~/.config/orbe-finance/backend.env (diretório0700/arquivo0600), sem imprimir/copiar para artefatos. Manter .env.backend.local ignorado contendo exclusivamente ORBE_BACKEND_ENV_FILE com caminho absoluto desse destino. Helpers aceitam somente esse destino fixo, sem fallback global se ponteiro ausente; recusam symlinks, duplicatas e valores misturados. Arquivos inline antigos são recusados; testes usam ambiente temporário com destino privado explicitamente substituído. Migração não sobrescreve destino divergente; verifica bytes antes de substituir origem.

metro.config.cjs preserva configuração Expo e acrescenta exclusões para dotenv, backend.env e arquivos privados comuns, mesmo disfarçados com extensão JS. Nenhum servidor LAN/túnel será iniciado. Não mudar HOME nem credenciais Expo globais. Sanitização do launcher/perfil Expo é T50b separada antes de nova sessão LAN.

## Paths

specs/006-security/spec.md; plan/T50a-DEVELOPMENT-SECRETS.md; scripts/backend-admin.py; metro.config.cjs; tests/admin/backend_admin_test.py; tests/security/metro-secrets.test.mjs; package.json; docs/security/DEVELOPMENT-SECRETS.md; tasks/TASKS.md; roadmap/STATE.md; AGENTS.md. Arquivos privados locais são migrados fora do Git.

## Aceite e evidência

1. PAT/ref/UUID preservados, origem contém apenas ponteiro; modos privados conferidos, sem conteúdo em output.
2. Helper inspeciona somente projeto Orbe usando nova resolução; testes rejeitam ponteiros inválidos/mistos/duplicados/symlinks.
3. Crawler Metro real indexa canário dotenv antes e recusa depois, mantendo módulo JS público. Não solicitar arquivo real pelo servidor.
4. TypeScript/testes/export iOS, scan privado dos artefatos e diff check aprovados. Documentar limites e próxima T50b, depois T18a.

## Resultado

224 testes e TypeScript aprovados; 19 guardas administrativos (7 novos) e crawler Metro real (1 novo). Export iOS Hermes concluído; PAT/UUID ausentes dos artefatos. Inspect remoto confirmou Orbe, 5 tabelas, 3 migrations e política Auth vigente usando arquivo externo. Não abriu Metro LAN.
