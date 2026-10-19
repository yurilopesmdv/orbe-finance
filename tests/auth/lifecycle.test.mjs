import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observeActivity } from '../../src/features/auth/lifecycle.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
function source(state) {
  let listener, removed = false;
  return { currentState: state, addEventListener(event, callback) { assert.equal(event, 'change'); listener = callback; return { remove() { removed = true; } }; }, emit(state) { this.currentState = state; listener?.(state); }, get removed() { return removed; } };
}
test('initial active state is delivered without waiting for next event', () => { const events = [], app = source('active'); const stop = observeActivity(app, active => events.push(active)); assert.deepEqual(events, [true]); stop(); });
test('initial unknown and background states fail closed', () => { for (const state of [null, 'background', 'inactive', 'unknown']) { let active; const stop = observeActivity(source(state), next => { active = next; }); assert.equal(active, false); stop(); } });
test('inactive background and return active are distinguished', () => { const events = [], app = source('active'); const stop = observeActivity(app, active => events.push(active)); app.emit('inactive'); app.emit('background'); app.emit('active'); assert.deepEqual(events, [true, false, false, true]); stop(); });
test('cleanup removes subscription and ignores already queued callbacks', () => { const events = [], app = source('active'); const stop = observeActivity(app, active => events.push(active)); stop(); app.emit('background'); assert.equal(app.removed, true); assert.deepEqual(events, [true]); });
test('lifecycle integration blocks an unlocked session and return never unlocks', async () => {
  const gateway = { signIn: async () => ({ accessToken: 'invented', expiresAt: 2000 }), signOut: async () => {}, requestRecovery: async () => {}, resetPassword: async () => {} };
  const session = new SessionModel(gateway, () => 1000, () => () => {}), app = source('active');
  const stop = observeActivity(app, active => session.setActive(active)); await session.login('', ''); assert.equal(session.getSnapshot().state, 'unlocked');
  app.emit('inactive'); assert.equal(session.getSnapshot().state, 'locked'); app.emit('active'); assert.equal(session.getSnapshot().state, 'locked'); stop();
});
