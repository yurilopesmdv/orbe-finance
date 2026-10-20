# SPEC-009 — Integração automática Meu Pluggy

Estado: ready para R1 sintética; dados reais continuam bloqueados, revisão 0.4 de 16/10/2026. O usuário escolheu Meu Pluggy, condicionado à pesquisa pública de segurança. [Resultado da pesquisa](../../docs/security/MEU-PLUGGY-REVIEW.md): seguir no planejamento; produção depende de evidências próprias. Esta spec prevalece sobre a opção local sem agregador da revisão 0.3. A origem financeira é exclusivamente Open Finance.

| ID | Requisito |
|---|---|
| MPG-01 | DEVE usar exclusivamente Open Finance na conexão original do banco via Meu Pluggy, sem fallback por senha bancária, e priorizar sincronização automática Meu Pluggy para Bradesco e Mercado Pago PF; confirmar termos/cotas gratuitos pessoais antes de implementar, sem prometer gratuidade permanente ou de infraestrutura |
| MPG-02 | DEVE manter credenciais privilegiadas exclusivamente na ponte autenticada, sem incluir segredo no cliente; toda leitura/status/sincronização valida proprietário e vínculo do item/conta no servidor |
| MPG-03 | DEVE distinguir sessão da ponte e desbloqueio local; Face ID/desbloqueio do iPhone não substituem autorização HTTP, nem clientUserId enviado pelo cliente comprova propriedade |
| MPG-04 | DEVE respeitar as capacidades do proxy pessoal, manter lista autorizada de itens e mostrar data/parcialidade; não simular tempo real nem chamar refresh/listagem não disponíveis no plano |
| MPG-05 | DEVE homologar separadamente saldo, movimentos, investimentos e cofrinhos de cada banco; ausência não vira zero nem promessa de cobertura, com prevenção de dupla contagem |
| MPG-06 | DEVE bloquear dados reais até validar acesso, segredos, rede/logs, dependências e revogação/exclusão; pesquisa pública e criptografia declarada não certificam risco zero |
| MPG-07 | DEVE restringir destinatários ao banco, Pluggy e ponte aprovados para a sincronização, além do aparelho; nenhum envio financeiro a ferramentas de desenvolvimento, IA, analytics ou relatório externo |
| MPG-08 | DEVE preservar o último lote válido diante de indisponibilidade e distinguir revogação bancária, desvínculo no Orbe, apagamento local e solicitação de exclusão no fornecedor |

## Aceite futuro

- Sem sessão, com sessão expirada, identidade indevida ou item/conta sem vínculo, nenhuma rota financeira ou de status revela dados ou metadados privados; testar antes de consultar fornecedor.
- App distribuído, logs e erros sintéticos não contêm segredos; requisição alterada pelo cliente não amplia autorização.
- Fixtures de proxy sem listagem global/refresh, atualização diária, erro parcial e ausência de produto mantêm interface honesta e idempotência.
- Cofrinho MP não retornado e movimentos Bradesco indisponíveis aparecem como parcialidade datada, sem apagar valores válidos anteriores nem inventar zeros.
- Revogar impede nova coleta e evento atrasado não recria conexão apagada. Exclusão de backup do fornecedor só é afirmada com confirmação de alcance/retencão.

Senha/sessão continuam no escopo. Expo Go permanece ambiente sintético enquanto limitações de biometria/armazenamento do runtime real não forem resolvidas. Implementação sintética autorizada, uma task por vez; consentimento bancário permanece após gate.

## Contrato de arquitetura T74

A ponte é de leitura sob sessão e não persiste saldos, movimentos, posições ou relatórios. Atualização automática bancária ocorre no fornecedor mesmo com app fechado; o Orbe recebe e promove novos lotes ao abrir/retomar desbloqueado ou solicitar busca. Não prometer sincronização do cache local com o app fechado. Credenciais, vínculos e limites ficam no servidor, relatórios/categorias/metas no aparelho. [Contrato T74](../../plan/T74-BRIDGE-CONTRACT.md).

T13 materializa apenas metadados mínimos e vínculos sob RLS; ids externos privados, sem valores financeiros. Permissão de leitura de metadata exige proprietário global e dono da linha, não só sessão válida. Estado active exige evidência de Open Finance; nenhum item real será provisionado antes dos gates.

## MPG-09 — Núcleo da ponte em fatia sintética (T18a)

A ponte desligada DEVE responder indisponível sem consultar autenticação, metadados, fornecedor, corpo ou temporizador. Quando habilitada exclusivamente por fixture local, núcleo HTTP suporta apenas POST /connections/status com corpo JSON objeto vazio e limite16KiB. Token só no cabeçalho Bearer; não aceitar parâmetros de URL nem origem/owner/item informados pelo cliente. Port de autenticação deve retornar identidade verificada, autorização de proprietário e expiração; núcleo nega sessão ausente/expirada e segunda identidade antes de metadados. Cada resultado exige mesmo owner e schema/projeção explícita; IDs externos/PII/extras não retornam. Prazo total20s/cancelamento impede promoção tardia e início de próxima etapa; portas devem respeitar signal. Respostas no-store, sem CORS genérico, logs ou erro bruto. T18a não comprova JWT real, RLS em HTTP, Deno/deploy ou integração Pluggy; T18b validará adapters/runtime antes de publicar endpoint.

## MPG-10 — Portas REST isoladas por requisição (T18b1)

Autenticação DEVE consultar o servidor Auth do projeto fixo e a RPC de proprietário com o mesmo Bearer. Decodificar claims localmente não comprova assinatura; só usar identidade após resposta autenticada e correspondência de subject/issuer/aud/role/expiração. Porta de metadados recebe explicitamente o mesmo token validado da requisição, sem estado global/cache de sessão; RLS continua sob o JWT do usuário, sem service role. URLs/select/order/limit são constantes, sem IDs pessoais em query. Recusar redirects, cookies, resposta excessiva ou inválida; nenhuma resposta de erro bruta é publicada. Duas requisições concorrentes não podem trocar sessão. Habilitar adapter somente em testes locais nesta fatia, sem deploy ou fornecedor.

## MPG-11 — Validação de runtime desligado (T18b2)

Uma função de desenvolvimento PODERÁ ser publicada somente no projeto próprio Orbe com gate literal false, sem consultar env, Auth, DB ou provedor. Endpoint público sem sessão serve exclusivamente resposta503 genérica/no-store, independentemente de rota/corpo/token; não é rota financeira pública. Alterar esse gate exige task/gates próprios. Deploy não deve receber arquivos privados ou ler infraestrutura alheia; recusar função existente sem manifest local correspondente e não apagar funções. Validar runtime por HTTP sintético sem token real; não declarar adapters/fluxos reais homologados a partir de503.

## MPG-12 — Runtime separado de metadados (T18b3)

Status autenticado DEVE usar composição separada da ingestão financeira. Somente POST /connections/status e contrato MPG-09/10; nunca importar fornecedor, leases ou chave privilegiada. Configuração é capturada no boot: habilitação somente pela string literal `true`, origem HTTPS fixa Supabase e chave `sb_publishable_`. Desligado não lê origem/chave, request ou transporte. Configuração ausente/inválida/falha de leitura resulta503/no-store sem detalhes, sem rede e sem derrubar o handler. Não aceitar configuração de request ou habilitação financeira implícita. Sessão deve passar Auth remoto e orbe_has_session antes de RLS.

T18b3a cobre factory e testes locais, sem novo entrypoint publicado. T18b3b revisará empacotamento, configuração operacional, manifest e deploy separado; orbe-bridge publicado permanece literalfalse. HTTP positivo do proprietário e comportamento nativo permanecem na validação física final.

### MPG-12a — Entry point de status separado

T18b3b1 prepara somente orbe-metadata/index.mjs: delegar runtime MPG-12 com leitor Deno.env restrito aos três nomes previstos e fetch do host. Não ler configuração no corpo do request, nem importar módulo financeiro/serviço privilegiado. Ausência da flag mantém503 sem acessar origem/chave/rede. Hostmock deve provar esse comportamento e negação sem Bearer quando habilitado. Não adicionar configuração de deploy ativo nesta fatia; helper desligado verifica conteúdo exato dos dois entrypoints e recusa alteração indevida.

### MPG-12b — Caminho do runtime gerenciado

A composição metadata-only DEVE aceitar exclusivamente `/orbe-metadata/connections/status`, considerando prefixo de função documentado pelo Supabase. O core isolado mantém `/connections/status` por padrão; opção interna de composição permite somente esses dois caminhos literais, capturada no boot e nunca derivada do request. Prefixos de gateway, outra função, caminho sem prefixo no runtime metadata, queries e sufixos são recusados antes de autenticação/rede. Nenhum rewrite de Request/body/signal. T18b3b2a valida sinteticamente; HTTP real permanece T18b3b2b.
