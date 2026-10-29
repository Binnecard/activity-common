const MAX_NAME_LENGTH = 40;

function displayName(name) {
  return String(name ?? '').trim().normalize('NFC');
}

function normalizeName(name) {
  return displayName(name).toLowerCase();
}

function assertParticipantName(name) {
  const display = displayName(name);
  if (!display) {
    const err = new Error('Enter a name.');
    err.code = 'name_required';
    throw err;
  }
  if (display.length > MAX_NAME_LENGTH) {
    const err = new Error('Name must be 40 characters or fewer.');
    err.code = 'name_too_long';
    throw err;
  }
  return { display, normalized: normalizeName(display) };
}

module.exports = {
  MAX_NAME_LENGTH,
  displayName,
  normalizeName,
  assertParticipantName,
};
