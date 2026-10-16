# ADR-010 — Núcleo local para contas PF

Estado: direção técnica selecionada em planejamento; controles ainda não implementados/validados. Data: 16/10/2026. Base: usuário confirmou todas as contas PF e delegou escolha técnica desde que preserve privacidade. [Investigação](../research/PERSONAL-ACCOUNTS.md) e [SPEC-008](../../specs/008-personal-data/spec.md).

## Decisão

1. Priorizar Bradesco e Mercado Pago na primeira fatia; Inter/Nubank ficam em expansão futura.
2. Construir a capacidade financeira local: persistência criptografada, categorias, carteira/cofrinhos e relatórios no iPhone. Não adotar Supabase/Pluggy como dependência do núcleo nem abrir consentimento bancário durante pesquisa.
3. Provar formatos oficiais de importação e entrada manual como contingência local, sempre datados e identificados. Isso não substitui o requisito de automação nem autoriza declarar a integração concluída.
4. Manter pesquisa de APIs diretas PF separada, com gates de elegibilidade, custo, privilégio, revogação e cobertura. Não usar endpoints privados/reversos, scraping, senha de internet banking ou tokens de produção no app.
5. Autenticação do núcleo é local; não requer conta cloud/e-mail para um único proprietário. Criptografia, gestão de chave, biometria e recuperação precisam de contrato e testes antes de dados reais.
6. Expo Go serve aos sintéticos; build privado para controles nativos de uso real será preparado apenas em fase autorizada, com distribuição/custo esclarecidos antes de instalar/contratar.

## O que esta decisão substitui

As propostas gerenciadas das ADR-002/003/006 não são o caminho padrão da base. Plano e tasks anteriores de servidor ficam em trilha condicional, não podem ser implementados automaticamente. As regras financeiras, UX, segurança e relatórios das specs existentes permanecem. SPEC-008 governa diferenças em autenticação, persistência e fonte. Trata-se de revisão identificada do contrato, não substituição silenciosa do produto por protótipo offline.

## Consequências e riscos

Menos destinatários de conteúdo financeiro sob controle do Orbe; sem justificativa para analytics/IA/BI ou operação de banco na nuvem. Ainda existe risco no aparelho e arquivos originais; não afirmar risco zero. Sem backup/recuperação aprovados, perder aparelho/chave pode perder organização local. Automação completa permanece não resolvida — ausência de prova pública não é impossibilidade técnica, mas impede prometer resultado.

## Reconsiderar quando

Acesso PF oficial e adequado for comprovado; ou o titular decidir aceitar um processador específico depois da diligência. A decisão deverá registrar mudanças no inventário de dados, riscos, custos e critérios de aceite antes de habilitar a integração.
