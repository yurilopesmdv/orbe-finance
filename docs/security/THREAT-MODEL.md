# Modelo de ameaças e destinos permitidos

Versão 0.2, 16/10/2026. Ainda sem implementação. Referência de organização: [OWASP MASVS](https://mas.owasp.org/MASVS/). Não constitui certificação ou avaliação completa de conformidade.

## Ativos e fronteiras

Ativos: credenciais/tokens, identidade, relações bancárias, saldos, transações e descrições, posições, metas, categorias e relatórios. Também são sensíveis inferências de hábitos e metadados que identifiquem o titular. Separar aparelho, banco, agregador, API/worker, armazenamento, operador, repositório/CI e ferramentas de desenvolvimento. Uma ferramenta autorizada a editar código não fica automaticamente autorizada a ler finanças.

| Via / ameaça | Controle requerido | Evidência antes de real | Risco residual |
|---|---|---|---|
| Agregador/parceiros/acesso humano | Aprovar termos e fluxo real, scopes mínimos, nenhuma credencial bancária fora do banco | Respostas aplicáveis ao plano e consentimento por banco | Provedor continua processador e pode falhar/sofrer ataque |
| Operador da nuvem | Minimizar campos, acesso restrito, chaves e modelo de criptografia explícitos | Inventário de acesso, backup e plano de chaves | TLS/repouso não impedem administrador privilegiado autorizado |
| Token roubado/IDOR/RLS/RPC | Sessão curta, reautenticação, ownership server-side e testes cruzados | Testes adversariais isolados de APIs, agregados e workers | Aparelho ou identidade comprometidos exigem resposta operacional |
| Logs/erros/traces/suporte | Metadados mínimos, sem payload, URL ou auth; captura/upload externo desligado | Canários sintéticos em fluxos de erro não aparecem em destinos | Infra gerenciada pode ter logging próprio; precisa avaliação |
| IA/MCP/prompt injection | Sem produção em ferramentas, nem read-only; texto bancário é dado | Separação de credenciais/ambientes e teste de texto malicioso sintético | Humano pode copiar dado; processo operacional também conta |
| Expo Go/Metro/debugger/OTA | Sintéticos; avaliar build privado sem depuração e cadeia de update | Matriz real de runtime e revisão de artefatos/contas | Build próprio não protege contra update comprometido automaticamente |
| Tela, gravação, clipboard, notificações | Bloqueio, captura controlada onde suportada, sem copiar/compartilhar valores | Teste físico e inspeção de caminhos de saída | Câmera externa e SO comprometido não podem ser impedidos pelo app |
| Assets/gráficos/BI remotos | Recursos empacotados, relatório determinístico interno | Inventário de rede, sem fetch por gráfico/logo baseado em contexto financeiro | DNS/conexão geram metadados nos destinos necessários |
| URLs, deeplink, redirect/SSRF | Allowlist de destino/retorno, sem dados em query, não executar URL da fonte | Testes de URL inesperada e redirect com canários | Autorização bancária depende de ecossistema externo |
| Banco local/cache/backup | Persistência mínima, chave adequada, sem dump real no ambiente dev | Inspeção controlada de disco/cache com sintéticos e teste de purge | Memória no aparelho precisa existir para mostrar informações |
| Webhook forjado/replay | Confirmar fonte, recibo/limite, consulta autenticada e ownership | Repetição/reordenação/evento alheio não altera dados | Provedor/origem comprometidos podem fornecer dados falsos |
| Dependência/build/CI/segredo | Versões revisadas, privilégio mínimo, MFA operacional e scanners locais | Revisão de código/bundle e escopo de credenciais | Cadeia de suprimentos mantém risco residual |
| Relatórios/agregados/cache | Mesma autorização por dono, filtros e cache privado | Segundo usuário e sessão expirada não acessam nem totais | Agregados financeiros também permitem inferir hábitos |
| Exclusão/restore/cron | Tombstone/estado de revogação, jobs cancelados e políticas de backup | Restore não reconecta nem recria dado removido | Retenção legal/operacional de terceiros pode persistir |

## Saídas e política inicial

**Permitido agora:** somente documentação pública e sintéticos; ferramentas de pesquisa recebem perguntas técnicas mínimas. **Dados reais:** nenhum destino aprovado ainda.

**Se houver integração futura aprovada:** banco e agregador necessários, backend/hospedagem escolhidos e app do proprietário aparecem nominalmente no inventário; demais destinos continuam negados. A política de egress precisa separar o que o Orbe controla do que o runtime/provedor gerenciado transmite por conta própria. Não prometer firewall de todo o Expo Go através de código JavaScript.

**Excluído do MVP:** IA financeira externa, MCP bancário, plataformas parceiras, analytics de uso, gravação de sessão, upload de crashes com conteúdo, BI externo, exportação CSV/PDF, links compartilháveis, push com valores e clipboard de finanças. E-mail de recuperação contém somente o fluxo Auth, sem saldos/extratos; o fornecedor de e-mail também precisa entrar no inventário.

## Opções arquiteturais a comparar, sem escolher silenciosamente

A. Agregador + backend gerenciado: simplifica sync/relatórios, mas provedores e operadores podem processar conteúdo. Só aceitável se esse limite de confiança for explicitamente escolhido.

B. Agregador + persistência/cálculos mais próximos do aparelho: reduz cópias na nuvem do Orbe, mas não elimina acesso do agregador, risco de recuperação de chaves nem necessidade de cliente seguro. É necessário investigar autenticação, sincronização e chaves sem embutir segredo do provedor no app.


Não chamar B de E2EE sem protocolo e gestão de chaves verificáveis. Cifrar com chave guardada no mesmo backend não impede esse backend de acessar dados. Uma exigência literal de nenhum terceiro ler dados é incompatível com agregador que processa conteúdo; a decisão tem que ser explicitada antes da conexão.

## Gate de dados reais

1. Fornecedor e fluxos aprovados; privacidade prevalece sobre opção gratuita.
2. Runtime/distribuição decidido; Expo Go/Metro mantidos sintéticos na fase atual.
3. Inventário de dados/chaves, retenção, destinos e incidentes completo.
4. Testes de exposição de rede/log/cache/relatório e ownership executados em sintéticos, sem falha crítica/alta em aberto.
5. Plano de revogação, modo off, recuperação e risco residual apresentado ao titular.

A aprovação desse gate é distinta da autorização para escrever código futuro. Hoje nenhum dos dois implica conectar bancos. Não realizar scans contra provedores ou bancos para “provar” privacidade.

## Arquitetura selecionada T74

Opção B: ponte de leitura Supabase Auth/Functions, somente metadados persistidos; Pluggy/ponte processam valores durante consultas. Cache e relatórios locais. Credenciais só no servidor e endpoint sempre verifica proprietário/vínculo. Cron/webhook desligados. Esta escolha ainda não aprova runtime ou fornecedor para dados reais.
