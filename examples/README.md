# Examples

Copy-paste workflows for consumer repos. Each file is ready to drop into `.github/workflows/`.

## Which File to Use

| File | Trigger | Use when |
|------|---------|----------|
| [terraform-ci-example.yml](terraform-ci-example.yml) | Push / post-merge | Standard Azure Terraform CI — validate, scan, plan, upload artifacts |
| [pr-security-check-example.yml](pr-security-check-example.yml) | Pull request | Security gate before merge — scans + plan preview, no artifact uploads |
| [terraform-gh-ci-example.yml](terraform-gh-ci-example.yml) | Push / PR | GitHub org IaC — GitHub provider with Azure Storage backend |

```
PR opened?
  YES → pr-security-check-example.yml
  NO  → Managing GitHub org resources? → terraform-gh-ci-example.yml
        Standard Azure IaC?           → terraform-ci-example.yml
```

## Required Secrets

| Secret | Workflows |
|--------|-----------|
| `AZURE_CLIENT_ID` | terraform-ci, terraform-security |
| `AZURE_TENANT_ID` | terraform-ci, terraform-security |
| `AZURE_SUBSCRIPTION_ID` | terraform-ci, terraform-security |
| `ARM_CLIENT_ID` / `ARM_TENANT_ID` / `ARM_SUBSCRIPTION_ID` | terraform-ci-github |
| `ORG_GITHUB_TOKEN` | terraform-ci-github |

## Further Reading

| Doc | Purpose |
|-----|---------|
| [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Repo structure and data flow |
| [docs/REFERENCE.md](../docs/REFERENCE.md) | Full input/output reference |
| [docs/AZURE-OIDC-QUICKSTART.md](../docs/AZURE-OIDC-QUICKSTART.md) | OIDC credential setup |
| [docs/ENVIRONMENT-STRUCTURE-GUIDE.md](../docs/ENVIRONMENT-STRUCTURE-GUIDE.md) | Consumer repo directory layout |
