# Architecture

How `paloitmbb/mss-devops-workflow` is structured, why it is designed this way, and the data flow from a consumer repository through to Terraform execution.

---

## Repository Layout

```
mss-devops-workflow/
├── .github/workflows/        ← Reusable workflows (entry points for consumers)
│   ├── terraform-ci.yml
│   ├── terraform-security.yml
│   └── terraform-ci-github.yml
│
├── actions/                  ← Composite actions (building blocks)
│   ├── terraform-setup/
│   ├── terraform-init/
│   ├── terraform-plan/
│   ├── terraform-validate-syntax/
│   ├── terraform-detect-environment/
│   ├── terraform-extract-metadata/
│   ├── azure-login-oidc/
│   ├── azure-upload-artifact/
│   ├── security-scan-tfsec/
│   ├── security-scan-trivy/
│   ├── security-scan-checkov/
│   ├── security-aggregate-results/
│   ├── security-generate-sarifname/
│   ├── github-comment-plan/
│   ├── github-create-pullrequest/
│   ├── github-load-defaults/
│   ├── github-notify-issue/
│   ├── github-parse-issueform/
│   ├── github-stats/
│   ├── github-update-yamlconfig/
│   ├── github-validate-request/
│   ├── migration-validation/
│   ├── migration-parse-issue-form/
│   └── migration-upload-logs/
│
├── docs/                     ← Reference documentation (you are here)
│   ├── ARCHITECTURE.md       ← This file
│   ├── REFERENCE.md          ← Full input/output reference
│   ├── AZURE-OIDC-QUICKSTART.md
│   ├── ENVIRONMENT-STRUCTURE-GUIDE.md
│   └── CUSTOM-ACTIONS-PIPELINE.md
│
└── examples/                 ← Copy-paste workflow files for consumer repos
    ├── README.md
    ├── terraform-ci-example.yml
    ├── pr-security-check-example.yml
    └── terraform-gh-ci-example.yml
```

---

## Two Layers in One Repo

### Layer 1 — Reusable Workflows (`.github/workflows/`)

Pre-assembled pipelines. Consumer repositories call them with a single `uses:` line via GitHub's `workflow_call` mechanism. All orchestration (job ordering, parallelism, pass/fail logic) is handled internally.

```yaml
# In a consumer repo's .github/workflows/terraform-ci.yml
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

### Layer 2 — Composite Actions (`actions/`)

Single-purpose building blocks. Used internally by the reusable workflows, and also available for consumers who need a fully custom job graph.

```yaml
# In any workflow job
- uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main
- uses: paloitmbb/mss-devops-workflow/actions/azure-login-oidc@main
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    ...
```

> **Why self-referencing URLs?** GitHub Actions requires full `owner/repo/path@ref` syntax when calling actions from an external repository (or when a reusable workflow calls actions in its own repo). Relative paths are not supported across repository boundaries.

---

## Data Flow

```
Consumer repo
    │
    │  workflow_call (inputs + secrets)
    ▼
.github/workflows/terraform-ci.yml   ← Job orchestrator
    │
    ├─ Job: setup
    │     └─ actions/terraform-setup          checkout + install TF
    │     └─ actions/azure-login-oidc         OIDC token → ARM_* env vars
    │     └─ actions/terraform-init           backend init
    │
    ├─ Job: validate (parallel with security)
    │     └─ actions/terraform-validate-syntax   fmt + validate + tflint
    │
    ├─ Job: scan-tfsec (parallel)
    │     └─ actions/security-scan-tfsec      SARIF output
    │
    ├─ Job: scan-trivy (parallel)
    │     └─ actions/security-scan-trivy      SARIF output
    │
    ├─ Job: aggregate-security (after both scans)
    │     └─ actions/security-aggregate-results   pass/fail gate
    │
    └─ Job: plan (after aggregate passes)
          └─ actions/terraform-plan           tfplan file
          └─ actions/terraform-extract-metadata   SHA-256 + metadata JSON
          └─ actions/github-comment-plan      PR comment
          └─ azure-upload-artifact            plan → Azure Blob Storage
```

---

## Three Reusable Workflows

| Workflow | Trigger pattern | Backend | Secrets | PR comments | Artifacts |
|----------|----------------|---------|---------|-------------|-----------|
| `terraform-ci.yml` | Push / post-merge / nightly | Azure (`azurerm`) | `AZURE_*` | Optional | ✅ plan + attestation |
| `terraform-security.yml` | Pull requests | Azure (`azurerm`) | `AZURE_*` | ❌ | ❌ |
| `terraform-ci-github.yml` | Push / PR | Azure (`azurerm`) | `ARM_*` + `ORG_GITHUB_TOKEN` | ✅ | ✅ |

`terraform-ci-github.yml` is for repositories that manage **GitHub organisation resources** using the `hashicorp/github` Terraform provider. It injects `ORG_GITHUB_TOKEN` for the provider while still using Azure Storage for backend state.

---

## Composite Action Design Rules

1. **Single responsibility** — one action does exactly one thing (setup, login, scan, plan, comment).
2. **No orchestrator actions** — job ordering and `needs:` dependencies live in the workflow, not in an action.
3. **Required `environment` input** — all workflow entry points accept this; it drives backend container naming, SARIF filenames, and PR messaging.
4. **Always pass `terraform-var-file`** — security scanners operate statically; providing the `.tfvars` file raises coverage from ~70 % to ~95 %.

---

## Security Architecture

### Zero Static Credentials (OIDC)

All Azure-backed workflows use **Workload Identity Federation**. No client secrets are stored anywhere.

```
GitHub Actions runner
    │  requests OIDC token (JWT)
    ▼
Azure AD  →  validates issuer + subject claim
    │  issues short-lived access token
    ▼
Azure Storage  ←  ARM_* env vars exported by azure-login-oidc action
Terraform provider
```

Setup guide: [AZURE-OIDC-QUICKSTART.md](AZURE-OIDC-QUICKSTART.md).

### Parallel Security Scanning

tfsec and Trivy always run in **separate parallel jobs** with `continue-on-error: true` so that all findings are visible even when one scanner fails. The `security-aggregate-results` action collects all outcomes and determines a single pass/fail result.

```
scan-tfsec ─┐
             ├─► security-aggregate-results ─► PASS or FAIL
scan-trivy ─┘
```

Checkov (`actions/security-scan-checkov/`) is implemented as a composite action and follows the same parallel pattern. To wire it in, add a third parallel job and pass its outcome to `security-aggregate-results` — see the [copilot-instructions](.github/copilot-instructions.md) section "Adding a New Security Scanner".

### Plan Integrity

For `terraform-ci.yml`:
1. `terraform-plan` generates the plan file.
2. `terraform-extract-metadata` computes a SHA-256 hash and writes `plan-metadata.json`.
3. `actions/attest-build-provenance` signs the plan (when `generate-attestation: true`).
4. The signed artifact is uploaded to Azure Blob Storage and the hash is posted to the PR comment.

---

## Action Reference Map

### Terraform Lifecycle

| Order | Action | Key inputs | Key outputs |
|-------|--------|------------|-------------|
| 1 | `terraform-setup` | `terraform-version` | — |
| 2 | `azure-login-oidc` | `client-id`, `tenant-id`, `subscription-id` | ARM_* env vars |
| 3 | `terraform-init` | `working-directory`, `enable-backend` | — |
| 4 | `terraform-validate-syntax` | `working-directory`, `enable-tflint` | — |
| 5 | `terraform-plan` | `working-directory`, `environment`, `var-file` | `exitcode`, `plan-hash` |
| 6 | `terraform-extract-metadata` | `working-directory` | `plan-hash`, metadata JSON |
| 7 | `github-comment-plan` | `github-token`, `plan-exitcode`, `plan-hash` | — |

### Security

| Action | Purpose |
|--------|---------|
| `security-scan-tfsec` | Terraform-specific rules (200+ checks) |
| `security-scan-trivy` | CVEs, secrets, misconfigurations |
| `security-scan-checkov` | Policy-as-code (wire in separately) |
| `security-aggregate-results` | Single pass/fail gate across all scanners |
| `security-generate-sarifname` | Deterministic SARIF filename per `{env}-{scanner}-{branch}-{commit}` |

### GitHub Integration

| Action | Purpose |
|--------|---------|
| `github-comment-plan` | Post plan summary + security status to a PR |
| `github-create-pullrequest` | Create branch + commit + open PR (GitOps workflows) |
| `github-load-defaults` | Load org-wide YAML defaults (`repository_defaults`) |
| `github-notify-issue` | Post status updates to GitHub Issues |
| `github-parse-issueform` | Extract fields from Issue Forms |
| `github-stats` | Retrieve repo statistics |
| `github-update-yamlconfig` | Append entries to YAML config files using `yq` |
| `github-validate-request` | Validate repo-creation requests (naming, team, uniqueness) |

### Utilities & Migration

| Action | Purpose |
|--------|---------|
| `azure-upload-artifact` | Upload files to Azure Blob Storage |
| `terraform-detect-environment` | Detect `dev`/`stage`/`prod` from changed file paths |
| `migration-validation` | Pre-flight checks for migrations |
| `migration-parse-issue-form` | Parse migration-request issues |
| `migration-upload-logs` | Upload audit logs to Azure Storage |

---

## Ref Strategy

All `uses:` references currently point to `@main` (floating). For production consumer repos, pin to a commit SHA after pushing to avoid unintended upstream changes:

```yaml
uses: paloitmbb/mss-devops-workflow/.github/workflows/terraform-ci.yml@<COMMIT_SHA>
uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@<COMMIT_SHA>
```

---

## Further Reading

| Doc | Purpose |
|-----|---------|
| [REFERENCE.md](REFERENCE.md) | Full input/output tables for every workflow and action |
| [AZURE-OIDC-QUICKSTART.md](AZURE-OIDC-QUICKSTART.md) | 15-minute OIDC credential setup |
| [examples/README.md](../examples/README.md) | Practical examples and workflow selection guide |
| [docs/CUSTOM-ACTIONS-PIPELINE.md](CUSTOM-ACTIONS-PIPELINE.md) | Step-by-step custom pipelines using individual actions |
