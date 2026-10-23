# T80 — integração de cartões (planejada)

SPEC011, execução futura sequencial. Não ativar produto novo por copiar flags de saldos. Cada etapa deixa checkpoint STATE/TASKS e evidência; nenhuma exige esperar nova aprovação quando autorizada e sem dependência externa.

| Task | Escopo/arquivos principais | Dependência e aceite |
|---|---|---|
| T80a | Definir DTOs mínimos de cartão/fatura/compra, estado de cobertura e regra financeira em src/domain e testes | Fixtures sintéticas; type/subtype comprovados, null/moedas/limite≠saldo, consentimento e campos disponíveis |
| T80b | Nova migration para vínculos técnicos por cartão, permissões/RLS e admissão de produtos creditícios | Não editar19aplicadas; testar owner/sessão/revisão/lease/capability e compatibilidade do cliente atual; aplicar sequência20 se continuar próxima |
| T80c | Inventário mínimo CREDIT segregado em _shared/account-inventory e adaptadores, sem números completos | Vincular item/proxy/origem autorizados; não alterar saldoBANK nem inferir banco por cartão; allowlist remota revisada |
| T80d | Transporte/projeção de resumo e faturas, targets fixos e paginação limitada | Tests origem/precisão/limites/JSON/erros/crossowner; índices técnicos sem valores; nenhum GETfinanceiro por tools |
| T80e | Compras CREDIT e billId/parcelas/estornos, paginação e promoção atômica | Provar vínculo de cartão/fatura; ausência de billId e PENDING explícitos; idempotência; fim incompleto não publica snapshot |
| T80f | Cache privado e hub, flags independentes e estados por cartão | Serialização por banco/abort/purge/background/refresh/retry; preservar contas/investimentos/movimentosBANK |
| T80g | Home compacta + tela Cartões → Faturas → Compras, moeda/ocultação/filtros | Tema atual, navegação simples; dívida/limite separados do saldo; estados vazios/falhos claros |
| T80h | Conciliação de compra x pagamento de fatura nos relatórios | CARD05/exemplos100≠200; classificação não provada explícita, confirmação local preservada; sem heurística silenciosa |
| T80i | Check/SQL-RLS/export/audit/scans/CI/deploydisabled/publicação e documentação | Só depois habilitar por fonte/banco elegível; titular confirma resultado no aparelho sem enviar valores às ferramentas |

Cobertura de faturas/parcelas no proxy de cada banco permanece dependência real; o suporte documental do Open Finance não comprova payload recebido. Se faltar cobertura, publicar estado indisponível, nunca fabricar saldo/fatura. Orçamentozero/pessoal mantido. Pagamentos, notificação externa e armazenamento financeiro não fazem parte desta task.
