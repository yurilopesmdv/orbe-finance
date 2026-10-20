# Prontidão do Orbe —20/10/2026

**Prévia remota funcional; acesso às contas reais ainda não liberado.** Conta do titular criada, retomada sem senha e proteção de captura/multitarefa confirmadas no iPhone. O produto bancário completo não está encerrado como integração real.

## Entregue

| Parte | Comportamento | Limite |
|---|---|---|
| Acesso | Ativação privada, senha e sessão lembrada via refresh token rotativo no Keychain; revalidação online ao retornar | Nenhuma senha salva; cadastro de terceiros desabilitado. FaceID indisponível no Expo Go; não exige build pago |
| Proteção de tela | Conteúdo privado só com proteção pronta/appativo; captura e multitarefa protegidas | Dois cenários confirmados pelo titular; gravação/encerramento/outras versões não inferidos |
| Demonstração | Gastos/carteira/metas/relatórios/filtros/classificação e valores ocultos por padrão | Dados inventados; alterações voláteis, sem rentabilidade/histórico inventados |
| Metadados | Minhas conexões, status autenticado, pausa/remoção confirmadas no Orbe | Não revoga consentimento no banco/fornecedor; remoção exige senha recente |
| Contas | Tela protegida e cadeia técnica Auth/owner/binding/lease/consentimentoatual/centavosexatos/cachevolátil implementadas | Testada com dados inventados; cliente3gatesfalse, backendv4liveApprovedfalse, boots com modos explícitos/codegate+flags |
| Banco de metadados | Oito migrations imutáveis, RLS/sessão e RPCbindings service-only | Sem valores financeiros, CPF/número de conta ou credenciais do fornecedor |

## Evidência

934 testes/typechecks aprovados até c31, incluindo descoberta com lease global, rootunificado e canários privados. Export iOSHermes2.7MB e scan de valores privados aprovados no cliente c8. Inspeção privada1201fontes/56instâncias sem duas raízes de advisories no JS, mapas fora Metro e sem upload. Audit ainda19pacotes afetados/duasraízes sempatch, exceção **somente sintética até23/10/2026**; bloqueia liberação financeira, não usar auditfixforce.

Migration8/hash verificados no Supabase próprio. SQL de vínculos testado com identidades fictícias e rollback: grants/IDOR/revisão/lease expirado/ausência/pausa, zero resíduos e owner preservado. Probe no Edge real confirmou decimaloriginal com números inventados e função temporária removida; nenhuma chamada ao fornecedor.

CI/publicação/clientupdate atuais em [EXPO-PREVIEW](EXPO-PREVIEW.md); detalhes históricos nas tasks/planos e [ACCOUNT-ACCESS](ACCOUNT-ACCESS.md). Sucesso de fixtures/scan/CI não é auditoria universal, ausência de vazamento ou homologação bancária.

## Ativação e pendências

[Guia único de ativação conjunta](ACCOUNT-ACTIVATION.md). Titular fará autorizações nos sites/apps oficiais e guardará credenciais privadamente, depois de revisão dos gates. Não pedir senha bancária, token/ID pelo chat ou criar conexão real apenas para testar. Original Open Finance por banco, retenção/logs/subprocessadores, exclusão, dependências/runtime, provisionamento/deploy financeiro e cobertura real ainda não concluídos. SMTP/recuperação seguem desabilitados; cores/identidade visual foram adiadas pelo titular.

Testes de iPhone ficam reunidos para o final conforme pedido, sem bloquear trabalho independente: cold restart/logout, VoiceOver/texto maior, gravação/cache/rede nativos e futura comparação privada de dados. Não repetir confirmação já recebida de retomada/captura/multitarefa. Usar QR remoto; Metro/LAN/túnel/firewall não são necessários.

Operação20/10: versão remota da ponte confirmada3, recibo antigo1 reconciliado somente após download read-only e hashes de index/core idênticos ao manifest histórico (coregit1f2b6a6832a1). Nenhuma alteração remota; metadata v3 ACTIVE,5negativos e financeiro3off503 aprovados. Probe temporário removido.

Prévia de contas publicada20/10: update01a15a72-7573-7ea8-a2e6-e45df58e640a/commit239c7c1, CI39469588156 success, manifesto/hash/QR conferidos. [Acesso remoto](EXPO-PREVIEW.md).827 testes confirmados por contagem764Node+63Python.

Perfil privado do fornecedor preparado vazio/0600 foraMetro por c13, sem chamada ao fornecedor nem solicitação de credenciais.834 testes atuais; a prévia publicada foi validada com827 testes antes deste helper administrativo não embarcado no app.

Estado atual c31: orbe-bridgev4ACTIVE com liveApprovedfalse no entrypoint;7rotas sintéticas retornam503/no-store. Allowlist26fontes e scans de todos os perfis privados aprovados. Backend publicado sem carregar chavesPluggy ou consultar bancos; metadata/client/QR preservados. Perfil de credenciais técnicas preenchido e1bindingMPpending; nenhum accountbindingreal. Os parágrafos c11/c13 acima registram evidências históricas e não o estado atual de versão/preenchimento.
