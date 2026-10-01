---
name: run-backend
description: Start, stop, restart, or inspect the backend development server and verify its process and request readiness.
---

# Run backend

## Context and prerequisites

The owning app is three directories above this skill folder. Resolve it from this file, not the caller's working directory; run commands there. Read [backend guidance](../../../AGENTS.md), inspect Git status, and verify current scripts in `package.json`. This procedure needs installed dependencies, usable runtime configuration and a known database target. Read `src/main.ts`, `src/config/cors.config.ts`, `prisma.config.ts`, `src/shared/prisma/prisma.service.ts`, and the relevant configuration consumers without printing secrets. Read `docker-compose.yml` only when local Compose infrastructure is relevant.

## Procedure

1. Identify the requested mode: inspect, start, stop or restart. Inspection does not authorize startup or repair. Check the configured port and existing listener/process using available read-only process tools; identify its command and working directory. Do not stop an unknown listener or launch a duplicate server.
2. Check dependencies and generated Prisma outputs against the manifest, schema and generator configuration. Missing or incompatible prerequisites are blockers, not permission to install, generate or migrate. Confirm whether the configured database is the intended local target; do not assume it is the Compose service.
3. Before startup, inspect app registration, scheduled jobs and notification/integration initialization. Explain relevant runtime effects: startup can connect to the database and activate notification processing or external services. Obtain authorization for those effects if not already covered by the user's request. A request to run the backend authorizes its ordinary explained runtime, not real mail/payment/upload operations beyond that scope.
4. For an authorized start, use the verified development script (currently `pnpm start:dev`) in a tool-managed process session. Retain its handle/PID, working directory and logs. Do not describe a foreground watch command as background execution; use the runner's actual lifecycle facility.
5. For stop/restart, act only on this task's identified process or a specifically authorized existing process. Stop gracefully through its session first, verify the listener exits, and then restart if requested. Avoid broad process-name kills. Leave a requested running server available and report how to stop it; stop temporary verification servers when their agreed use ends.

## Side effects and gates

Allowed: read-only inspection and authorized lifecycle operations on the identified server. Startup may write compiler artifacts; watch only the owning app. Starting a database container requires authorization that explicitly includes it. Dependency installation/downloads, Prisma generation, migrations, seeding, resets, environment edits and Git mutations are separate operations; never perform them automatically. DB mutations require explicit target/operation confirmation. The skill itself grants no permissions; current session restrictions and prior approvals govern execution.

## Verification and stopping conditions

Check logs for startup/errors and correlate the listener with the owned process. Derive the actual URL/prefix from configuration. Select a non-mutating probe only after inspecting its controller/service for effects and auth requirements; do not invent a health endpoint or use the starter e2e response as a health baseline. A listening socket, startup message or expected auth error proves only the corresponding readiness layer, not full API correctness.

Stop dependent work on unknown process ownership, unsafe/unknown database target, missing prerequisites, denied authorization or startup failure. Report the blocker; do not repair it incidentally. Redact secrets, cookies, tokens and personal data from logs. Report command, app directory, process handle, URL, readiness evidence and remaining blockers. Review task-created file changes separately from prior dirty work.
