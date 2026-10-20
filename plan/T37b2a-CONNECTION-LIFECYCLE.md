# T37b2a — lifecycle metadata-only

20/10/2026. OF-22/OF-20/21, SEC-08/14/21. Integrador único; depende T33b1/T37b1.

Paths: controller.ts/status.ts types, commands.ts abort externo opcional, testes commands/controller, package.json, documentação.

Controller injetado SessionAccess assert/get/subscribe, statusReader e commands; enabledfalse zeroports. Assinar sessão, encerrar imediato fora unlocked, recheck após subscribe. Snapshot estável para useSyncExternalStore; closed permanente, nenhuma reabertura no mesmo objeto. Refresh único com AbortController/generation, clear pré-request, no polling. Controls só lista ready/ID/rev e pause active, clear antes de iniciar, status incompleto/erro gera uncertain sem lista. true seguida de refresh não repete mutação e publica apenas resultado fresco. close aborta qualquer operação, listener e latecompletion ignoradas.

Comandos pause/remove recebem segundo AbortSignal opcional; preabort zero rede, abort cancela request/stream e nunca confirma sucesso tardio. Timeout não garante rollback remoto.

Aceite check completo com lock/unmount/late/reentrância, erro/statusfalso, refresh póscomando, stale target/busy e não reabrir. Sem UI ou financeiro nesta fatia. T37b2b conecta UI e confirma exclusão/reautenticação.
