# Roadmap vigente — contas PF e privacidade

Revisão 0.3 de 16/10/2026. [SPEC-008](../specs/008-personal-data/spec.md) e [plano PF](../plan/PF-IMPLEMENTATION.md) governam a primeira fatia. Contas pessoais PF confirmadas; prioridade Bradesco/Mercado Pago. Inter/Nubank ficam em expansão.

| Marco | Resultado | Tasks / saída | Estado |
|---|---|---|---|
| R0 | Pesquisa, specs, decisões, plano e continuidade | Documentos coerentes; zero código | Revisado |
| L0 | Contratos locais, formatos e runtime | T64/T65; restrições de segurança/custo explícitas | Não iniciado |
| L1 | Cofre local, senha/Face ID e entrada sintética | T66–T69; chaves, dados e regras comprovados em ambiente sintético | Não iniciado |
| L2 | UI simples e relatórios profundos locais | T70; resumo → relatório → dados, sem saídas externas | Não iniciado |
| L3 | Aceite privado da capacidade local | T71/T73; controles testados e riscos residuais conhecidos antes de conteúdo real | Não iniciado |
| A0 | Viabilidade de API direta PF | T72; acesso/custo/cobertura/permissões oficiais por banco | Pendente, sem conexão habilitada |
| A1 | Integração automática, se viável | Nova revisão de spec/contrato/ponte antes de tasks de conexão | Não autorizada nesta etapa |

L3 não equivale a A1 nem satisfaz sozinho o objetivo original de Open Finance. Entrada local/manual é capacidade/contingência identificada; integração automática permanece uma pendência, não uma promessa falsa. Preços de API e distribuição iOS são avaliados separadamente. Nenhum serviço será contratado ou consentimento aberto durante planejamento.

Trilha de cloud/worker/agregador anterior fica condicional; não executar só porque há tasks detalhadas. O produto não depende de Supabase/Pluggy para a base selecionada. Se surgir API PF elegível, avaliar segredo e operações efetivamente permitidas — credencial com poderes amplos não vira read-only porque o código usa apenas GET.

Checkpoint ao concluir task e antes de interrupção; registrar responsável, paths, requisito, commit, evidência e próximo ID em STATE. A referência a cinco horas não configura execução automática. A cada sessão, conferir estado real antes de continuar.
