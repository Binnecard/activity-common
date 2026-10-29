const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  assertParticipantName,
  displayName,
  normalizeName,
} = require('../lib/participantName');

describe('participant names', () => {
  it('trims and compares case-insensitively', () => {
    assert.equal(displayName('  Ada '), 'Ada');
    assert.equal(normalizeName('  ADA '), 'ada');
  });

  it('rejects a blank name and a name past 40 characters', () => {
    assert.throws(() => assertParticipantName('   '), { code: 'name_required' });
    assert.throws(() => assertParticipantName('a'.repeat(41)), { code: 'name_too_long' });
    assert.equal(assertParticipantName('a'.repeat(40)).display, 'a'.repeat(40));
  });
});
