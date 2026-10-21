# Dependências — bootstrap T07

**Histórico de auditoria; estado atual: 19 pacotes afetados/duas raízes altas, exceção somente sintética até23/10/2026.** [Alcance revisado em21/10](TOOLCHAIN-REACHABILITY-20261020.md). Não usar contagens antigas abaixo como estado corrente.

Data16/10/2026, SDK57.0.30, RN0.86.3, React19.2.3. Scanner: npm audit, árvore com lockfile. Não é auditoria completa nem teste de exploração; nenhuma conta bancária acessível ao projeto.

## Correções aplicadas

| Pacote | Correção | Compatibilidade verificada |
|---|---|---|
| decode-uri-component | Override0.5.0, fora da faixa reportada | Typecheck/export iOS passaram |
| uuid transitivo de xcode | Override11.1.1; consumidor usa v4, API preservada | Config/Doctor/export passaram; prebuild nativo não executado |

Auditoria caiu de28 (10 moderados/18 altos) para18 altos, sem moderados/críticos. Não usar audit fix --force: recomendava downgrade incompatível de Expo/React Native, que não comprova correção segura do projeto.

## Pendências

- braces3.0.3: DoS por padrões profundamente aninhados, último release consultado sem patch. Entra pela cadeia Metro/micromatch das ferramentas. [Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- node-forge1.4.0: validação de assinatura RSA, último release consultado sem patch. Entra por utilitários de certificados/CLI Expo. [Advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv).

18 são pacotes afetados direta/indiretamente na árvore, não18 falhas independentes. Reconciliar alcance exato no bundle/ambiente em T54 antes de release real. Metro fica em LAN, somente sintéticos; não aceitar configuração/arquivos de origem desconhecida, não usar certificados de terceiros nem publicar servidor de desenvolvimento como produção. Essas restrições reduzem exposição mas não corrigem o pacote vulnerável. O gate real continua fechado, sem exceção por passar o bundle.

[decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Reconsultar advisories e remover overrides quando versões compatíveis upstream incorporarem correção. Nunca alegar zero vulnerabilidades. CI não executará deploy nem receberá segredos bancários; audit com falha precisa de classificação explícita, sem suppressão silenciosa.

## CI T09

Exceção explícita somente para os dois URLs de advisory acima, válida até23/10/2026, exclusivamente sintéticos. Script security:audit falha para novo advisory, resposta inválida ou prazo expirado; imprime quantidade restante em vez de alegar zero. Não usar continue-on-error no audit. Gate real exige resolver/mitigar e revisar essas pendências, sem herdar a exceção de desenvolvimento.

## Atualização T44a —20/10/2026

Publicação hospedada em ExpoGo exige expo-updates57.0.26 na CLI EAS. Instalado explicitamente sem credencial/ignore-scripts, lockfile atualizado; Expo installcheck compatível e620 testes/typechecks aprovados. Auditoria agora19 pacotes afetados pelas mesmas duas raízes altas, sem advisory novo/crítico; a exceção continua somente sintética e não libera banco real. Publisher verifica a versão instalada antes de iniciar EAS autenticado, evitando autoinstalação no processo que recebe token.

## Alcance observado T54a —20/10/2026

Export production iOS JS/Metro com mapa externo em diretório0700 privado:1162 fontes/53 pacotes. braces/node-forge não constam nesse grafo; política automatizada falha se entrarem em uma próxima exportação. `npm run security:runtime` reproduz export e inspeção sem credenciais; CI também executa. Hashes e inventário em ~/.config/orbe-finance/runtime-audit/report.json0600, sem sourcesContent no relatório. Mapas/código de inspeção não vão à publicação/artefatos GitHub.

Dois typechecks/664 testes passaram. Esta prova é do export JS auditado, não certifica binário nativo Expo Go, CLI/EAS global, caminhos de build ou inexistência de riscos de cadeia. Os19 pacotes/duas raízes continuam na auditoria das ferramentas e a exceção sintética NÃO foi estendida. T54 integral e gate de dados reais permanecem abertos.

T54a2: o relatório agora resolve a instância exata do lock, inclusive aninhada. No export de T12b,1166 fontes/54 instâncias; metro-runtime efetivamente empacotado é0.84.5 (não0.84.6 da raiz/toolchain).7 testes focados e inspeção do export existente aprovados. Ausência de braces/node-forge no JS continua verdadeira e não resolve o audit do toolchain.
