# activity-common

Shared functionality for more than one activity. Quiz depends on this package. Dice Relay Race keeps its own copy until that shared behaviour has been proven.

The inventory of what belongs here, and what stays in an activity, is [docs/common-function-inventory.md](docs/common-function-inventory.md).

## Library

Node 22 or newer.

```bash
npm install
npm test
```

`require('@binnecard/activity-common')` exports:

- `generateCode`, `normalizeCode`, `isValidCodeFormat`
- `displayName`, `normalizeName`, `assertParticipantName`
- `createActivitySession({ maxParticipants })` with `start`, `join`, `goLive`, `close`, and `snapshot`
- `createActivityServer({ clientDir, sharedClientDir, routes, onMessage })` — HTTP static files, `GET /health`, and a WebSocket on the same port

Browser modules in `client/` are served by the host at `/activity-common/` when `sharedClientDir` points at that folder. They open the page socket, store a `sessionStorage` record, escape text, and style the code panel, roster, form, and closed state.

Activities own their rules. This package does not know about quiz questions or dice.
