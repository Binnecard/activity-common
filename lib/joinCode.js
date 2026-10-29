const crypto = require('crypto');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXY';
const CODE_LENGTH = 6;
const CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXY]{6}$/;

function normalizeCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

function isValidCodeFormat(code) {
  return CODE_PATTERN.test(normalizeCode(code));
}

function generateCode(exclude = new Set()) {
  let code;
  do {
    code = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }
  } while (exclude.has(code));
  return code;
}

module.exports = {
  CODE_ALPHABET,
  CODE_LENGTH,
  normalizeCode,
  isValidCodeFormat,
  generateCode,
};
