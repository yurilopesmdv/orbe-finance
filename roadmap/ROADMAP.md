# Roadmap do Orbe Finance

Referência: 16/10/2026. Roadmap por capacidade e gates, sem prazos fictícios de calendário. Esta etapa termina em R0. [Estado atual](STATE.md) é o ponto de retomada entre sessões.

| Marco | Entrega | Gate de saída | Estado |
|---|---|---|---|
| R0 | Specs, investigação, ADRs, plano, microtasks e continuidade | Revisão documental, rastreabilidade, limites conhecidos e zero implementação | Documentos preparados |
| G1 | Decisões e spikes iniciais T01–T06 | Runtime/contratos/primeira fatia definidos; usuário autorizou fase de implementação | Pendente |
| R1 | Base segura, relatórios e visão sintética T07–T38/T50–T62, conforme dependências | Login/bloqueio/RLS/cálculos e fluxo no iPhone comprovados | Não iniciado |
| G2 | Integração real | T63 resolvida: fornecedores, runtime, destinos, chaves, riscos e controles validados com sintéticos antes de consentimento bancário | Bloqueado por decisões de segurança |
| R2 | Dados de Mercado Pago, Bradesco, Inter e Nubank, T39–T45, T47–T63 conforme dependências | Quatro fichas homologadas ou redução de escopo aceita; distribuição privada e reconciliação comprovadas | Não iniciado |
| R3 | Build compatível e Face ID T46 + tasks a detalhar | Decisão explícita de distribuição, validação real de biometria e fallback | Deferred |

G2 não autoriza contratar plano pago. Caso o modo pessoal não suporte algum produto, classificar o banco/produto como parcial, registrar evidência e apresentar alternativas. Não substituir o pedido original por dados fictícios nem rebatizar falha como entrega completa.

## Ordem das próximas fatias

1. Fechar detalhes de aparelho/runtime, produtos de reserva e contratos; usar a pesquisa existente, sem reiniciar tudo.
2. Após autorização da fase, provar autenticação e domínio com dados sintéticos, incluindo cenários negativos.
3. Integrar fonte pessoal no backend e reconciliar primeiro banco antes de expandir.
4. Validar cada instituição e a visão conjunta; só depois fechar release pessoal.
5. Avaliar biometria caso o proprietário aceite sair do Expo Go.

## Revisão contínua

Ao concluir cada task ou identificar nova limitação: atualizar status, próxima ação e dependências em STATE/TASKS. Antes de encerrar sessão ou quando o contexto começar a ficar extenso: checkpoint completo com commit e evidências. Como regra operacional proposta, revisar o checkpoint no máximo a cada 30 minutos de trabalho ativo e sempre antes de uma interrupção. A referência do usuário a cinco horas motiva persistência em arquivo; não existe reinício automático ou agendamento de agentes configurado por este plano.

Backlog posterior: importação CSV/OFX, cartão/fatura completos, orçamento, recorrências, exportação, notificações e análises mais profundas de carteira. Cada item precisa de nova spec ou extensão identificada antes de virar task. Não há função de pagamento/recomendação financeira escondida no backlog técnico.

## Prioridade atual

A revisão de privacidade adicionou SPEC-006/007 e T47–T63. Privacidade prevalece sobre gratuidade; fornecedores continuam não aprovados. R1 inclui relatórios internos com sintéticos; uso real exige gate próprio, sem assumir que Expo Go ou build nativo já atendem aos controles. O produto permanece em planejamento e sem consentimentos bancários.
