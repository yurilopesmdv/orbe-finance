# Orbe Finance

Gestão financeira pessoal para reunir contas, gastos por tipo/categoria, investimentos e cofrinhos. Primeiro uso: iPhone do proprietário, no Expo Go, com senha. Bancos prioritários atuais: Mercado Pago e Bradesco, contas PF confirmadas; Inter/Nubank ficam para expansão. Privacidade prevalece sobre gratuidade.

**Estado atual:23/10/2026 — carteira automática, Nubank e cache criptografado local publicados para Expo Go.** [QR e link de acesso](docs/EXPO-PREVIEW.md). Home privada consolida contas/investimentos/movimentosrecentes; dados permanecem ao navegar e atualizam automaticamente. [Funcionamento](docs/FINANCIAL-HOME.md). Carteira/gastos/metas/relatórios demonstrativos continuam separados.A versão publicada e as mudanças posteriores têm evidências separadas no [estado atual](roadmap/STATE.md). Hotfix de inicialização confirmado pelo titular; novo fluxo **Criar meu acesso** em [primeiro acesso](docs/OWNER-ACCESS.md). Outros cadastros permanecem desabilitados. **Manter meu acesso neste iPhone** permite retomar online por token protegido sem salvar senha; [instruções](docs/REMEMBERED-ACCESS.md). Proteção nativa de tela/multitarefa publicada, com captura e multitarefa confirmadas pelo titular; [roteiro](docs/SCREEN-PROTECTION.md). Leitura pessoal Mercado Pago e ativação na sessão do titular estão habilitadas; Mercado Pago/Bradesco ativos; Nubank validado e cadastrado para preparação/ativação automática na sessão do titular. Novos bancos suportados pelo botão Adicionar banco, sem copiar Item ID no fluxo normal. Cache criptografado fica neste iPhone ao fechar; logout/clear apagam. [Guia atual](docs/AUTOMATIC-WALLET.md). Titular confirmou valores de saldos e movimentos. InvestimentosMP terminaram sem posições recebidas; [cobertura/cofrinhos](docs/BANK-COVERAGE.md). Tema grafite/violeta publicado; [cartões/faturas mapeados](specs/011-credit-cards/spec.md), ainda não implementados. Nova interface ainda requer aceite no aparelho. Face ID e recuperação por e-mail continuam desativados. [Prontidão e limites](docs/RELEASE-READINESS.md).

A ordem de trabalho é spec → plan → tasks → implement → validate. As specs foram escritas primeiro. Plano, microtasks e roadmap derivam desses requisitos; a implementação seguirá uma task por vez.

| Leia | Para quê |
|---|---|
| [Meus investimentos](docs/INVESTMENT-ACCESS.md) | Bruto/líquido/data, fluxo implementado e limites de cofrinhos |
| [Minhas movimentações](docs/MOVEMENT-ACCESS.md) | Tela preparada, leitura parcial e estado de ativação |
| [Estado de retomada](roadmap/STATE.md) | Continuar entre sessões sem depender do chat |
| [Specs](specs/README.md) | Escopo, requisitos e critérios de aceite |
| [Investigação](docs/research/FEASIBILITY.md) | Expo Go, biometria, Open Finance e alternativas de custo |
| [Cobertura por banco](docs/research/BANK-COVERAGE.md) | O que consta na documentação e o que falta homologar |
| [Fontes oficiais](docs/research/SOURCES.md) | Evidências e data da consulta |
| [Revisão dos fornecedores](docs/security/VENDOR-REVIEW.md) | Achados, limites e aprovações ainda pendentes |
| [Privacidade do plano pessoal](docs/security/MEU-PLUGGY-PRIVACY-EVIDENCE-20261020.md) | Evidência pública, MCP, exclusão e lacunas específicas |
| [Patches compatíveis SDK57](docs/security/EXPO-PATCH-REVIEW-20261021.md) | Atualização21/10, hashes do transporte e validação |
| [Revisão do transporte iOS](docs/security/EXPO-FETCH-REVIEW-20261020.md) | Cache, cookies, redirecionamentos e limites do Expo Go |
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

Expo Go permanece restrito a dados sintéticos até fechar os gates de runtime, dependências e fornecedor. FaceID segue adiado; o caminho atual é online e com cache financeiro volátil. Senha e sessão da ponte são distintas do desbloqueio local. Pluggy/ponte processam a sincronização; IA/BI/analytics/ferramentas não recebem conteúdo financeiro. Bradesco e Mercado Pago foram conectados pelo titular no portal pessoal; o Orbe ainda não coleta valores. Contas, movimentos e investimentos têm cadeias implementadas e validadas com dados fictícios, sem coleta ativa. Nenhum recurso pago contratado. Gate de dados reais permanece obrigatório.

[Como executar e validar](docs/DESENVOLVIMENTO.md). Auditoria de dependências e limites em [DEPENDENCIES](docs/security/DEPENDENCIES.md).

[Acesso às contas](docs/ACCOUNT-ACCESS.md) · [Ativação conjunta e pendências](docs/ACCOUNT-ACTIVATION.md). Tela e cadeia de saldos preparadas em fixtures; gates reais continuam desligados. Retomada sem senha/captura/multitarefa confirmadas pelo titular.

Situação atual e pendências: [PRODUCT-STATUS](docs/PRODUCT-STATUS.md). Categorias e relatórios reais: [SPEC013](specs/013-real-spending/spec.md).
