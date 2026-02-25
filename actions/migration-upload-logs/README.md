# Migration - Upload Logs

Generate a comprehensive migration log and upload it to Azure Blob Storage.

This action consolidates migration details (source metrics, target configuration, options used) into a structured log file and stores it for audit and historical tracking purposes.

## Usage

```yaml
steps:
  - name: Upload Migration Log
    uses: paloitmbb/mss-devops-workflow/actions/migration-upload-logs@main
    with:
      # specific to Azure credentials
      azure-client-id: ${{ secrets.AZURE_CLIENT_ID }}
      azure-tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      azure-subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # Migration Details
      source-org: 'my-source-org'
      source-repo: 'legacy-app'
      target-org: 'new-org'
      target-repo: 'modern-app'
      migration-options: 'issues,pull-requests,releases'

      # Metrics
      source-repo-size: '1024'
      source-pr-count: '50'
      source-issue-count: '120'
```

## Inputs

### Azure Configuration
| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `azure-client-id` | Azure AD Client ID for OIDC. | **Yes** | |
| `azure-tenant-id` | Azure AD Tenant ID. | **Yes** | |
| `azure-subscription-id` | Azure Subscription ID. | **Yes** | |
| `storage-account` | Storage Account name. | No | `mbbtfstate` |
| `container-name` | Blob container name. | No | `migration-logs` |

### Source Repository Details
| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `source-org` | Source GitHub organization. | **Yes** | |
| `source-repo` | Source repository name. | **Yes** | |
| `source-default-branch` | Default branch. | No | `main` |
| `source-repo-size` | Size in KB. | No | `0` |
| `source-pr-count` | Number of PRs. | No | `0` |
| `source-issue-count` | Number of issues. | No | `0` |
| `source-is-archived` | Archive status. | No | `false` |
(Additional metrics inputs available, see `action.yml`)

### Target & Migration Config
| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `target-org` | Target GitHub organization. | **Yes** | |
| `target-repo` | Target repository name. | **Yes** | |
| `target-visibility` | Target visibility (`private`/`public`). | No | `private` |
| `migration-options` | Selected migration features. | No | `''` |
| `admins` | Admin users list. | No | `''` |
| `team-mappings` | Team mapping configuration. | No | `''` |

> [!NOTE]
> This action requires an active Azure OIDC session or appropriate credentials to perform the upload.
