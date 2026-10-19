# T27 — Consultas locais e ponte

T27a done, T27b pendente. 19/10/2026. PRD-02/UX-02. Responsável sequencial.

Implementar consulta pura com filtros, ordenação estável, páginas e resumo do conjunto filtrado, sem acesso a rede, banco ou segredos. Não substituir fonte incompleta por zero completo. Manter referências de estorno fora da página para cálculo. Validar cenário de paginação, filtros combinados, duplicação, conflito, mês/fuso e fonte parcial. T27b depende de backend próprio e autenticação, sem antecipar segurança comprovada.

## Evidência T27a

TypeScript e 95 testes passaram, incluindo 11 consultas locais. Paginação mantém total integral filtrado; evidência de original permite estorno sem incluir despesa fora do filtro; conflitos são rejeitados antes de filtrar. Nenhuma alteração de data é usada para recalcular. T27b e integração persistente/autenticada continuam pendentes.
