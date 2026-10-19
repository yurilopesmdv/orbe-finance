# Estado de retomada — execução retomada em19/10/2026

Checkpoint atualizado em 19/10/2026, America/Sao_Paulo. Usuário autorizou retomada. Continuar uma task por vez sem aguardar novo pedido. Repositório /home/yurilopesm/projects/orbe-finance, main.

## Estado salvo

Último código:29640f8, publicado na main. CI desse commit passou: https://github.com/yurilopesmdv/orbe-finance/actions/runs/38959782371. CI do backend preparado e dos checkpoints anteriores também passou. Este checkpoint é documental e não exige nova execução de CI.

- T74: contrato ponte de leitura mínima, metadados server-side e finanças/relatórios no aparelho (6058f29).
- T01: iPhone11/iOS26.6.2/ExpoGo57.0.9 suportando SDK57; Node22.23.2/npm12.2.0 (2a8ef01).
- T02: spike sintético de sessão, bloqueio/background, expiração e recuperação;20 testes (b3f69a9).
- T03: pesquisa pessoal/termos/cotas/cadência, limites de Open Finance por banco preservados (1f19ac9).
- T04: contrato financeiro e14 fixtures JSON inventadas (13744b4).
- T05: wireframe local docs/design/wireframes.html, cinco fluxos/estados (8be82e4).
- T47/T48/T49/T06: fornecedores reais bloqueados; fronteiras/chaves/runtime definidos; specs ready apenas R1 sintética (68d5a51/ec6bb16/152bbda/9805406).
- T07: bootstrap SDK57 executável e verificado, somente demonstração; teste físico adiado pelo usuário (c07cb13).
- T09: CI por lockfile/SHAs oficiais, checks e auditoria restrita (e7677f4); resultado remoto aprovado.
- T26: TS puro de dinheiro/datas/despesas/estornos/deduplicação,18 testes adicionais (29640f8).

## Validação realmente feita

TypeScript passou.47 testes passaram (20 sessão+9 política de audit+18 domínio). Expo Doctor21/21 e compatibilidade de dependências passaram na T07. Bundle Hermes iOS gerado localmente e na CI. T26 consumiu casos financeiros T04; carteira M04/05/11 ainda depende de T24. Nenhuma autenticação de banco ou dado financeiro real foi testado.

## Processos parados

Metro sessão13056 encerrado com SIGINT; porta8083 sem listener na última inspeção. Nenhum container Orbe em execução. Stack Supabase local foi parada preservando volumes/imagens/rede próprios. Nenhum firewall alterado, túnel criado, outro projeto parado ou recurso F1 reutilizado. Serviços permanecem parados enquanto não necessários.

## T08 — done via cloud próprio

Usuário criou projeto orbe e forneceu PAT/ref no .env.backend.local privado. Management API confirmou ativo/saudável, us-east-1, sem tabelas antes da baseline. Migration aplicada uma vez por API oficial com nome contendo arquivo+sha256; reexecução não duplicou. Política Auth restrita e schema privado sem USAGE cliente conferidos. Helper scripts/backend-admin.py não imprime respostas brutas. CLI local não vinculado e parado; não usar db push remoto com esse histórico.

TypeScript e107 testes passaram (100 anteriores+7 guardas administrativos). Bundle iOS exportado com arquivo privado preenchido; token administrativo ausente nos artefatos. Não habilita dados reais; nenhuma conexão bancária.

## Teste físico adiado

PC no cabo/iPhone Wi-Fi, endereços da mesma sub-rede. QR do Metro enviado, mas ExpoGo e Safari ficaram carregando. Host serviu manifesto e bundle200 pela LAN; iPhone não foi homologado. Ambiente real é WSL2 mirrored/Windows, perfil Ethernet público; não há elevação Windows/sudo na sessão. Script de firewall foi preparado e removido antes de qualquer aplicação. Usuário pediu interromper diagnóstico e deixar teste no aparelho para depois da implementação (T38/T45). Não reabrir essa frente antes da hora.

## Pendências de segurança

18 alertas altos transitivos de duas raízes sem patch (braces/node-forge);10 moderados corrigidos via overrides decode-uri-component0.5.0 e uuid11.1.1. Ver docs/security/DEPENDENCIES.md. Exceção explícita de CI somente sintética até23/10/2026; novo advisory/erro/prazo expirado falha. Nada disso libera dados reais. ExpoGo não suporta FaceID/SQLCipher reais; T65–T67 e gates T63/T78 permanecem necessários.

Origem exclusiva Open Finance via Meu Pluggy; Bradesco/MercadoPago PF prioritários, Inter/Nubank expansão. Cobertura original Open Finance e cofrinhos por banco ainda não homologados. Sem importação de extratos. Pluggy/ponte podem ler durante processamento; não prometer E2EE ou risco zero. Ferramentas/IA/Git recebem apenas código/documentação pública e dados inventados.

## Próxima ação — T13

T24/T25/T28/T27a/T29a/T30a/T31a concluídas na fatia sintética. TypeScript, 107 testes e exportação iOS passaram. Auth/ponte/persistência reais das subtasks b continuam pendentes. Checkpoint de carteira aef2db8 publicado e CI anterior aprovada.

T08 cloud e T10a concluídas. Migration 20261019180000 cria registro singleton privado/função orbe_is_owner. Teste real como authenticated/anon com duas identidades fictícias passou; rollback e ausência de resíduos confirmados. TypeScript/109 testes locais aprovados. T10b aguarda ORBE_OWNER_USER_ID no arquivo privado; cadastro/senha solicitados diretamente no painel. Não acessar e-mail/senha. Ausência de dono nega acesso. T11a concluída: gateway Auth em src/features/auth/gateway.ts, 20 testes novos, total129 e TypeScript passaram. Não importado pela UI ainda; nenhum login/email real executado nas ferramentas. UUID do dono segue ausente no checkpoint. T11b/T12 aguardam integração do proprietário; T57a concluída: relatórios locais puros, seleção completa compartilhada com lista; TypeScript/137 testes passaram. T58a concluída: relatório secundário e detalhe por categoria com contexto, cálculo compartilhado e ocultação. TypeScript/139 testes e bundle iOS passaram. Próxima T13: vínculos de metadados/RLS, sem armazenar valores bancários, enquanto aguarda UUID privado para T10b.

Git reparado, hashes e fsck aprovados; relatório docs/validation/2026-10-19-git-recovery.md. Continuar uma task por vez sem esperar novo pedido. Teste físico adiado ao final. Nenhum banco conectado, nenhum dado financeiro real ou recurso F1 acessado.
