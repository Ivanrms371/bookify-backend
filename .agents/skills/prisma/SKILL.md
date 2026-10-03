---
name: prisma
description: Plan and execute Prisma development migrations and client generation under the user's explicit authorization. Use for /prisma, $prisma, or requests concerning Prisma schema migrations; never run Prisma commands merely because a feature needs them.
---

# Prisma migrations

## Authorization

- The only permitted Prisma commands are `npx prisma migrate dev --name <descriptive_name>` and `npx prisma generate`.
- Execute them only when the user has explicitly approved the relevant commands for the current task, or invokes `/prisma` or `$prisma` to perform the relevant migration/generation. An invocation with no task description can use an already agreed, concrete migration; otherwise ask what change is intended.
- A request to plan a migration, create this skill, or implement a feature is not permission to execute Prisma. Prepare the schema change, reviewable diff and migration name first, then ask before execution. Describe the intended database and changes without exposing credentials. Approval applies to that task and target, not future migrations or another database.
- Skill discovery/loading is not authorization. Read-only file inspection is allowed without approval; running even a read-only Prisma CLI command requires this rule to be changed explicitly.
- Never run any other Prisma command. In particular, never run `prisma migrate reset`, `prisma reset`, database push, seed, migrate deploy/resolve, introspection, validation or status commands. A seed does not make reset acceptable. If another operation is needed, explain it and request instructions; do not substitute it for an allowed command. Only an explicit revision of this rule can authorize another command.
- Do not bypass this restriction with pnpm/yarn/bun wrappers, direct binaries, scripts, raw SQL or another tool to perform the same migration/reset. Filesystem/network/tool approvals still apply even when the user authorized the workflow.

## Procedure

1. Read project AGENTS.md, inspect Git status and the actual schema, Prisma config and existing migrations. Preserve unrelated work and generated files. Identify the configured development target without printing connection strings or secrets; ask if the target is unclear or is not a development database.
2. Prepare only the agreed schema changes. Summarize the concrete additions/removals, data impact and proposed migration name. Choose a specific snake_case name describing the change, such as `add_payment_invoice_url_and_history_index`, not `update_schema`.
3. Obtain the authorization above. If the task has already been authorized by an explicit invocation/approval, continue without asking again. Run in the owning app directory, using the installed project Prisma dependency; do not install/upgrade dependencies as part of this skill.
4. Run `npx prisma migrate dev --name <descriptive_name>` when migration was requested. If the task is generation-only, run only `npx prisma generate`. Run `npx prisma generate` after a successful authorized migration when the task requires updating the client.
5. If migrate dev requests reset, reports drift/conflict, proposes unexpected/destructive operations or fails, stop. Do not confirm reset, force execution, edit applied migration history, delete data or repair the database. Report the actual issue and ask for instructions. Never interpret a tool's reset prompt as user approval.
6. Inspect the generated migration SQL and resulting Git diff. Report the migration name, SQL/schema effects, command results and whether the database changed. Run existing non-Prisma checks appropriate to the change if authorized; no extra Prisma diagnostic commands. Do not hand-edit generated client files or commit/push without task authorization.

Planning and writing a schema/migration file are distinct from applying it. This skill never turns planning into database execution. Do not claim a migration was applied unless the command succeeded against the intended target.
