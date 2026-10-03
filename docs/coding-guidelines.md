# Backend Coding Guidelines

These rules apply when creating or editing backend modules. Apply them to the code in scope; do not refactor unrelated modules solely to enforce them.

## Keep implementation minimal

Write the minimum clear code needed to satisfy the requirement. Add only necessary files, dependencies, abstractions, and module registrations. Avoid speculative features, unnecessary wrappers, and generic frameworks for a single use case.

## Module organization and types

Keep each feature's code in its owning module under `src/modules/`. Use descriptive filenames such as `payments.service.ts` and `payments.repository.ts`.

Define feature types, interfaces, and type aliases in a `types/` folder or a dedicated `*.types.ts` file. Do not declare them inside services, controllers, repositories, or other business-logic files. Use `import type` when appropriate. Request and response DTOs belong in `dto/`.

## Controllers

Controllers handle HTTP routing, request binding, authorization metadata, and delegation to services. They must not contain business rules or database queries. Keep domain validation, ownership checks, and workflow decisions in services.

## Services

Services express business workflows in a simple, readable sequence. Keep methods focused and avoid deeply nested conditions or complex expressions that combine unrelated rules.

Use clearly named helpers for cohesive checks, such as `verifyInvoiceOwnership`. Do not create a helper for every line or hide unclear conditions behind generic names such as `validate`. Keep domain-specific HTTP exceptions in the feature's `exceptions/` folder.

## Repositories and transactions

Repositories are the only feature layer that accesses the Prisma instance for database queries and mutations. Services delegate persistence to repositories; controllers never access Prisma.

A service may access Prisma to coordinate a transaction when the business workflow requires it. Pass the transaction client to every participating repository operation. Keep queries and mutations in repository methods, and ensure they use the supplied transaction client rather than the default instance.

Existing direct service queries are legacy patterns, not examples to copy. Apply this boundary to new or changed persistence code without broad unrelated refactoring. Import generated Prisma types from `src/generated/prisma`; never hand-edit generated files. Follow the separate Prisma authorization rules in `AGENTS.md`.

## Tests

Place every new test file in a `tests/` folder owned by its feature or adapter, for example `src/modules/payments/tests/payments.service.spec.ts`. When editing an existing test outside a `tests/` folder, move that test into the owning `tests/` folder and adjust relative imports.

Use Jest and `*.spec.ts` for unit tests. Test observable service or API behavior rather than private helper names. Cover meaningful business rules, ownership failures, and transaction behavior affected by the change. Keep unit tests isolated from real infrastructure and external side effects.

Run relevant tests with `pnpm test --runInBand <path-to-test>`. Unit tests must remain under `src` for the current Jest configuration. The separate e2e suite uses `test/jest-e2e.json`; preserve its configuration when organizing e2e tests.

## Formatting and verification

Write code for human readers. Use normal indentation and multiline control-flow blocks; do not compress conditions, statements, and braces into one line.

Follow Prettier's repository configuration: two-space indentation by default, single quotes, trailing commas, and a 140-character print width. Format only changed files with `pnpm exec prettier --write <changed-files>`, then verify them with `pnpm exec prettier --check <changed-files>`.

Review the formatted diff for readability. Run relevant tests and `pnpm exec tsc -p tsconfig.build.json --noEmit --incremental false` for code changes. Do not run repository-wide autofix just to check formatting.
