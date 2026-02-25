# Azure - Login OIDC

Authenticate to Azure using OpenID Connect (OIDC) and configure the environment for Terraform.

This action performs two key tasks:
1.  Authenticates to Azure using Workload Identity Federation (OIDC), eliminating the need for long-lived secrets.
2.  Exports the necessary `ARM_*` environment variables so Terraform can automatically use this identity.

## Usage

```yaml
steps:
  - name: Azure Login
    uses: paloitmbb/mss-devops-workflow/actions/azure-login-oidc@main
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

## Inputs

| Input | Description | Required |
| :--- | :--- | :--- |
| `client-id` | The Azure Client ID (Application ID) of the Service Principal. | **Yes** |
| `tenant-id` | The Azure Tenant ID where the Service Principal exists. | **Yes** |
| `subscription-id` | The Azure Subscription ID to authenticate against. | **Yes** |

## Environment Variables

This action exports the following environment variables for subsequent steps (e.g., Terraform):

-   `ARM_CLIENT_ID`
-   `ARM_TENANT_ID`
-   `ARM_SUBSCRIPTION_ID`
-   `ARM_USE_OIDC=true`

> [!IMPORTANT]
> Ensure your GitHub Actions workflow has `id-token: write` permission to request the OIDC token.

```yaml
permissions:
  id-token: write
  contents: read
```
