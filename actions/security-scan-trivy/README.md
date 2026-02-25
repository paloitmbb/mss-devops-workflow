# Security - Scan Trivy

Run Trivy security scanning on configuration files (`config` mode) with SARIF upload.

Trivy scans IaC configuration files (Terraform, Dockerfile, Kubernetes YAML, etc.) to detect misconfigurations and security vulnerabilities.

## Usage

```yaml
steps:
  - name: Run Trivy
    uses: paloitmbb/mss-devops-workflow/actions/security-scan-trivy@main
    with:
      enabled: 'true'
      working-directory: './terraform'
      environment: 'dev'
      severity: 'CRITICAL,HIGH'
      continue-on-error: 'true'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `enabled` | Set to `false` to skip the scan. | **Yes** | |
| `working-directory` | Directory or file path to scan. | **Yes** | |
| `environment` | Environment name (for SARIF categorization). | **Yes** | |
| `severity` | Comma-separated severities (`CRITICAL,HIGH`). | **Yes** | |
| `continue-on-error` | Prevent workflow failure on scan issues. | No | `true` |

## Outputs

| Output | Description |
| :--- | :--- |
| `outcome` | Result of the scan: `success`, `failure`, or `skipped`. |

## Features

-   **Config Scan**: Runs in `scan-type: config` mode, ideal for Terraform repositories.
-   **SARIF Integration**: Uploads results to GitHub Security tab under the category `trivy-{environment}`.
-   **Flexible Severity**: Allows specifying multiple severity levels (e.g., `CRITICAL,HIGH`).

> [!NOTE]
> This action uses the official `aquasecurity/trivy-action`.
