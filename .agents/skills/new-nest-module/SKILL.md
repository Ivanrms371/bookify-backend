---
name: new-nest-module
description: Add and wire a backend feature module or resource using existing module, authorization, persistence, and contract patterns.
---

# Add a backend feature

## Context and prerequisites

Resolve the owning app three directories above this folder. Read [backend guidance](../../../AGENTS.md), inspect status and affected pre-existing files, and establish the requested contract and writable scope. Read the nearest relevant modules/tests, `src/app.module.ts`, security decorators/guards/permission metadata, generated Prisma import patterns and `package.json`. For persistence work inspect `prisma/schema.prisma`, `prisma.config.ts`, repository/service transaction boundaries and current generated outputs.

When available, read the [cross-app workflow](../../../../docs/cross-app-changes.md) and inspect both sibling UI consumers. If the backend is opened alone or siblings are unavailable, use local guidance and report required coordination; do not claim unavailable consumers were checked.

## Procedure

1. Determine whether the feature extends an existing module or needs a new one. Trace analogous controller → DTO → service → persistence → response paths and relevant permission/ownership checks. Resolve material contract or access ambiguity before implementation.
2. Select only needed files. Use existing layout as evidence, not a mandatory controller/service/repository/domain scaffold. Read actual imports/exports to choose the owning registration point; do not assume every sub-feature belongs directly in `app.module.ts`.
3. Implement the authorized behavior and wiring. Follow local validation and generated-import guidance. Distinguish public access from tenant-skipping decorators, and verify resource scoping in services. Repositories and direct service Prisma usage both exist; preserve transaction-client propagation rather than inventing a repository-only invariant.
4. Add persistence, events or realtime only when the requested behavior needs them. Trace listeners and effect timing for event changes. Keep schema edits, client generation and migration execution separate; prepare a reviewable schema/migration proposal before requesting DB execution approval.
5. Trace both dashboard and public-web contracts; update only authorized affected consumers and tests, or report the required sibling changes. Do not expand the task to unrelated existing inconsistencies.

## Side effects and gates

Allowed: edits to the agreed feature, necessary module wiring and meaningful tests within the task's file boundary. Identify shared files before writing; coordinate overlapping ownership and do not run generation/autofix concurrently with other edits. Dependency downloads/additions, generated Prisma outputs, broad formatting, environment edits and Git operations require authorization for that operation/scope. Schema edits require an authorized persistence change; migrations, seeds, resets and other DB mutations require explicit target/operation confirmation. Server startup and real external effects are separate from scaffolding. The skill grants no permissions; honor existing approvals and session restrictions.

## Verification and stopping conditions

Inspect relevant tests for infrastructure effects before running them. Select targeted unit tests from the current Jest configuration; verify types with the non-emitting build-config command from local guidance. Current examples are `pnpm test --runInBand path/to/file.spec.ts` and `pnpm exec tsc -p tsconfig.build.json --noEmit --incremental false`; recheck configuration first. Review module wiring, permissions, resource scoping, transaction boundaries and consumer contracts. Backend lint/format scripts rewrite files; do not run them as blanket validation. Full-app e2e startup is not a default check.

Pause dependent work when the contract, authorization/resource ownership or transaction boundary cannot be established, shared-file ownership conflicts, or a required operation is not authorized. Report baseline failures separately from regressions. Review each affected repository including untracked files; report changed files, checks, consumer impact, remaining coordination and skipped operations without staging/committing implicitly.
