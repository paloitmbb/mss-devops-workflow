# Copilot Instructions for mss-devops-workflow

## Project Overview

This repository provides two things in one:
1. **Reusable GitHub Actions workflows** (`.github/workflows/`) — called by consumer repositories via `workflow_call`
2. **Composite actions** (`actions/`) — building blocks used by those workflows, all living in this same repo

**Data Flow**: Consumer repo → Reusable workflow (`.github/workflows/`) → Local composite actions (`actions/`) → Terraform execution

**Action reference pattern**: Workflows call their own composite actions via full self-referencing URL (required by GitHub Actions — relative paths are not supported in reusable workflows called by external repos):
```yaml
uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main
```
All `@main` refs are currently floating and must be pinned to a commit SHA after the first push to GitHub.

## Repository Structure

```
.github/workflows/    # Three reusable workflows (workflow_call entry points)
actions/              # 20+ local composite actions (building blocks)
example/              # Consumer usage examples
docs/                 # OIDC setup guide, reference docs
Makefile              # Developer CLI shortcuts
```

## Three Reusable Workflows

| Workflow | Backend | Artifacts | Attestation | PR Comments | Typical Trigger |
|----------|---------|-----------|-------------|-------------|-----------------|
| [terraform-ci.yml](.github/workflows/terraform-ci.yml) | Azure OIDC | ✅ | ✅ | ❌ | Push / post-merge |
| [terraform-security.yml](.github/workflows/terraform-security.yml) | Azure OIDC | ❌ | ❌ | ❌ | Pull requests |
| [terraform-ci-github.yml](.github/workflows/terraform-ci-github.yml) | Azure OIDC | ✅ | ✅ | ✅ | GitHub org IaC |

Note: `terraform-ci-github.yml` uses `ORG_GITHUB_TOKEN` for the GitHub Terraform provider while still using Azure Storage for backend state (requires `ARM_*` secrets, not `AZURE_*`).

## Local Composite Actions Inventory

Actions are in `actions/<name>/action.yml`. Key actions and their roles:

**Terraform lifecycle**: `terraform-setup` → `azure-login-oidc` → `terraform-init` → `terraform-validate-syntax` → `terraform-plan`

**Security scanning** (run in parallel jobs): `security-scan-tfsec`, `security-scan-trivy`, `security-scan-checkov`
→ Results aggregated by `security-aggregate-results` (accepts `tfsec-outcome`, `trivy-outcome`, `checkov-outcome`)

**Utilities**: `security-generate-sarifname`, `terraform-detect-environment`, `terraform-extract-metadata`, `github-comment-plan`, `azure-upload-artifact`

**Issue/Migration workflows**: `github-parse-issueform`, `github-validate-request`, `github-notify-issue`, `migration-validation`, `migration-parse-issue-form`, `migration-upload-logs`

## Security Scanning

**Active in all workflows**: tfsec + Trivy (two parallel jobs)
**Available but not yet wired**: `actions/security-scan-checkov/` exists as a composite action but is not called by any workflow yet

- **tfsec**: Terraform-specific rules, 200+ cloud security checks
- **Trivy**: CVEs, secrets, misconfigurations
- **Checkov** (`actions/security-scan-checkov/`): composite action ready to wire in; follow the "Adding a New Security Scanner" steps below

**Parallel pattern**: tfsec and Trivy run as separate parallel jobs with `continue-on-error: true`. The `aggregate-security` job depends on both and calls `security-aggregate-results` to determine final pass/fail.

**`security-aggregate-results` already accepts `checkov-enabled`/`checkov-outcome` inputs** — wiring Checkov in requires only adding the job and passing those inputs.

**OPA is explicitly excluded** — tfsec + Trivy + Checkov provides sufficient coverage without it.

**Always pass `terraform-var-file`** for accurate scanning (~70% → ~95% coverage for variable-dependent configs like `count = var.enabled ? 1 : 0`).

## OIDC Authentication

**Zero static credentials** — Azure OIDC is mandatory for all Azure-backed workflows:

```yaml
# terraform-ci.yml / terraform-security.yml
secrets:
  AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
  AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

# terraform-ci-github.yml (GitHub provider + Azure backend)
secrets:
  ORG_GITHUB_TOKEN: ${{ secrets.ORG_GITHUB_TOKEN }}
  ARM_CLIENT_ID: ${{ secrets.ARM_CLIENT_ID }}
  ARM_TENANT_ID: ${{ secrets.ARM_TENANT_ID }}
  ARM_SUBSCRIPTION_ID: ${{ secrets.ARM_SUBSCRIPTION_ID }}
```

## Composite Action Design Rules

1. **Single responsibility** — one action, one task (setup, init, scan, plan)
2. **No orchestrator actions** — workflows orchestrate jobs; actions execute focused tasks
3. **Minimal steps** — prefer more focused actions over one large action
4. **Required `environment` input** — all workflow entry points require this; it drives backend naming and PR messaging

## Developer Workflow (Makefile)

```bash
make check              # Run all local checks: fmt + validate + lint + security + file-checks
make pre-commit         # Run all pre-commit hooks on all files
make pre-commit-install # Install pre-commit git hooks
make security           # Run tfsec + trivy locally
make plan ENV=dev       # terraform init + plan for ./env/dev
make fmt                # terraform fmt via pre-commit
make validate           # terraform validate via pre-commit
make clean              # Remove .terraform cache dirs
```

## Adding a New Security Scanner

1. Add composite action under `actions/security-scan-<tool>/action.yml`
2. Add parallel job in the workflow with `continue-on-error: ${{ inputs.<tool>-continue-on-error }}`
3. Add `if: inputs.enable-<tool> == true` condition
4. Use `security-generate-sarifname` action for consistent SARIF naming
5. Add job to `aggregate-security` job's `needs:` array
6. Add `<tool>-enabled` and `<tool>-outcome` inputs to `security-aggregate-results` call
7. Add workflow inputs: `enable-<tool>` (bool, default `true`), `<tool>-severity` (default `'HIGH'`), `<tool>-continue-on-error` (bool, default `true`)

## Workflow Input Conventions

- **Required**: `environment` (drives backend, naming, PR messages)
- **Scanner toggles**: `enable-tfsec`, `enable-trivy` (both default `true`; `enable-checkov` exists in the aggregate action but no workflow exposes it yet)
- **Severity**: `tfsec-severity`, `trivy-severity` (default `'HIGH'`)
- **Error control**: `<tool>-continue-on-error` + `aggregate-continue-on-error`
- **Path resolution**: `terraform-var-file` is relative to `working-directory`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `AADSTS700016` | Check federated credentials: `az ad app federated-credential list --id $AZURE_CLIENT_ID` |
| SARIF upload fails | Add `actions: read` + `security-events: write` permissions |
| `terraform-var-file` not found | Path must be relative to `working-directory`, not repo root |
| Plan step hangs | Ensure `terraform-setup` and `terraform-init` jobs complete first |

## Key References

- [Workflow-README.md](Workflow-README.md) — consumer-facing workflow docs with quick-start examples
- [Actions-README.md](Actions-README.md) — composite action catalog and pipeline examples
- [docs/AZURE-OIDC-QUICKSTART.md](docs/AZURE-OIDC-QUICKSTART.md) — federated credential setup
- [examples/](examples/) — complete consumer repo usage examples
- [.github/instructions/github-actions-ci-cd-memory.instructions.md](.github/instructions/github-actions-ci-cd-memory.instructions.md) — project decisions log
