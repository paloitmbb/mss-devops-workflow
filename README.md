# mss-devops-workflow test

Reusable GitHub Actions workflows and composite actions for Terraform CI/CD on Azure — all in one repository.

**Consumer repos call a single reusable workflow** (`.github/workflows/`) and inherit full validation, security scanning, and plan reporting. The workflows are built from composable actions (`actions/`) that can also be used independently.

## Highlights

- **Zero static credentials** — Azure OIDC (Workload Identity Federation) is enforced across all workflows.
- **Security-first pipeline** — `tfsec` + `Trivy` run in parallel, upload SARIF, and roll into a single pass/fail gate.
- **Composable design** — Use the full reusable workflow, or pick individual actions to build a custom pipeline.
- **Artifact provenance** — Optional plan hashing, attestation, and Azure Blob uploads for traceability.
- **DRY by design** — One `uses:` line in a consumer repo replaces dozens of repeated steps.

---

## Workflow Catalog

| Workflow | Typical Trigger | Primary Use |
| :--- | :--- | :--- |
| [`terraform-ci`](.github/workflows/terraform-ci.yml) | Push / nightly | Full CI: validate → scan → plan, upload artifacts, attest plans, post PR comments |
| [`terraform-security`](.github/workflows/terraform-security.yml) | Pull requests | Reviewer-focused: validation + security scans + real plan preview (no artifacts) |
| [`terraform-ci-github`](.github/workflows/terraform-ci-github.yml) | Push / PR | GitHub Org Terraform (uses `ORG_GITHUB_TOKEN` for the GitHub provider + Azure backend for state) |

All three workflows use **Azure OIDC** for backend authentication — no long-lived Azure credentials required.

---

## Quick Start

### Option 1 — Reusable Workflow (recommended)

Call one workflow and inherit the full pipeline:

```yaml
name: Terraform CI
on: [push, pull_request]

permissions:
  contents: read
  id-token: write
  security-events: write
  pull-requests: write
  actions: read
  attestations: write

jobs:
  terraform-ci:
    uses: paloitmbb/mss-devops-workflow/.github/workflows/terraform-ci.yml@main
    with:
      terraform-version: '1.7.0'
      working-directory: ./env/dev
      environment: dev
      terraform-var-file: terraform.tfvars
    secrets:
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

### Option 2 — Individual Composite Actions (advanced)

Compose a custom pipeline step-by-step:

```yaml
name: Terraform CI
on: [push]

permissions:
  id-token: write
  contents: read
  security-events: write
  pull-requests: write

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main

      - uses: paloitmbb/mss-devops-workflow/actions/azure-login-oidc@main
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
        with:
          working-directory: ./env/prod
          enable-backend: 'true'

      - uses: paloitmbb/mss-devops-workflow/actions/security-scan-tfsec@main
        with:
          working-directory: ./env/prod
        continue-on-error: true

      - uses: paloitmbb/mss-devops-workflow/actions/security-scan-trivy@main
        with:
          working-directory: ./env/prod
        continue-on-error: true

      - uses: paloitmbb/mss-devops-workflow/actions/security-aggregate-results@main
        with:
          tfsec-outcome: ${{ steps.tfsec.outcome }}
          trivy-outcome: ${{ steps.trivy.outcome }}

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-plan@main
        with:
          working-directory: ./env/prod

      - uses: paloitmbb/mss-devops-workflow/actions/github-comment-plan@main
```

---

## Inputs & Secrets

### Common Workflow Inputs

| Input | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `environment` | **Yes** | — | Drives backend selection, resource naming, and PR messages. |
| `terraform-version` | No | `1.7.0` | Terraform version to install. |
| `working-directory` | No | `.` | Root directory of the Terraform configuration. |
| `terraform-var-file` | No | — | Var file path, relative to `working-directory`. Improves scan accuracy significantly. |
| `enable-tfsec` | No | `true` | Toggle tfsec scanner. |
| `enable-trivy` | No | `true` | Toggle Trivy scanner. |
| `tfsec-severity` | No | `HIGH` | Minimum severity for tfsec findings. |
| `trivy-severity` | No | `HIGH` | Minimum severity for Trivy findings. |

### Secrets

| Secret | Required by | Description |
| :--- | :--- | :--- |
| `AZURE_CLIENT_ID` | `terraform-ci`, `terraform-security` | Azure AD application Client ID. |
| `AZURE_TENANT_ID` | `terraform-ci`, `terraform-security` | Azure AD Tenant ID. |
| `AZURE_SUBSCRIPTION_ID` | `terraform-ci`, `terraform-security` | Azure Subscription ID. |
| `ARM_CLIENT_ID` | `terraform-ci-github` | Azure AD application Client ID (OIDC). |
| `ARM_TENANT_ID` | `terraform-ci-github` | Azure AD Tenant ID (OIDC). |
| `ARM_SUBSCRIPTION_ID` | `terraform-ci-github` | Azure Subscription ID (OIDC). |
| `ORG_GITHUB_TOKEN` | `terraform-ci-github` | Token for GitHub Terraform provider authentication. |

---

## Usage Recipes

### PR Validation Only

Fast feedback on pull requests — validation and security scans, no artifact uploads.

```yaml
name: PR Checks
on: pull_request

permissions:
  contents: read
  id-token: write
  security-events: write
  actions: read

jobs:
  security:
    uses: paloitmbb/mss-devops-workflow/.github/workflows/terraform-security.yml@main
    with:
      working-directory: ./env/prod
      environment: prod
      terraform-var-file: terraform.tfvars
    secrets:
      AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
      AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

### GitHub Org Infrastructure

For repos managing GitHub organization resources via the GitHub Terraform provider, using Azure Blob for state.

```yaml
jobs:
  gh-infra:
    uses: paloitmbb/mss-devops-workflow/.github/workflows/terraform-ci-github.yml@main
    with:
      environment: dev
      working-directory: ./mbb-iac
    secrets:
      ORG_GITHUB_TOKEN: ${{ secrets.ORG_GITHUB_TOKEN }}
      ARM_CLIENT_ID: ${{ secrets.ARM_CLIENT_ID }}
      ARM_TENANT_ID: ${{ secrets.ARM_TENANT_ID }}
      ARM_SUBSCRIPTION_ID: ${{ secrets.ARM_SUBSCRIPTION_ID }}
```

### Dynamic Environments

Branch-based environment and severity configuration:

```yaml
with:
  environment: ${{ startsWith(github.ref, 'refs/heads/main') && 'prod' || 'dev' }}
  tfsec-severity: ${{ startsWith(github.ref, 'refs/heads/main') && 'HIGH' || 'MEDIUM' }}
```

---

## Actions Reference

All actions live in `actions/<name>/action.yml` and are called by the reusable workflows. They can also be used standalone.

### Core Terraform

| Action | Description |
| :--- | :--- |
| `terraform-setup` | Installs Terraform, checks out code, and configures the environment. |
| `terraform-init` | Initializes Terraform with optional backend configuration. |
| `terraform-plan` | Runs `terraform plan` and writes output files. |
| `terraform-validate-syntax` | Runs `terraform fmt` and `terraform validate`. |
| `terraform-extract-metadata` | Generates metadata and hashes from plan files. |
| `terraform-detect-environment` | Detects which environment changed based on modified file paths. |

### Security & Compliance

| Action | Description |
| :--- | :--- |
| `azure-login-oidc` | Authenticates with Azure using OIDC (Workload Identity Federation). |
| `security-scan-tfsec` | Scans Terraform code with tfsec (200+ cloud security rules). |
| `security-scan-trivy` | Scans for CVEs, secrets, and misconfigurations with Trivy. |
| `security-scan-checkov` | Composite action ready to wire in (not yet enabled by default). |
| `security-aggregate-results` | Aggregates scanner outcomes into a single pass/fail result. |
| `security-generate-sarifname` | Generates deterministic SARIF filenames for consistent uploads. |

### GitHub Integration

| Action | Description |
| :--- | :--- |
| `github-comment-plan` | Posts the Terraform plan summary as a PR comment. |
| `github-create-pullrequest` | Creates a new Pull Request. |
| `github-notify-issue` | Updates issues with status notifications. |
| `github-parse-issueform` | Parses GitHub Issue form data into usable variables. |
| `github-validate-request` | Validates repository creation requests. |
| `github-load-defaults` | Loads default configuration values. |
| `github-update-yamlconfig` | Updates YAML configuration files. |
| `github-stats` | Collects and reports GitHub statistics. |

### Utilities

| Action | Description |
| :--- | :--- |
| `azure-upload-artifact` | Uploads artifacts to Azure Blob Storage. |
| `migration-parse-issue-form` | Parses migration-related issue form data. |
| `migration-validation` | Validates migration requests. |
| `migration-upload-logs` | Uploads migration logs to storage. |

---

## Security Architecture

### OIDC Authentication

All Azure interactions use **Workload Identity Federation** — no stored passwords or client secrets.

See [docs/AZURE-OIDC-QUICKSTART.md](docs/AZURE-OIDC-QUICKSTART.md) for federated credential setup.

### Parallel Security Scanning

tfsec and Trivy run as parallel jobs with `continue-on-error: true`. The `aggregate-security` job then evaluates combined outcomes and sets the final pipeline status.

```
validate → [tfsec | trivy] → aggregate (pass/fail gate) → plan
```

### Plan Integrity (`terraform-ci` only)

1. `terraform-plan` generates the plan file.
2. `terraform-extract-metadata` hashes the plan for verification.
3. `actions/attest-build-provenance` signs the plan (when attestation is enabled).
4. Plan summary is posted to the Pull Request via `github-comment-plan`.

---

## Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `AADSTS700016` error | Missing federated credential | Run `az ad app federated-credential list --id $AZURE_CLIENT_ID` and review [OIDC guide](docs/AZURE-OIDC-QUICKSTART.md). |
| SARIF upload fails | Missing permissions | Add `actions: read` and `security-events: write` to your workflow permissions. |
| `terraform-var-file` not found | Incorrect path | Path must be relative to `working-directory`, not the repo root. |
| Plan step hangs | Backend not initialized | Ensure `terraform-setup` and `terraform-init` complete before the plan job runs. |

---

## Documentation

| Resource | Description |
| :--- | :--- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Repo structure, data flow, design rules, security model. |
| [docs/REFERENCE.md](docs/REFERENCE.md) | Full inputs/outputs for every workflow and action. |
| [docs/AZURE-OIDC-QUICKSTART.md](docs/AZURE-OIDC-QUICKSTART.md) | Azure federated credential (OIDC) setup guide. |
| [examples/README.md](examples/README.md) | Workflow selection guide and quick-start snippets. |
| [docs/CUSTOM-ACTIONS-PIPELINE.md](docs/CUSTOM-ACTIONS-PIPELINE.md) | Step-by-step custom pipelines using individual actions. |
| [docs/ENVIRONMENT-STRUCTURE-GUIDE.md](docs/ENVIRONMENT-STRUCTURE-GUIDE.md) | Consumer repo Terraform directory structure guide. |
