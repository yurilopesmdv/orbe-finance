# Investimentos e reservas — evidência pública21/10/2026

Pesquisa para PORT-11/T23c0; nenhuma APIautenticada/item/dado do titular acessado. Modelosclienteposição/valuation/staging já existem; adapterexterno ainda não está implementado.

## Cobertura correta por contexto

[Cobertura de investimentos OF](https://docs.pluggy.ai/en/docs/open-finance/investments) separa conectores porID: Bradesco603 eMercadoPago606 listam CDB e classes de fundos/rendafixa, com diferenças por subtipo. Isso é capacidade genérica, não homologação do consentimentoPF viaMeuPluggy. Não confundir com [cobertura direta](https://docs.pluggy.ai/en/docs/connections/investments-coverage), onde MercadoPago aparece sem investimentos: a própria página limita essa tabela a conectoresdiretos.

A [tabela por instituição](https://docs.pluggy.ai/en/docs/open-finance/institutions-coverage) agrega contextosPF/PJ; verde não comprova produto específico no contexto do titular. O [guia pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use) mantém MeuPluggy como proxy de uso pessoal; a documentação pública não comprova a origemOF dos dois vínculos deste usuário. Gatesoriginais preservados.

## Dados mínimos e semântica

[Investment](https://docs.pluggy.ai/en/docs/products/investments) define amount como bruto e balance como líquido; quantity/value não substituem esses totais. date é referência da posição. Status diferencia ativo/pendente/retirada. Type/subtype sustentam classe; nome, código, titular, emissor e metadadoslivres não serão projetados. Não calcular retorno por diferença de snapshots nem presumir liquidez.

A mesma documentação menciona caixinhas/cofrinhos de alguns bancos como CDBs. Isso não identifica automaticamente uma reservaMercadoPago/Bradesco, seu pai ou inclusão no saldo. Posição pode aparecer emInvestimentos sem criar segundoativo emCofrinhos. Relaçãounknown não entra no subtotal reconciliado atéevidência; reserva local é alocação, nunca transferência.

[GET/investments](https://docs.pluggy.ai/en/reference/investment/investments-list) é poritemId com page/pageSize e contadores. O adapter precisa validar item/vínculo e paginação, sem listar itensglobais ou enviar IDsexternos ao cliente. Empty não comprova zero bancário; status/consentimentos/cobertura precisam ser verificados separadamente.

## Disponibilidade não é quantidade

[Itemresources](https://docs.pluggy.ai/en/docs/connections/resources) distingue recursos compartilhados, pendentes e indisponíveis. Lista vazia só é interpretável com coleta declarada; registros históricos podem sobreviver a mudanças do consentimento. Endpoint em conectordireto retorna vazio, portanto vazio no proxyMeuPluggy não prova ausência na instituiçãooriginal. Recursooriginal não é IDPluggy. Não chamar este endpoint pelas ferramentas nem abrir uma exceção de rede sem contrato próprio.

[Diferenças OF/direto](https://docs.pluggy.ai/en/docs/connections/open-finance-vs-direct-fields) alerta que campos podem faltar por origem/cobertura. Suas regras detalhadas de transações não devem ser extrapoladas como garantia de IDs/valores de investimentos.

## Decisão de implementação

Começar por projeção pura de investimentos a partir de bindings técnicos autorizados, decoder exato, bruto/líquido separados, base net declarada e null preservado. Manter relationunknown/authoritativefalse até prova. Reservas exigem relação explícita; sem ela ficam indisponíveis como produto separado, nunca inferidas por nome ou tratadas como zero. Fixtures inventadas não homologam banco. Próximas etapas em [planoT23c](../../plan/T23c-INVESTMENT-ADAPTER.md).
