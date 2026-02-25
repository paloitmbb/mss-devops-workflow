# Terraform - Init

Initialize a Terraform working directory, configuring the backend for state storage.

This action wraps `terraform init` with support for dynamic backend configuration (Azure Storage) and scan-only modes where backend initialization is skipped.

## Usage

### Standard Initialization (Backend Enabled)

```yaml
steps:
  - name: Init Terraform
    uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
    with:
      working-directory: './terraform'
      backend-config-file: 'backend.tfvars'
```

### Scan-Only Mode (Backend Disabled)

```yaml
steps:
  - name: Init for Security Scan
    uses: paloitmbb/mss-devops-workflow/actions/terraform-init@main
    with:
      working-directory: './terraform'
      enable-backend: 'false'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `working-directory` | Path to Terraform code. | **Yes** | `.` |
| `enable-backend` | Set to `false` to run `init -backend=false`. | No | `true` |
| `backend-config-file` | Path to a backend configuration file. | No | `''` |
| `backend-config` | Inline backend config (key=value pairs). | No | `''` |

## Outputs

| Output | Description |
| :--- | :--- |
| `backend-enabled` | Boolean indicating if backend was configured. |

## Environment Variables

This action relies on environment variables set by the `azure-login-oidc` action for backend authentication:
-   `ARM_CLIENT_ID`
-   `ARM_TENANT_ID`
-   `ARM_SUBSCRIPTION_ID`
-   `ARM_USE_OIDC`
