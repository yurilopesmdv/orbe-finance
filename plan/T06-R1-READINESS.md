# T06 — Prontidão da primeira fatia sintética

Estado: done, 16/10/2026. PRD-06. Dependências T02/T03/T04/T05/T47/T48/T49/T74 concluídas em seus escopos registrados, sem homologação bancária real.

## Escopo ready

- SDK57, Node22.23.2, iPhone informado e paths definidos em T01.
- Máquina de sessão isolada validada com 20 testes em T02; adaptador Supabase real e UI/AppState física permanecem futuros.
- Uso pessoal e lacunas Open Finance documentados em T03, sem consentimento.
- Contrato financeiro e 14 fixtures definidos em T04; implementação dos cálculos ainda futura.
- Wireframe local de cinco fluxos/estados em T05; sem promessa de acessibilidade física testada.
- T47 concluiu diligência com resultado bloqueado para real; T48 descreve plaintext/chaves; T49 seleciona runtime sintético e bloqueia real. Nenhuma dessas conclusões certifica fornecedor.
- T74 define ponte de leitura, metadados RLS e relatórios locais, sem cron/webhook.

## Mudanças de estado das specs

Ready aplica-se apenas aos contratos da R1 sintética. Critérios reais de cobertura/autenticação/criptografia não foram satisfeitos. Todos os requisitos permanecem rastreados no backlog; não marcar validated por existir doc ou mock.

Próxima T07: bootstrap Expo SDK57 com configuração sem segredos, rotas mínimas de demonstração, tipos/checks e bundle iOS. Não provisionar Supabase, chamar Pluggy, introduzir login falso que pareça real ou apresentar finanças inventadas como contas do titular. Se versão do registry/template divergir da matriz documental, registrar falha e resolver antes de instalar substituto.

## Validação desta task

Conferência de dependências e evidências anteriores, links/requisitos/grafo documental e git diff --check. Testes do spike continuam 20 pass na T02; não são testes do app ainda inexistente. Smoke físico do iPhone depende de T07/T38 e será registrado como pendente até ocorrer.
