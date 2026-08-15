# ternforge-infra-updates

GitHub-hosted full-fleet update delivery for Ternforge repositories.

Repository membership and public client IDs are owned by
`betabitplus/ternforge-infra-repository-control`. This repository owns the
versioned Renovate presets and the single reconciliation workflow.

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
- Private dependency credentials are not configured until a real private source
  exists.

## Fleet Health

The existing reconciliation job exports its bounded Fleet Health metrics directly
to the Grafana Cloud OTLP endpoint. They cover delivery result, queue/processing
duration, recovery freshness, exact fleet/token coverage and Renovate configuration
warnings. No Collector, Renovate trace export or span-metrics pipeline is part of
the runtime path. Repository, branch, command, path, SHA and run-ID labels are not
part of the persistent telemetry contract.

Grafana Cloud configuration lives in `grafana/` and is applied only by the
manual **fleet health grafana** workflow. It uses the same protected two-stage
plan/review/apply pattern as repository control, but a separate Scalr state-only
workspace and a separate OIDC service account. State, plans and plan JSON are
sensitive and never become workflow artifacts.

The Grafana GitHub data source uses the dedicated read-only
`ternforge-fleet-health` GitHub App. It is a current-state/drill-down source for
PRs, Renovate warnings and workflow runs; critical delivery alerts use the
bounded workflow metrics instead. The dashboard overall state is the worst
critical state, never a weighted score.

Grafana credentials are deliberately split by responsibility:

- the `grafana` environment holds only the stack service-account token, exact-stack
  plugin access-policy token, GitHub App data-source secret and alert contact;
- the `renovate` environment holds only the exact-stack `metrics:write` token;
  public Grafana identifiers and endpoints are Git-owned workflow/Terraform inputs;
- all permanent tokens have explicit expiry and are rotated by creating a
  replacement, updating the corresponding protected environment secret, proving
  plan/reconciliation health, then revoking the old token.

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
