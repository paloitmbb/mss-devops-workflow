# Security - Scan Checkov

Run Checkov Infrastructure-as-Code (IaC) security scanning with automated SARIF upload.

Checkov statically analyzes your Terraform code to find misconfigurations that may lead to security or compliance issues.

## Usage

```yaml
steps:
  - name: Run Checkov
    uses: paloitmbb/mss-devops-workflow/actions/security-scan-checkov@main
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

-   **SARIF Integration**: Automatically uploads results to GitHub Security tab (Code Scanning) if enabled.
-   **Conditional Execution**: Can be toggled via the `enabled` input.
-   **Framework Support**: Specifically configured for `terraform` scanning.

> [!NOTE]
> This action runs `bridgecrewio/checkov-action` internally.
