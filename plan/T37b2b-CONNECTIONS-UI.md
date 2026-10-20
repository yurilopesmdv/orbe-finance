# T37b2b — tela privada de conexões

20/10/2026. UX-15/OF-22/SEC-21. Integrador único; depende T37b2a/statusruntime.

Paths: src/app/my-connections.tsx, account.tsx, settings.tsx, connections.tsx (atalho autenticado), config/runtime.ts, features/connections/presentation.ts e teste, checkpoints. Composição explícita somente metadata, fetch Expo instalado obrigatório. Não mudar launcher/env públicas, não dependência nova.

useFocusEffect cria controller por foco/sessão, cleanup close. useSyncExternalStore snapshot seguro/estável, seleção da confirmação apenas ID/revisão/banco em memória e removida no lock/blur/mudança de fase. Confirmar remoção em Modal acessível, limpar alvo antes de invoke; actions desabilitadas em loading/working. Botão de nova autenticação bloqueia sessão e vai ao login sem persistir alvo. Erros genéricos; status efetivo de autorização vencida/desconhecida em presenter puro. Datas Brasília via Intl, sem valores financeiros.

Aceite typechecks/testes/export iOS e scan de PAT/ownerUUID no bundle. Testes de presenter para limites/unknown/capacidade; lifecycle testado T37b2a. Navegação/modal/VoiceOver/login titular em aparelho ficam checklist final, sem simular teste físico.
