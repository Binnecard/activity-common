const joinCode = require('./lib/joinCode');
const participantName = require('./lib/participantName');
const { createActivitySession } = require('./lib/activitySession');
const { createActivityServer } = require('./lib/createActivityServer');

module.exports = {
  ...joinCode,
  ...participantName,
  createActivitySession,
  createActivityServer,
};
