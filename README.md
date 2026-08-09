# ternforge-infra-updates

GitHub-hosted full-fleet update delivery for Ternforge repositories.

Repository membership and public client IDs are owned by
`betabitplus/ternforge-infra-repository-control`. This repository owns the
versioned Renovate presets and the single reconciliation workflow.

## Reconciliation contract

Every wake-up runs one pinned Renovate process across the exact current managed
fleet. The workflow reads `fleet.auto.tfvars.json` at one resolved repository-
control commit, requires the inventory to be sorted/unique and below 500
repositories, verifies that the Renovate installation token exposes exactly that
same set, and rejects the frozen `betabitplus/py-lib-starter` baseline.

The same job is entered through:

- `repository_dispatch` after a real Ternforge release;
- nightly schedule for self-healing and the official monthly lock-maintenance
  window;
- `workflow_dispatch` for operator recovery.

GitHub Actions concurrency keeps the running reconciliation and only the newest
pending reconciliation. No queue, router, source profile, persistent server,
per-repository job or direct consumer push exists.

## Renovate policy

`presets/python-library.json5` is an immutable released preset used by generated
Python libraries. Built-in managers cover Copier, Vendir, GitHub Actions, PEP
621/Git dependencies and immutable Renovate preset references. Copier/Vendir,
pre-1.0 tooling and major tooling changes stay manual. Stable tooling patch/minor
updates may auto-merge only through ordinary PR rules after `ci / required`.

The official `:maintainLockFilesMonthly` preset is part of the Python policy and
uses the same nightly reconciliation path. Each Python consumer's
`[tool.uv].required-version` remains the source of truth for uv whenever that
repository needs lockfile work.

## Credentials

- `TERNFORGE_RENOVATE_CLIENT_ID` is a repository variable owned by OpenTofu.
- `TERNFORGE_RENOVATE_PRIVATE_KEY` exists only as the protected `renovate`
  environment secret; runtime tokens are downscoped to the exact managed fleet.
- Release wake-ups use a second short-lived token minted from the existing
  `ternforge-release` App and limited to exactly this repository; no separate
  Dispatch App exists.
- Private dependency credentials are not configured until a real private source
  exists.

## Operator recovery

Run the **full-fleet updates** workflow with `workflow_dispatch`. Recovery never
changes the inventory, replaces credentials or uses a separate update path.
Before Renovate starts, the workflow repeats the exact inventory/token checks.
A successful no-op run is the normal idempotence signal.

For read-only Copier version visibility in a consumer, use pinned Copier directly:

```bash
copier check-update --output-format json
```

Treat only `up-to-date`, `update available` and command failure as outcomes. Do
not use `copier recopy`, patch artifacts or a second ownership manifest.

## Validation

Pull requests run `actionlint`, strict Renovate configuration validation and
basic repository-file validation. Inventory validation and exact token-scope
readback happen in the reconciliation workflow against the authoritative
repository-control inventory. Native Renovate logs remain the source for
per-repository timings; the workflow Job Summary records queue time, total job
time, inventory commit and release audit identity.
