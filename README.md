# Orbe Finance

Gestão financeira pessoal para reunir contas, gastos por tipo/categoria, investimentos e cofrinhos. Primeiro uso: iPhone do proprietário, no Expo Go, com senha. Bancos prioritários: Mercado Pago, Bradesco, Inter e Nubank; preferência por integração gratuita de uso pessoal.

**Estado atual: investigação e planejamento. Zero implementação.** Não há app executável, backend provisionado, dependências ou bancos conectados. O Face ID está previsto para uma etapa com runtime compatível; sua limitação no Expo Go está registrada na pesquisa.

A ordem de trabalho é spec → plan → tasks → implement → validate. As specs foram escritas primeiro. Plano, microtasks e roadmap derivam desses requisitos; a implementação aguarda autorização de nova fase.

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
| [Plano](plan/PLAN.md) | Arquitetura, modelo conceitual, segurança e sequência |
| [Microtasks](tasks/TASKS.md) | Dependências, entregas pequenas e validação |
| [Roadmap](roadmap/ROADMAP.md) | Marcos e gates de entrega |
| [Validação planejada](docs/VALIDATION.md) | Rastreabilidade dos requisitos e cenários futuros |
| [Revisão documental](docs/PLANNING-VALIDATION.md) | Verificações realmente feitas nesta etapa |
| [Orientações de trabalho](AGENTS.md) | Método e continuidade |

O candidato de custo é Meu Pluggy + conector pessoal, sem aprovação de segurança para dados reais. O uso depende de termos/cobertura, decisão de confiança e gate da SPEC-006. Não há promessa de tempo real, cofrinhos identificados em todos os bancos ou gratuidade de toda a infraestrutura. Nenhum plano pago foi contratado.

Privacidade prevalece sobre gratuidade. Expo Go fica restrito a dados sintéticos até definir o ambiente real. UI proposta: resumo simples, relatórios internos e detalhe de cada total, sem IA/BI externo. Nenhum sistema ou fornecedor foi declarado livre de toda possibilidade de vazamento.
