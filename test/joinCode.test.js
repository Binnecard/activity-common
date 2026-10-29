const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateCode,
  isValidCodeFormat,
  normalizeCode,
} = require('../lib/joinCode');

describe('join codes', () => {
  it('generates a 6-character code from the shared alphabet', () => {
    const code = generateCode();
    assert.equal(code.length, CODE_LENGTH);
    assert.equal(isValidCodeFormat(code), true);
    for (const char of code) {
      assert.equal(CODE_ALPHABET.includes(char), true);
    }
  });

  it('skips excluded codes', () => {
    const first = generateCode();
    const second = generateCode(new Set([first]));
    assert.notEqual(second, first);
  });

  it('normalizes case and surrounding space', () => {
    assert.equal(normalizeCode('  abcd ef '), 'ABCD EF');
    assert.equal(isValidCodeFormat(' hjkmnp'), true);
    assert.equal(isValidCodeFormat('hjk mnp'), false);
    assert.equal(isValidCodeFormat('hjkmnp'), true);
    assert.equal(isValidCodeFormat('hjk0np'), false);
  });
});
