# T33b1 — porta cliente de status

20/10/2026. OF-21/SEC-05/07/08/12/21. Integrador único. Depende runtime metadata publicado e SessionModel/bounded-json existentes.

Paths: src/features/connections/status.ts, tests/connections/status.test.mjs, package.json e specs/checkpoints. API createConnectionStatusReader(session,resolvePublicConfig,transport,policy), read(signal?). Gate enabled defaultfalse só metadata. Origem capturada pela sessão protege Bearer de outra configuração. Deadline aborta transporte/stream, cancel externo ao sair da tela e SessionModel ao lock; nenhum fallback global.

Projeção lista até100, root.connections próprio; DTOs copiados/congelados: IDs UUID, instituição enum, revisão segura, estado enum, quatro capacidades bool|null, datas canônicas ISO|null e prazo efetivo derivado conferido. Nenhum owner/item/account/valor ou extras nos resultados.

Aceite check: off/lockedzeroports, ownorigin/imutabilidade, authheaders/body/path, projeção e limites, malformed/duplicata/partialpayload, erros/429/401lock, timeout/stream/cancel/late/busy. Sem HTTP proprietário, sem UI/rede real nesta fatia. T37b2 lifecycle/UI depois.
