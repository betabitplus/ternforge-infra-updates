# ternforge-infra-updates

GitHub-hosted full-fleet update delivery for Ternforge repositories.

Repository membership and public client IDs are owned by
`betabitplus/ternforge-infra-repository-control`. This repository owns only the
versioned Renovate policy/preset and the single full-fleet reconciliation path.
Platform dashboard, alerts, Grafana/OpenTofu configuration and observability state
belong to `betabitplus/ternforge-infra-observability`.

## Reconciliation contract

Every wake-up runs one pinned Renovate process across the exact current managed
fleet. The workflow reads `fleet.auto.tfvars.json` at one resolved repository-
control commit, requires the inventory to be sorted/unique and below 500
repositories, and verifies that the Renovate installation token exposes exactly
that same set.

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
pre-1.0 tooling, stable tooling patch/minor and major tooling changes stay manual.
Renovate never receives authority to update `main`; after `ci / required`, the owner
merges the PR through the repository-admin PR-only boundary.

The official `:maintainLockFilesMonthly` preset is part of the Python policy and
uses the same nightly reconciliation path. Each Python consumer's
`[tool.uv].required-version` remains the source of truth for uv whenever that
repository needs lockfile work.

## Credentials

- `TERNFORGE_RENOVATE_CLIENT_ID` is a repository variable owned by OpenTofu.
- `TERNFORGE_RENOVATE_PRIVATE_KEY` exists only as the `renovate` environment
  secret; repository-control owns its sole `main` deployment policy, and runtime
  tokens are downscoped to the exact managed fleet.
- Release wake-ups use a second short-lived token minted from the existing
  `ternforge-release` App and limited to exactly this repository; no separate
  Dispatch App exists.
- Private dependency credentials use the dedicated read-only source App.

## Update telemetry producer

The reconciliation job remains the authoritative producer of its own bounded
update-delivery metrics. It emits one small best-effort OTLP/HTTP payload directly
to Grafana Cloud for delivery result, queue/processing duration, recovery freshness,
exact fleet/token coverage and Renovate configuration warnings. Delivery metrics keep
the bounded trigger dimension; fleet/token coverage is trigger-independent current
state and is refreshed by every full-fleet reconciliation.

This repository does **not** own Grafana resources, dashboards, alert rules,
GitHub data-source configuration or a general platform-health collector. The metric
contract stays independent of fleet size: repository, branch, command, path, SHA
and run ID are not persistent labels. No Collector, trace export or per-repository
metric fan-out exists.

`ternforge-infra-observability` consumes these bounded metrics alongside cached
GitHub data-source views for broader platform health. General CI/release/control
visibility therefore adds no custom OTLP series here.

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

Pull requests run `actionlint`, strict Renovate configuration validation and basic
repository-file validation. Inventory validation and exact token-scope readback
happen in the reconciliation workflow against the authoritative repository-control
inventory. Native Renovate logs remain the source for per-repository timings; the
workflow Job Summary records queue time, total job time, inventory commit and
release audit identity.
