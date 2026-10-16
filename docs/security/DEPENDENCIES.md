# Dependências — bootstrap T07

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
