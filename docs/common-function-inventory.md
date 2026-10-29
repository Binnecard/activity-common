# Common activity functionality

Recorded before implementation on 29 October 2026 (Pacific/Auckland).

Source story: plans epic `quiz-activity`, story `centralise-common-activity-functionality-in-activity-common`. The sibling spike is `agile-spike-for-a-single-question-quiz`.

This inventory is the overlap between Dice Relay Race and the single-question quiz spike. It is not a freeze of every future shared function. Dice Relay Race is not switched over to this package in this change.

## In activity-common

These are the parts of the Dice Relay Race activity shell that the quiz spike also needs.

1. **Join codes.** Six characters from `ABCDEFGHJKLMNPQRSTUVWXY`, the same alphabet Dice Relay Race uses so a code can be read aloud without `0`, `O`, `1`, or `I`. Generate a code, normalize it to uppercase, and check the format. Comparison is case-insensitive.

2. **Participant names.** Trim and apply Unicode NFC for the display form. Compare a separate lowercase form. Reject a blank name and a name longer than 40 characters. Dice-themed generated names stay in Dice Relay Race.

3. **In-memory activity session.** One session in the process. Status moves `idle` → `lobby` → `live` → `closed`. Facilitator start assigns the join code and opens the lobby. A participant joins with a code and a name only while the session is in the lobby. `maxParticipants` is a parameter: the quiz spike sets it to 1, and Dice Relay Race can keep a higher limit when it adopts this package later. `goLive` closes joining. `close` is terminal. Snapshots sent to browsers omit sockets and normalized names.

4. **Realtime host.** One Node HTTP server and one WebSocket server on the same port. `GET /health`. Static files for the activity, plus a mount that serves this package's browser modules. JSON messages carry a `type` string. The host can send to one socket or broadcast. The activity supplies connection, message, and disconnect hooks. Path checks keep static files inside the configured directories.

5. **Browser shell.** Open a WebSocket on the page origin, send JSON, and wait until the socket is open. Store the small session record in `sessionStorage`. Escape text for HTML. Copy the join code. Shared layout styles cover the code panel, roster, form, error, and closed state.

## Not in activity-common

- Dice rules: dice, thresholds, rounds, pass, pause, skip, recall, and funny names.
- Quiz rules: the question, the choices, and the answer.
- Platform launch tickets, signed commands, webhooks, provisioning, and the wallet pool.
- The Slative design system. Screen layout for the spike stays a plain shared shell.
- A second shared-activity repository. Quiz depends on this package.

## Landed in 0.1.0

The five items above are the library: `lib/joinCode.js`, `lib/participantName.js`, `lib/activitySession.js`, `lib/createActivityServer.js`, and the browser modules in `client/`. Quiz depends on `@binnecard/activity-common`. Dice Relay Race is not wired to this package.
