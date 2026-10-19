# T12 — Bloqueio e ciclo de vida

T12a done; T12b físico pendente. 19/10/2026. AUTH-04/05/07. Responsável sequencial. T11b login implementado; recuperação T11c independente. Paths src/features/auth/lifecycle.ts/provider.tsx, login/account, testes e checkpoints.

Adapter sem React observa fonte de eventos e estado inicial; trata somente active como ativo, desliga callbacks após cleanup. Ligar ao SessionModel já testado (cancela geração, timer, tokens e leituras). Login limpa campos ao perder active; rota account não monta conteúdo bloqueado. Sem API biométrica falsa. Testar estado inicial/eventos/retorno/cleanup e corrida com login. TypeScript/suíte/bundle e scanner. Teste físico permanece ao final por pedido do usuário, sem dizer que snapshot iOS foi blindado.

## Evidência T12a

TypeScript e165 testes passaram (5 novos de ciclo de vida, além das corridas/expiração na sessão). Bundle Hermes iOS gerado (2,5MB); PAT/UUID privado ausentes nos artefatos. Provider e formulário ligados ao AppState; conta protegida redireciona quando bloqueada. Teste físico/VoiceOver/alternador nativo continuam T12b/T38/T45/T53. Não é garantia contra gravação/captura em Expo Go.
