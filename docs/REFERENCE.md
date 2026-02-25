# Actions & Workflows Reference

Complete reference for all composite actions and reusable workflows in this repository (`paloitmbb/mss-devops-workflow`).

Both **reusable workflows** (`.github/workflows/`) and **composite actions** (`actions/`) live here in one place.
Consumer repositories call workflows via `workflow_call` and actions via the full `paloitmbb/mss-devops-workflow/actions/<name>@main` path.

## Table of Contents

- [Reusable Workflows](#reusable-workflows)
- [Core Terraform Actions](#core-terraform-actions)
- [Security Actions](#security-actions)
- [GitHub Integration Actions](#github-integration-actions)
- [Azure Utility Actions](#azure-utility-actions)
- [Migration Actions](#migration-actions)

---

## Reusable Workflows

All workflows are called via `workflow_call` from consumer repositories.

| Workflow | File | Backend | Primary Use |
| :--- | :--- | :--- | :--- |
| **terraform-ci** | `.github/workflows/terraform-ci.yml` | Azure (`azurerm`) | Full CI: validate → scan → plan, upload artifacts, attest plans |
| **terraform-security** | `.github/workflows/terraform-security.yml` | Azure (`azurerm`) | PR-focused: validation + security scans, no artifact uploads |
| **terraform-ci-github** | `.github/workflows/terraform-ci-github.yml` | Azure (`azurerm`) | GitHub org IaC: GitHub provider + Azure storage backend, PR comments |

**Example call (terraform-ci)**:
```yaml
jobs:
  ci:
    uses: paloitmbb/mss-devops-workflow/.github/workflows/terraform-ci.yml@main
    with:
      environment: dev
      working-directory: ./env/dev
    secrets:
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

---

## Core Terraform Actions

**[terraform-setup](actions/terraform-setup/README.md)**
Checks out code, installs Terraform, and configures automation environment variables.
*   **Must be the first step in any workflow.**

**[terraform-init](actions/terraform-init/README.md)**
Initializes Terraform. Supports `enable-backend: 'false'` for scan-only modes.
*   *Requires `azure-login-oidc` if backend is enabled.*

**[terraform-validate-syntax](actions/terraform-validate-syntax/README.md)**
Runs `terraform fmt`, `terraform validate`, and (optionally) `tflint`.

**[terraform-plan](actions/terraform-plan/README.md)**
Generates an execution plan, supports artifact uploading, attestation, and metadata generation.
*   *Requires backend enabled and OIDC login.*

**[terraform-detect-environment](actions/terraform-detect-environment/README.md)**
Intelligently detects the target environment (`dev`/`stage`/`prod`) based on changed files.

**[terraform-extract-metadata](actions/terraform-extract-metadata/README.md)**
Generates SHA256 hashes and audit metadata (`plan-metadata.json`) for plan artifacts.

---

## Security Actions

**[security-scan-checkov](actions/security-scan-checkov/README.md)**
Runs Checkov IaC scanning with SARIF output.

**[security-scan-tfsec](actions/security-scan-tfsec/README.md)**
Runs tfsec scanning `HIGH` severity defaults.

**[security-scan-trivy](actions/security-scan-trivy/README.md)**
Runs Trivy scanning in config mode.

**[security-aggregate-results](actions/security-aggregate-results/README.md)**
Aggregates outcomes from all enabled scanners and determines overall pass/fail status.

**[security-generate-sarifname](actions/security-generate-sarifname/README.md)**
Renames SARIF files to a standard format (`{env}-{scanner}-{branch}-{commit}.sarif`) for archiving.

---

## GitHub Integration Actions

**[github-comment-plan](actions/github-comment-plan/README.md)**
Posts formatted Terraform plan summaries (including security statuses) to Pull Requests.

**[github-create-pullrequest](actions/github-create-pullrequest/README.md)**
Auto-creates a branch, commits changes, and opens a PR (useful for GitOps workflows).

**[github-load-defaults](actions/github-load-defaults/README.md)**
Loads organizational defaults from a YAML file (`repository_defaults`) for governance.

**[github-notify-issue](actions/github-notify-issue/README.md)**
Posts structured status updates to GitHub Issues.

**[github-parse-issueform](actions/github-parse-issueform/README.md)**
extracts fields from structured Issue Forms.

**[github-stats](actions/github-stats/README.md)**
Retrieves comprehensive repository statistics (size, issues, PRs, etc.).

**[github-update-yamlconfig](actions/github-update-yamlconfig/README.md)**
Appends new entries to YAML configuration files using `yq` and templates.

**[github-validate-request](actions/github-validate-request/README.md)**
Validates repository creation requests (naming convention, uniqueness, team existence).

---

## Azure Utility Actions

**[azure-login-oidc](actions/azure-login-oidc/README.md)**
Authenticates using Workload Identity Federation and exports `ARM_*` variables.

**[azure-upload-artifact](actions/azure-upload-artifact/README.md)**
Uploads files or directories to Azure Blob Storage (e.g., logs, plans).

---

## Migration Actions

**[migration-validation](actions/migration-validation/README.md)**
Pre-flight check for migrations (source existence, archive status, target availability).

**[migration-parse-issue-form](actions/migration-parse-issue-form/README.md)**
Specialized parser for migration request issues.

**[migration-upload-logs](actions/migration-upload-logs/README.md)**
Generates and uploads migration audit logs to Azure Storage.

---

## Action Sequencing Guide

| Phase | Order | Actions | Notes |
| :--- | :--- | :--- | :--- |
| **Setup** | 1 | `terraform-setup` | Always first. |
| **Auth** | 2 | `azure-login-oidc` | Only if backend needed. |
| **Init** | 3 | `terraform-init` | With or without backend. |
| **Check** | 4 | `terraform-validate-syntax`<br>`security-scan-*` | Can run in parallel. |
| **Verify** | 5 | `security-aggregate-results` | Gatekeeper step. |
| **Plan** | 6 | `terraform-plan` | Requires Auth & Backend. |
| **Audit** | 7 | `terraform-extract-metadata` | Creates hash. |
| **Report** | 8 | `github-comment-plan` | Posts to PR. |

---

## Related Documentation

| Doc | Purpose |
| :--- | :--- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Repo structure, data flow, design rules, security model |
| [AZURE-OIDC-QUICKSTART.md](AZURE-OIDC-QUICKSTART.md) | 15-minute step-by-step OIDC credential setup |
| [examples/README.md](../examples/README.md) | Workflow selection guide and quick-start snippets |
| [docs/CUSTOM-ACTIONS-PIPELINE.md](CUSTOM-ACTIONS-PIPELINE.md) | Custom pipelines using individual composite actions |
| [docs/ENVIRONMENT-STRUCTURE-GUIDE.md](ENVIRONMENT-STRUCTURE-GUIDE.md) | Consumer repo Terraform directory structure |
