const crypto = require('crypto');
const { generateCode, isValidCodeFormat, normalizeCode } = require('./joinCode');
const { assertParticipantName } = require('./participantName');

function coded(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function createActivitySession({ maxParticipants = Infinity, codeExclude = new Set() } = {}) {
  const unlimited = maxParticipants === Infinity;
  if (!unlimited && (!Number.isInteger(maxParticipants) || maxParticipants < 1)) {
    throw coded('invalid_max_participants', 'maxParticipants must be an integer of at least 1.');
  }

  const session = {
    id: crypto.randomUUID(),
    status: 'idle',
    code: null,
    participants: [],
    maxParticipants,
    startedAt: null,
    liveAt: null,
    closedAt: null,
  };

  function snapshot() {
    return {
      id: session.id,
      status: session.status,
      code: session.code,
      maxParticipants: session.maxParticipants,
      participants: session.participants.map((person) => ({
        id: person.id,
        name: person.name,
      })),
      startedAt: session.startedAt,
      liveAt: session.liveAt,
      closedAt: session.closedAt,
    };
  }

  function start() {
    if (session.status === 'closed') {
      throw coded('closed', 'This activity is closed.');
    }
    if (session.status === 'idle') {
      session.code = generateCode(codeExclude);
      session.status = 'lobby';
      session.startedAt = new Date().toISOString();
    }
    return snapshot();
  }

  function join({ code, name } = {}) {
    if (session.status === 'idle') {
      throw coded('not_started', 'The activity has not started.');
    }
    if (session.status === 'closed') {
      throw coded('closed', 'This activity is closed.');
    }
    if (session.status !== 'lobby') {
      throw coded('not_joinable', 'This activity is no longer accepting joins.');
    }

    const normalized = normalizeCode(code);
    if (!isValidCodeFormat(normalized)) {
      throw coded('invalid_code', 'Enter a 6-character join code.');
    }
    if (normalized !== session.code) {
      throw coded('code_mismatch', 'That code does not match this activity.');
    }

    const { display, normalized: normalizedName } = assertParticipantName(name);
    if (session.participants.length >= session.maxParticipants) {
      throw coded('activity_full', 'This activity is full.');
    }
    if (session.participants.some((person) => person.normalizedName === normalizedName)) {
      throw coded('name_collision', 'That name is already taken.');
    }

    const participant = {
      id: crypto.randomUUID(),
      name: display,
      normalizedName,
    };
    session.participants.push(participant);
    return {
      participant: { id: participant.id, name: participant.name },
      snapshot: snapshot(),
    };
  }

  function goLive() {
    if (session.status === 'live') return snapshot();
    if (session.status !== 'lobby') {
      throw coded('illegal_status', 'The activity cannot go live from this state.');
    }
    session.status = 'live';
    session.liveAt = new Date().toISOString();
    return snapshot();
  }

  function close() {
    if (session.status === 'idle') {
      throw coded('illegal_status', 'The activity has not started.');
    }
    if (session.status !== 'closed') {
      session.status = 'closed';
      session.closedAt = new Date().toISOString();
    }
    return snapshot();
  }

  return { start, join, goLive, close, snapshot };
}

module.exports = { createActivitySession };
