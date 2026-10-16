# T49 — Decisão de runtime e superfícies de desenvolvimento

Estado: done como decisão de manter real bloqueado, 16/10/2026. SEC-09/10/18; T01/T48 cumpridas. Sem mudança de distribuição ou contratação.

Runtime selecionado nesta fatia: Expo Go 57.0.9/SDK57 no iPhone11 informado. Node22.23.2/npm12.2.0 local. Não preparar pacote nativo nesta task. Face ID/SQLCipher reais não são entregáveis do Expo Go. Dados reais ficam desligados até T65–T67 e gate T63/T78, com instalação/distribuição/custo avaliados antes de qualquer compromisso externo.

| Superfície | Regra da fatia sintética |
|---|---|
| Metro/debugger | Somente fixtures; não abrir backend de produção nem importar secrets |
| LAN/túnel | LAN privada por padrão; túnel é outro destinatário, não habilitar automaticamente |
| Logs e erros | Códigos genéricos, sem tokens/corpos; fake só usa identidades example.invalid |
| Sessão | Memória, limpar no bloqueio; spike testou races, não captura física |
| Clipboard/captura/alternador | Não prometer proteção universal; T53 exige teste no aparelho |
| Dependências e update | Lockfile, versões compatíveis e revisão; sem analytics/IA ou crash upload |
| CI/ferramentas | Código e dados inventados; nenhum segredo de banco/finança real |

Comparação concluída: Expo Go permite iterar a experiência sintética; uso real depende de runtime compatível e controles testados. Build próprio isoladamente não prova privacidade. Não apagar o requisito de Face ID nem fazê-lo retornar sucesso fictício. Limitações reconhecidas bloqueiam real, não os fluxos de demonstração.

Aceite da task: matriz de superfícies e decisão explícita para os dois escopos; testes físicos permanecem pendentes. Próxima T06: marcar somente a primeira fatia sintética como ready, preservando bloqueios reais.
