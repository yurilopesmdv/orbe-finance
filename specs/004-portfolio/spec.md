# SPEC-004 — Contas, investimentos e cofrinhos

Estado: ready para R1 sintética; dados reais continuam bloqueados. Depende de SPEC-000/002. A carteira organiza fatos importados e reservas; não inicia movimentação de dinheiro.

| ID | Requisito |
|---|---|
| PORT-01 | DEVE mostrar saldo contábil/disponível/reservado com semântica explícita, instituição, moeda e data de referência |
| PORT-02 | DEVE mostrar posições de investimentos por instituição e classe, distinguindo líquido/bruto, ausência de valor e cobertura incompleta |
| PORT-03 | DEVE permitir visualizar reservas identificadas na fonte e associar metas/nomes locais aos ativos existentes |
| PORT-04 | DEVE impedir dupla contagem entre saldo, investimento automático e cofrinho, com reconciliação auditável e indicação de sobreposição desconhecida |
| PORT-05 | DEVE manter origem, ID, moeda, data e qualidade de cada componente do consolidado; ativos sem valor não são saldo zero |
| PORT-06 | DEVE separar variação patrimonial de rentabilidade e não calcular retorno confiável só com diferença entre dois saldos |
| PORT-07 | DEVE suportar reserva local como alocação virtual de ativo existente, sem criar saldo adicional ou executar transferência |

## Vocabulário e composição

Saldo disponível, saldo total e limite de crédito não são intercambiáveis. Limite de cartão/cheque especial não entra como ativo. Investimento com valor de resgate desconhecido não é caixa disponível. Snapshot de ontem pode coexistir com saldo de hoje, mas a visão deve indicar defasagem por fonte e escopo.

Uma caixinha pode chegar como posição de investimento, reserva dentro da conta, conjunto de posições ou não chegar separada. Não inferir produto exato pelo nome de marketing. O campo reservado pode também representar bloqueio judicial: não converter toda reserva da fonte em cofrinho de meta.

Componentes canônicos devem ter relação explícita included_in/allocated_from quando uma fonte já incorpora outro valor. Uma reserva é uma visão/alocação, não um ativo extra. A relação precisa ser comprovada por contrato do campo e reconciliação do banco; nomes iguais não bastam.

Total de ativos BRL reconciliados = soma de componentes canônicos incluídos uma única vez. Valores de reservas alocados sobre esses componentes não são adicionados novamente. Onde a relação for desconhecida, mostrar subtotais separados e “Total parcial — sobreposição a conferir”, excluindo os componentes ambíguos da soma reconciliada. Não apresentar esse subtotal como patrimônio completo. Patrimônio líquido, passivos integrais e câmbio não são entregas iniciais.

Exemplo de regra proposta: conta total de R$ 1.000 já inclui reserva de R$ 200. Exibir conta R$ 1.000, reservado R$ 200 e livre R$ 800 somente se os campos da fonte comprovarem essa relação. Total de ativos continua R$ 1.000, e não R$ 1.200. Se a conta reportar apenas R$ 800 livres e um investimento distinto de R$ 200 fora dela, a soma poderá ser R$ 1.000 após reconciliação.

Meta local: título, valor-alvo, prazo opcional e alocações em ativos. Soma de alocações locais por ativo não ultrapassa o valor conhecido; validar concorrência transacional no repositório local, conforme T74. Não alocar novamente parte já reservada na fonte sem identificar que se trata da mesma reserva. Desvincular meta não resgata o investimento.

## Aceite

- AC-P01: conta R$ 1.000 incluindo caixinha de R$ 200 totaliza R$ 1.000; a seção Cofrinhos não aumenta o consolidado.
- AC-P02: investimento com valor null aparece sem valor disponível e deixa total parcial; não apresenta R$ 0,00.
- AC-P03: mesmo ativo em duas origens exige reconciliação; ambiguidade é visível, sem soma dupla.
- AC-P04: meta aloca R$ 100 de um ativo de R$ 150; segunda meta tenta R$ 100: impedir excesso, inclusive em duas gravações concorrentes.
- AC-P05: saldo cai R$ 100 após resgate; a tela não declara prejuízo de R$ 100 sem analisar fluxos.
- AC-P06: saldo reservado sem natureza conhecida fica “Reservado pela instituição”; não recebe rótulo de caixinha inferido.

## Contrato puro T24

Componentes canônicos carregam ID, moeda, centavos ou null, data da fonte ou null e natureza explícita: ativo, alocação ou limite. Ativos têm relação distinct/included/unknown; relação included precisa de pai comprovado na mesma moeda. Ciclos, IDs conflitantes e referências de inclusão inconsistentes falham; pai ausente, valores ausentes e sobreposição desconhecida produzem subtotal parcial. Alocações/limites nunca acrescentam patrimônio. Valores negativos de ativo ficam fora do subtotal de ativos e sinalizam parcialidade, sem apagá-los da origem ou convertê-los em zero. Datas diferentes são sinalizadas. Variação entre snapshots não recebe nome de rentabilidade, mesmo descontando fluxos.

## Recorte T31a — carteira demonstrativa

Separar contas, investimentos e reservas; filtrar instituição mantendo componente incluído junto de seu pai. Mostrar subtotal parcial calculado, fonte/data e valores ausentes. Reserva incluída aparece como detalhe e nunca ativo adicional. Não inferir liquidez/disponível/retorno se fonte não separar. Moeda BRL explícita no cenário; nenhum câmbio implícito. Valores seguem a preferência compartilhada de ocultação. T31b exige T27b, cobertura por instituição e homologação física; T32 mantém gestão de metas/alocações fora deste recorte.

## Recorte T15a — snapshots voláteis de ativos

Reusar guard principal/geração do ledger, sem disco/rede. Import ticket por conexão/produto (conta/investimento/reserva), com instituição enumerada e ownerSubject da entrada igual ao principal. Cada componente mantém moeda/asOf/null/relação; campos extras são descartados. Mesmo ID não troca conexão/produto silenciosamente; inclusão entre conexões é negada. Pai ainda não recebido deixa parcial até reconciliação.

Promover somente lote completo validado; ticket anterior no mesmo escopo é stale. Snapshot não autoritativo mescla itens e mantém subtotal parcial, sem apagar ausentes. Somente evidência explícita de snapshot autoritativo permite substituir todo o produto, inclusive vazio confirmado; remover pai não transforma filho órfão em dinheiro adicional. Informações faltantes de outros produtos/fontes continuam responsabilidade do controller, e sourceComplete é false por padrão. Não inferir rendimento, liquidez ou história. T15b exige runtime/persistência protegidos.

Guard T15a é verificação por operação. Controller privado futuro deverá fechar/purgar o store imediatamente ao bloquear; esta classe volátil não assina Auth por conta própria.

## Recorte T16a — metas/alocações voláteis

Metas têm título, moeda, alvo positivo em centavos e prazo civil opcional. Alocação é apenas associação local a raiz canônica distinta; nunca transferência, compra/resgate ou ativo extra. Orçamento por raiz traz revisão, valor alocável explícito, data e confirmação de que reservas da fonte já foram excluídas. Não inferir valor livre por diferença de campos sem prova. Raiz incluída/limite/ambígua é recusada como novo orçamento.

Aumentar alocação exige orçamento conhecido/data/confirmado, moeda igual e revisão corrente. Soma entre metas não excede valor alocável; operação síncrona valida candidato antes de trocar estado. Duas chamadas concorrentes em JS são serializadas; isso não prova transação SQLite da T16b. Atualização da fonte que reduza o orçamento não apaga associações: sinalizar excesso e permitir reduções/remoções, impedir aumentos. Desvincular/excluir meta não altera posições importadas.

Revisão de orçamento deve aumentar; mesma revisão divergente é conflito, data anterior é stale. Fonte desconhecida bloqueia aumento sem converter null em zero. Guard principal/geração e close iguais a T14a/T15a. Associação de meta a reserva já existente da fonte não consome novamente parte livre e será tratada na integração T32/T16b; este recorte aloca apenas valor não reservado comprovado. Sem persistência financeira real.

## Recorte T32a — metas na demonstração

Destino secundário /goals pela Carteira, sem nova aba. Criar meta com título, alvo e prazo opcional, associar valor não reservado do exemplo Bradesco e remover associação/meta com confirmação. Labels explicam organização local, sem resgate/transferência; fonte/data e orçamento inventado explícitos. Money compartilhado mascara valores e acessibilidade. Formulário usa parse exato de centavos e data civil brasileira; limpar campos no background.

DemoProvider compartilha metas na sessão e reset ao sair descarta o store anterior. Recarregar movimentos não apaga metas. Seed: raiz Bradesco inventada, orçamento não reservado explicitamente conhecido; investimento/MP desconhecido não viram orçamento. Vinculação a reserva existente da fonte e persistência real continuam T32b/T16b. A integração deve validar também soma segura de alocações por meta antes de promover candidato, não só por raiz.

Títulos livres de metas podem conter valores; no modo oculto, o título salvo e o rótulo acessível que o repete também usam nome genérico. Erro de formulário deve aparecer na meta correspondente e ser anunciado sem repetir dados digitados.

T51a: includedIn quando presente deve ser string não vazia. Null/número/array/objeto não são identificadores, mesmo que truthy; recusar antes de manter o componente no cache. Pai escalar válido ausente continua parcial como antes.

## PORT-08 — Posições e reservas canônicas (T23a)

Normalizador interno DEVE ficar desligado antes de tocar conteúdo/contexto e aceitar somente IDs internos vinculados à conexão/produto do contexto confiável. Posição preserva grossCents/netCents separados e valueBasis explícito gross/net/unknown; amountCents deriva apenas da base declarada, sem preferência automática, soma dos dois ou promessa de liquidez. Unknown produz amountCentsnull mesmo com bruto/líquido disponíveis. Sem centavos falsos por conversão/arredondamento; negativos preservados e fora do subtotal de ativos.

Produto investment/reserve, classe e natureza asset/allocation são explícitos. Alocação nunca aumenta ativos; investimento deve ser asset. Relação distinct/included/unknown e pai interno autorizado(product,id) são obrigatórios como evidência do adapter futuro, sem inferência por nome de caixinha. Included exige pai na mesma conexão, sem self/ciclo; pai permitido ainda ausente deixa subtotal parcial. Extras/nomes/CPF/números/payload externo não são projetados. Chave namespaceada compatível com contas T21a.

Fonte/data/ausência/autoridade explícitas, duplicatas idênticas idempotentes e divergentes rejeitadas; limites1000linhas/cursor512/10000vínculos. DTO canônico não comprova semântica do fornecedor, consentimento, liquidez ou cobertura de cofrinho. T23a devolve OwnedPosition com metadados de valuation, mas MemoryAssets ainda não os conserva: T23b1 fará retenção explícita antes do staging T23b2. Não declarar posição completa após cache que descarte bruto/líquido.

## PORT-09 — Valuation preservado no cache volátil (T23b1)

Cache DEVE conservar os quatro campos opcionais como conjunto completo (grossCents/netCents/valueBasis/assetClass) em investimentos/reservas; campo isolado ou base incompatível com amountCents invalida lote antes de swap. Contas não recebem esse conjunto. Fixtures legadas sem os quatro continuam válidas, com valuation ausente/desconhecido; não inventar bruto/líquido/classe a partir de saldo. Saída inclui somente primitivos projetados, sem owner/extras; conflitos de valuation no mesmo ID não podem desaparecer no dedupe. Falha/guard obsoleto conserva valores e metadata anteriores, sem alterar política de ausência/reconciliação.

## PORT-10 — Staging concreto de posições/reservas (T23b2)

Staging de investment/reserve DEVE usar normalizador concreto T23a e contexto vinculado capturado, preservando valuation T23b1. Gates desligados não tocam conteúdo/contexto/store. Recibos locais devem mapear produto singular do cache ao plural do coordenador, somente este produto; fonte mista/desconhecida/parcial em qualquer página impede remoção por ausência. Validar todas posições/pais/ciclos entre páginas antes do swap, com guard fresco; falha conserva último snapshot do produto. Conta e posição podem compartilhar engine interno de paginação/guards, mas sem aceitar normalizador executável vindo de HTTP ou substituir validação concreta por tipo genérico. Não prometer atomicidade global entre produtos.

## PORT-11 — Adapter de investimentos e cobertura de reservas (T23c)

Cobertura do conectorOF, origem do proxy e recursos do consentimento são evidências distintas; nenhuma tabela aprova vínculo real. Ler investimentos só com gate/capacidade/owner/sessão/lease/consentimentos e bindings técnicos autorizados. Projeção mínima mantém amount→grossCents e balance→netCents por decoderexato, base net declarada (líquido ausente continua null), moeda/data da fonte e classe sustentada por type; não calcular bruto porquantity×value ou líquido por subtrair taxas.

Relação inicialunknown/parentnull e authoritativefalse impedem subtotal completo/remover ausentes. Nomes/códigos/titular/emissor/metadados/transações anexas não são DTO nem heurística de cofrinho. Reservas sócomnatureza/pai/inclusão explícitos; semprova não buscar endpoint inexistente nem anunciar zero/suporte confirmado. CDB não cria ativoextra emCofrinhos. T23c1 começa por snapshot único completo de até1000linhas vinculado; páginas adicionais exigem etapa de transporte/progresso própria antes de uso. Status foraACTIVE falha fechado nessa fatia, sem silenciosamente remover posição antiga ou fabricar zero.

Evidência pública e limites em docs/research/INVESTMENT-ADAPTER-EVIDENCE-20261021.md. Backend/publicação reais continuamoff.

## PORT-12 — Registro opaco de posições e resolução autorizada (T23c3)

public.orbe_positions guarda somente IDinterno/conexão/owner/productinvestment/created_at. VínculoUUIDexterno sóprivate.position_bindings. RLSselect exige sessão atualpublic.orbe_has_session euidowner; clientessemwrite/privateaccess. StageRPCserviceonly exige ownerregistrado/capacidadeinvestments/consentimentos/revisão/leasevigente e sessãoAuth real; JSON sóexternalId, até1000vínculos. Validar loteantesdeescrever, repetir éidempotente, semrebind/delete/ativação/coberturaautomática. Revalidar sessão/lease antes de concluir e desfazer mutações se expirarem. Resolverinterno usa mesmasguards e retorna sócontextotécnico/expiração real, inclusivebindingsvazios para descobertaautorizada posterior. Nenhumvalor/nome/código/PII ou hipótese de cofrinho é persistido.

## PORT-13 — Validar snapshot antes de registrar IDs (T23c4c)

Preparação de investimentos valida snapshot/valores/data/status/item antes de expor IDs técnicos ao callback de staging. Handle genuíno é congelado e oferece somente IDsexternosúnicos/receivedRows; mínimosfinanceiros validados ficam emWeakMapprivado do módulo, semPII/extras ou retornoHTTP. Projeção posterior exige essehandle e contexto combindings reais do mesmoitem, devolvendo somente IDsinternos. Clones/forjados/descartados falham; discard remove o vínculo privado, sem promessa de apagar bytes do heap. Wrapper de projeção atual preserva contrato e descarta seu handle nofinally. Nenhum binding fictício externalId=internalId é usado como prova de autorização.

## PORT-14 — Transporte integral de investimentos

Leitura privada é one-shot com lease/sessão/revisão válidos, até10páginas de100 e1000linhas. Contadores, cardinalidade e IDs não podem divergir entre páginas. Validar snapshot integral antes de stage; IDs internos reais vêm de callback autorizado. API key permanece na closure de Auth; consentimento INVESTMENTS deve estar atual. Deadline20s, abort e close descartam resultado; 429 não repete. Não retornar IDs externos/PII nem inferir cobertura completa ou relação de reserva.

## PORT-15 — Confirmação e resposta de investimentos

Claim único por lease e sessãoAuth atual precede fornecedor; commit metadataonly exige claim vigente e contagem0–1000, sem repetir. Finishdedicado só aceita commit concluído e mesma sessão; finishgenérico não passa progresso incompleto. HTTP aceita apenas conexão/revisão/lease, resolve contexto no servidor e registra IDs após validação integral. Antes do commit reautentica e compara contexto pósstage; nenhuma mutação de vínculo prévio é aceita. Falhas não retornam posições. Completo significa paginação concluída, jamais cobertura financeira integral; partialtrue/authoritativefalse são preservados.

## PORT-16 — Cliente e tela de investimentos

RegistroRLS pósstage confirma todos os IDs internos antes do lotevolátil. Transporte one-shot só aceita investments/nextCursornull/partialtrue/authoritativefalse e finalização dedicada; sem escrita ou credencial de provedor no app. Sessão compartilha mutex e limpa memória no lock/background. Bruto/líquido/data preservados e null visível; banco/moeda separados. Relaçãounknown não compõe total consolidado. Falhas não promovem lote. `investmentReadsEnabled` nasce false. Cofrinhos sem prova explícita exibem indisponibilidade, nunca zero ou ativo duplicado.
