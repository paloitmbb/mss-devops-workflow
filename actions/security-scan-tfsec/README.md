# Security - Scan tfsec

Run tfsec Terraform security scanning with automated SARIF upload.

tfsec uses static analysis of your terraform code to spot potential security issues. It checks for sensitive data, weak defaults, and non-compliance with best practices.

## Usage

```yaml
steps:
  - name: Run tfsec
    uses: paloitmbb/mss-devops-workflow/actions/security-scan-tfsec@main
    with:
      enabled: 'true'
      working-directory: './terraform'
      environment: 'dev'
      severity: 'HIGH'
      continue-on-error: 'true'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `enabled` | Set to `false` to skip the scan. | **Yes** | |
| `working-directory` | Directory containing Terraform files. | **Yes** | |
| `environment` | Environment name (for SARIF categorization). | **Yes** | |
| `severity` | Failure threshold (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). | **Yes** | |
| `var-file` | Path to a Terraform variables file. | No | `''` |
| `continue-on-error` | Prevent workflow failure on scan issues. | No | `true` |

## Outputs

| Output | Description |
| :--- | :--- |
| `outcome` | Result of the scan: `success`, `failure`, or `skipped`. |

## Features

-   **SARIF Output**: Generates `tfsec-results.sarif` and uploads to GitHub Code Scanning.
-   **No Download**: Configured with `--exclude-downloaded-modules` for speed and security.

> [!TIP]
> tfsec is lightweight and fast. It is recommended to run this on every PR.
