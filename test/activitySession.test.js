const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createActivitySession } = require('../lib/activitySession');
const { isValidCodeFormat } = require('../lib/joinCode');

describe('activity session', () => {
  it('starts in the lobby with one join code', () => {
    const session = createActivitySession({ maxParticipants: 1 });
    assert.equal(session.snapshot().status, 'idle');
    const started = session.start();
    assert.equal(started.status, 'lobby');
    assert.equal(isValidCodeFormat(started.code), true);
    assert.equal(session.start().code, started.code);
  });

  it('joins one participant by code, then refuses another', () => {
    const early = createActivitySession({ maxParticipants: 1 });
    assert.throws(() => early.join({ code: 'HHHHHH', name: 'Ada' }), { code: 'not_started' });

    const session = createActivitySession({ maxParticipants: 1 });
    const { code } = session.start();
    const joined = session.join({ code: code.toLowerCase(), name: '  Ada ' });
    assert.equal(joined.participant.name, 'Ada');
    assert.equal(joined.snapshot.participants.length, 1);

    assert.throws(() => session.join({ code, name: 'Bea' }), { code: 'activity_full' });
  });

  it('rejects a bad code, a wrong code, and a duplicate name', () => {
    const session = createActivitySession({ maxParticipants: 2 });
    const { code } = session.start();
    assert.throws(() => session.join({ code: 'short', name: 'Ada' }), { code: 'invalid_code' });
    assert.throws(() => session.join({ code: 'HHHHHH', name: 'Ada' }), { code: 'code_mismatch' });
    session.join({ code, name: 'Ada' });
    assert.throws(() => session.join({ code, name: 'ada' }), { code: 'name_collision' });
  });

  it('goes live, stops joins, and closes', () => {
    const session = createActivitySession();
    assert.throws(() => session.goLive(), { code: 'illegal_status' });
    const { code } = session.start();
    session.join({ code, name: 'Ada' });
    assert.equal(session.goLive().status, 'live');
    assert.throws(() => session.join({ code, name: 'Bea' }), { code: 'not_joinable' });
    const closed = session.close();
    assert.equal(closed.status, 'closed');
    assert.equal(session.close().closedAt, closed.closedAt);
    assert.throws(() => session.start(), { code: 'closed' });
  });

  it('does not put sockets or normalized names on the snapshot', () => {
    const session = createActivitySession();
    const { code } = session.start();
    session.join({ code, name: 'Ada' });
    const snap = session.snapshot();
    assert.equal(snap.participants[0].normalizedName, undefined);
    assert.equal(JSON.stringify(snap).includes('ws'), false);
  });
});
