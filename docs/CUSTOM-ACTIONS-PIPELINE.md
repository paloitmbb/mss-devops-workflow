# Custom Composite Actions Pipeline

Use this guide when you need **full step-by-step control** over your Terraform pipeline instead of calling a pre-built reusable workflow.

Every individual action lives at `paloitmbb/mss-devops-workflow/actions/<name>@main`.

> **When to use reusable workflows instead**: If you only need standard validate → scan → plan behaviour, calling the reusable workflow (e.g. `terraform-ci.yml`) is simpler and gets you there in 10 lines. Use this guide when you need to customise the job graph, insert custom steps between standard ones, or combine Terraform actions with unrelated jobs.

---

## Action Call Pattern

```yaml
- uses: paloitmbb/mss-devops-workflow/actions/<action-name>@main
  with:
    input-name: value
```

All action inputs and outputs are documented in [REFERENCE.md](REFERENCE.md).

---

## 1. Minimal PR Validation (Backend Disabled)

Validates syntax and formatting without Azure authentication. Ideal for fast PR feedback.

```yaml
name: Terraform PR Validation

on:
  pull_request:
    branches: [main]
    paths: ['terraform/**']

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main
        with:
          terraform-version: '1.7.0'

      - name: Init (Backend Disabled)
        uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
        with:
          working-directory: ./terraform
          enable-backend: 'false'

      - name: Validate & Lint
        uses: paloitmbb/mss-devops-workflow/actions/terraform-validate-syntax@main
        with:
          working-directory: ./terraform
          enable-tflint: 'true'
```

---

## 2. Parallel Security Scanning

Run tfsec and Trivy as **separate parallel jobs**, then aggregate to a single gate. This mirrors what the built-in `terraform-security.yml` reusable workflow does internally.

```yaml
name: Security Audit

on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * 1'   # Weekly Monday 06:00 UTC

permissions:
  contents: read
  security-events: write

env:
  WORKING_DIR: ./terraform
  ENVIRONMENT: prod

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          enable-backend: 'false'

  scan-tfsec:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate SARIF name
        id: sarif
        uses: paloitmbb/mss-devops-workflow/actions/security-generate-sarifname@main
        with:
          scanner-name: tfsec
          source-file: tfsec-results.sarif
          environment: ${{ env.ENVIRONMENT }}

      - name: tfsec scan
        id: tfsec
        uses: paloitmbb/mss-devops-workflow/actions/security-scan-tfsec@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          severity: HIGH
          environment: ${{ env.ENVIRONMENT }}
        continue-on-error: true

      - name: Upload SARIF
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ${{ steps.sarif.outputs.renamed-file }}
          path: ${{ steps.sarif.outputs.renamed-path }}

  scan-trivy:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Trivy scan
        id: trivy
        uses: paloitmbb/mss-devops-workflow/actions/security-scan-trivy@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          severity: HIGH
          environment: ${{ env.ENVIRONMENT }}
        continue-on-error: true

  aggregate:
    needs: [scan-tfsec, scan-trivy]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4

      - name: Aggregate Results
        uses: paloitmbb/mss-devops-workflow/actions/security-aggregate-results@main
        with:
          tfsec-enabled: 'true'
          tfsec-outcome: ${{ needs.scan-tfsec.result }}
          trivy-enabled: 'true'
          trivy-outcome: ${{ needs.scan-trivy.result }}
          aggregate-continue-on-error: 'false'
```

---

## 3. Full CI Pipeline (Authenticate → Scan → Plan → Attest → Comment)

The most complete pipeline you can build with individual actions. This is roughly what `terraform-ci.yml` does internally.

**Required secrets**: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`

```yaml
name: Terraform CI

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  id-token: write
  pull-requests: write
  security-events: write
  attestations: write
  actions: read

env:
  TF_VERSION: '1.7.0'
  WORKING_DIR: ./env/prod
  ENVIRONMENT: prod

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      # ── 1. SETUP ─────────────────────────────────────────────────────
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main
        with:
          terraform-version: ${{ env.TF_VERSION }}

      # ── 2. AUTHENTICATE ──────────────────────────────────────────────
      - name: Azure OIDC Login
        uses: paloitmbb/mss-devops-workflow/actions/azure-login-oidc@main
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # ── 3. INITIALISE ────────────────────────────────────────────────
      - name: Terraform Init
        uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          enable-backend: 'true'

      # ── 4. VALIDATE ──────────────────────────────────────────────────
      - name: Validate Syntax
        uses: paloitmbb/mss-devops-workflow/actions/terraform-validate-syntax@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          enable-tflint: 'true'

      # ── 5. SECURITY SCANS (non-blocking) ─────────────────────────────
      - name: tfsec
        id: tfsec
        uses: paloitmbb/mss-devops-workflow/actions/security-scan-tfsec@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          severity: HIGH
          environment: ${{ env.ENVIRONMENT }}
        continue-on-error: true

      - name: Trivy
        id: trivy
        uses: paloitmbb/mss-devops-workflow/actions/security-scan-trivy@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          severity: HIGH
          environment: ${{ env.ENVIRONMENT }}
        continue-on-error: true

      # ── 6. AGGREGATE SECURITY ─────────────────────────────────────────
      - name: Aggregate Security Results
        if: always()
        uses: paloitmbb/mss-devops-workflow/actions/security-aggregate-results@main
        with:
          tfsec-enabled: 'true'
          tfsec-outcome: ${{ steps.tfsec.outcome }}
          trivy-enabled: 'true'
          trivy-outcome: ${{ steps.trivy.outcome }}
          aggregate-continue-on-error: 'false'

      # ── 7. PLAN ───────────────────────────────────────────────────────
      - name: Terraform Plan
        id: plan
        uses: paloitmbb/mss-devops-workflow/actions/terraform-plan@main
        with:
          working-directory: ${{ env.WORKING_DIR }}
          environment: ${{ env.ENVIRONMENT }}
          var-file: prod.tfvars
          upload-artifacts: 'true'
          generate-metadata: 'true'
          generate-attestation: 'true'

      # ── 8. COMMENT ON PR ──────────────────────────────────────────────
      - name: Post Plan Comment
        if: github.event_name == 'pull_request'
        uses: paloitmbb/mss-devops-workflow/actions/github-comment-plan@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          working-directory: ${{ env.WORKING_DIR }}
          environment: ${{ env.ENVIRONMENT }}
          terraform-version: ${{ env.TF_VERSION }}
          plan-exitcode: ${{ steps.plan.outputs.exitcode }}
          plan-hash: ${{ steps.plan.outputs.plan-hash }}
```

---

## 4. Environment Auto-Detection

Use `terraform-detect-environment` to automatically pick the target environment from changed file paths, removing the need for hard-coded branch conditions.

```yaml
jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.detect.outputs.environment }}
      working-directory: ${{ steps.detect.outputs.working-directory }}
    steps:
      - uses: actions/checkout@v4

      - id: detect
        uses: paloitmbb/mss-devops-workflow/actions/terraform-detect-environment@main
        with:
          fallback-environment: dev
          working-directory-prefix: ./env

  plan:
    needs: detect
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main

      - uses: paloitmbb/mss-devops-workflow/actions/azure-login-oidc@main
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
        with:
          working-directory: ${{ needs.detect.outputs.working-directory }}

      - uses: paloitmbb/mss-devops-workflow/actions/terraform-plan@main
        with:
          working-directory: ${{ needs.detect.outputs.working-directory }}
          environment: ${{ needs.detect.outputs.environment }}
```

---

## Action Sequencing Reference

| Phase | Action | Depends on | Notes |
|-------|--------|------------|-------|
| Setup | `terraform-setup` | — | Always first |
| Auth | `azure-login-oidc` | `terraform-setup` | Skip if backend disabled |
| Init | `terraform-init` | `azure-login-oidc` (if backend) | Set `enable-backend: 'false'` for scan-only |
| Validate | `terraform-validate-syntax` | `terraform-init` | Can run in parallel with security scans |
| Security | `security-scan-tfsec` | `terraform-init` | Run in parallel jobs with `continue-on-error: true` |
| Security | `security-scan-trivy` | `terraform-init` | Run in parallel jobs with `continue-on-error: true` |
| Security | `security-scan-checkov` | `terraform-init` | Available; wire in following the same pattern |
| Gate | `security-aggregate-results` | All scan jobs | Single pass/fail gate |
| Plan | `terraform-plan` | `security-aggregate-results` | Requires auth + backend |
| Audit | `terraform-extract-metadata` | `terraform-plan` | Creates `plan-metadata.json` + SHA-256 |
| Report | `github-comment-plan` | `terraform-plan` | Posts to PR |

Full inputs/outputs: [REFERENCE.md](REFERENCE.md).
