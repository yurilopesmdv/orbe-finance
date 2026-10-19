# Orbe Finance

Gestão financeira pessoal para reunir contas, gastos por tipo/categoria, investimentos e cofrinhos. Primeiro uso: iPhone do proprietário, no Expo Go, com senha. Bancos prioritários atuais: Mercado Pago e Bradesco, contas PF confirmadas; Inter/Nubank ficam para expansão. Privacidade prevalece sobre gratuidade.

**Estado atual: execução retomada em 19/10/2026.** Interface demonstrativa com carteira, gastos e relatórios; backend próprio com proprietário restrito, login e bloqueio por segundo plano implementados. TypeScript, 207 testes e exportação iOS aprovados. Recuperação por e-mail e teste físico pendentes. Nenhum banco conectado; finanças reais continuam desligadas.

A ordem de trabalho é spec → plan → tasks → implement → validate. As specs foram escritas primeiro. Plano, microtasks e roadmap derivam desses requisitos; a implementação seguirá uma task por vez.

| Leia | Para quê |
|---|---|
| [Estado de retomada](roadmap/STATE.md) | Continuar entre sessões sem depender do chat |
| [Specs](specs/README.md) | Escopo, requisitos e critérios de aceite |
| [Investigação](docs/research/FEASIBILITY.md) | Expo Go, biometria, Open Finance e alternativas de custo |
| [Cobertura por banco](docs/research/BANK-COVERAGE.md) | O que consta na documentação e o que falta homologar |
| [Fontes oficiais](docs/research/SOURCES.md) | Evidências e data da consulta |
| [Revisão dos fornecedores](docs/security/VENDOR-REVIEW.md) | Achados, limites e aprovações ainda pendentes |
| [Modelo de ameaças](docs/security/THREAT-MODEL.md) | Destinos de dados, controles e riscos residuais |
| [Decisões](docs/decisions/DECISIONS.md) | Escolhas propostas, confirmadas e adiadas |
| [Runtime e estrutura](plan/T01-RUNTIME-STRUCTURE.md) | iPhone, SDK57, Node, limites e paths de implementação |
| [Contrato da ponte](plan/T74-BRIDGE-CONTRACT.md) | Autenticação, metadados, retenção e API da primeira fatia |
| [Plano vigente Meu Pluggy](plan/MEU-PLUGGY.md) | Automação PF, ponte privada e entregas pequenas |
| [Pesquisa de segurança Meu Pluggy](docs/security/MEU-PLUGGY-REVIEW.md) | Vulnerabilidades encontradas, limites e decisão |
| [Plano local anterior](plan/PF-IMPLEMENTATION.md) | Persistência no aparelho |
| [Plano gerenciado anterior](plan/PLAN.md) | Alternativa condicional, não caminho padrão da primeira fatia |
| [Microtasks](tasks/TASKS.md) | Dependências, entregas pequenas e validação |
| [Roadmap](roadmap/ROADMAP.md) | Marcos e gates de entrega |
| [Validação planejada](docs/VALIDATION.md) | Rastreabilidade dos requisitos e cenários futuros |
| [Revisão documental](docs/PLANNING-VALIDATION.md) | Verificações realmente feitas nesta etapa |
| [Orientações de trabalho](AGENTS.md) | Método e continuidade |

Meu Pluggy é o fornecedor selecionado para planejar a integração automática Bradesco/Mercado Pago PF. [SPEC-009](specs/009-meu-pluggy/spec.md) prevalece sobre a revisão local 0.3: Open Finance é a única origem financeira admitida. A pesquisa pública não encontrou evidência comprovada de falha grave vigente no próprio serviço; encontrou falhas corrigidas no integrador Actual Budget e um relato de cobertura dos cofrinhos MP. Isso não é auditoria nem garantia de ausência de vazamento.

Expo Go permanece restrito a dados sintéticos até validar runtime real, armazenamento e biometria. Senha e sessão da ponte são distintas do desbloqueio local. Pluggy/ponte processam a sincronização; IA/BI/analytics/ferramentas não recebem conteúdo financeiro. Nenhum banco conectado ou recurso contratado. Código atual é somente base demonstrativa e spike de acesso. Gate de dados reais permanece obrigatório.

[Como executar e validar](docs/DESENVOLVIMENTO.md). Auditoria de dependências e limites em [DEPENDENCIES](docs/security/DEPENDENCIES.md).
