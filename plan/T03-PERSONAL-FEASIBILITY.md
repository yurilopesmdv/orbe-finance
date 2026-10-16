# T03 — Uso pessoal e limites de viabilidade

Estado: done como pesquisa pública; conexões reais não homologadas. Base b3f69a9, 16/10/2026. Requisitos PRD-05, OF-01/09. Nenhum cadastro, credencial, consentimento ou contato com terceiro realizado.

## Resultado

O guia oficial descreve acesso pessoal gratuito, até cinco conexões, sem expiração de trial para esse uso. Proxy espelha atualização diária, não oferece refresh manual nem listagem global de itens. Caminho apenas para o próprio titular; não usar como autorização de serviço comercial. [Guia pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use) e [API pessoal](https://meu.pluggy.ai/api-guide).

A documentação de conectores Open Finance distingue conexão regulada de conexão direta e lista Bradesco e Mercado Pago PF. A habilitação premium descrita ali é da integração comercial; não comprova preço nem disponibilidade da conexão original dentro do Meu Pluggy pessoal. Isso permanece sem comprovação pública suficiente para liberar dados reais. [Conectores Open Finance](https://docs.pluggy.ai/en/docs/open-finance/overview).

| Condição | Estado | Efeito |
|---|---|---|
| Uso pessoal documentado | Confirmado documentalmente | Permite desenhar adaptador sintético sem contratar |
| Até cinco conexões | Limite documentado | Duas instituições iniciais cabem; reconexões precisam gestão |
| Atualização diária / proxy | Limite documentado | Botão lê disponível, não força banco |
| Origem Open Finance Bradesco/MP no portal pessoal | Pendente de prova aplicável | Banco real permanece desligado |
| Investimentos/cofrinhos de cada conta PF | Pendente de homologação privada | Não declarar consolidado completo |
| Hospedagem/SMTP/armazenamento | Não contratados | Gratuidade de acesso não garante custo total zero |

## Decisão e saída

Seguir com desenvolvimento inteiramente sintético, mantendo Open Finance como única origem. Nenhum fallback por senha bancária. T77 registra capacidades por produto; T63/T78 precisam da evidência de origem/termos antes do primeiro consentimento. Se o canal pessoal não atender, pausar a ativação e registrar custo/alternativa para decisão do titular, sem transformar isso em bloqueio dos cálculos, UI e testes sintéticos.

Pesquisa concluída ao registrar limites conhecidos; não implica que o objetivo bancário esteja funcional. Próxima task T04: contrato monetário e exemplos sintéticos.
