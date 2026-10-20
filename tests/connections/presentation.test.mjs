import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionStateLabel, capabilityLabel, metadataDateLabel } from '../../src/features/connections/presentation.ts';
const now=Date.parse('2026-10-20T12:00:00.000Z');
const connection={state:'active',proxyConsentExpiresAt:'2026-11-01T00:00:00.000Z',authorizationExpiresAt:'2026-11-01T00:00:00.000Z'};
test('expired authorization cannot be presented as a current registered connection',()=>{
 assert.equal(connectionStateLabel({...connection,authorizationExpiresAt:new Date(now).toISOString()},now),'Autorização vencida');
 assert.equal(connectionStateLabel({...connection,authorizationExpiresAt:'2026-10-19T12:00:00.000Z'},now),'Autorização vencida');
 assert.equal(connectionStateLabel(connection,now),'Conexão cadastrada');
});
test('unknown proxy deadline is explicit and cannot be presented as confirmed',()=>{
 assert.equal(connectionStateLabel({...connection,proxyConsentExpiresAt:null,authorizationExpiresAt:null},now),'Prazo de autorização ainda não confirmado');
 assert.equal(connectionStateLabel(connection,NaN),'Autorização ainda não confirmada');
});
test('paused and revoked status are preserved even if deadline has elapsed',()=>{
 assert.equal(connectionStateLabel({...connection,state:'paused',authorizationExpiresAt:'2026-01-01T00:00:00.000Z'},now),'Buscas pausadas');
 assert.equal(connectionStateLabel({...connection,state:'revoked'},now),'Autorização revogada');
});
test('unknown and unsupported product capabilities have distinct explanations',()=>{
 assert.equal(capabilityLabel(null),'Ainda não confirmado');assert.equal(capabilityLabel(false),'Indisponível na fonte');assert.equal(capabilityLabel(true),'Informado como disponível pela fonte');
});
test('metadata date uses Brasília across midnight and unknown never becomes epoch',()=>{
 const label=metadataDateLabel('2026-10-20T01:30:00.000Z');assert.match(label,/19\/10\/2026/);assert.match(label,/22:30/);assert.match(label,/Brasília/);assert.equal(metadataDateLabel(null),'Não informada');assert.equal(metadataDateLabel('invented-invalid'),'Não informada');
});
