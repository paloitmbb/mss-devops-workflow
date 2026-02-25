# Azure - Upload Artifact

Upload files or directories to Azure Blob Storage using OIDC authentication.

This action simplifies the process of pushing build artifacts, logs, or other data to Azure Storage. It supports both single file and recursive directory uploads.

## Usage

### Upload a Single File

```yaml
steps:
  - name: Upload Log File
    uses: paloitmbb/mss-devops-workflow/actions/azure-upload-artifact@main
    with:
      storage-account-name: 'mystorageaccount'
      container-name: 'logs'
      source-path: './terraform-plan.log'
      destination-path: 'daily-logs/'
      content-type: 'text/plain'
```

### Upload a Directory

```yaml
steps:
  - name: Upload Build Artifacts
    uses: paloitmbb/mss-devops-workflow/actions/azure-upload-artifact@main
    with:
      storage-account-name: 'mystorageaccount'
      container-name: 'builds'
      source-path: './dist'
      destination-path: 'v1.0.0/'
      overwrite: 'true'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `storage-account-name` | The name of the Azure Storage Account. | **Yes** | |
| `container-name` | The name of the blob container (must exist). | **Yes** | |
| `source-path` | Local path to the file or directory to upload. | **Yes** | |
| `destination-path` | Destination prefix in the blob container. Use a trailing `/` for directories. | No | `''` (root) |
| `overwrite` | Whether to overwrite existing blobs. | No | `true` |
| `content-type` | Content type for the uploaded blobs (e.g., `application/json`). | No | Auto-detect |

## Outputs

| Output | Description |
| :--- | :--- |
| `upload-status` | The final status of the upload operation (`success` or `failed`). |
| `uploaded-count` | The total number of files successfully uploaded. |

> [!NOTE]
> This action requires an active Azure session. Use `azure-login-oidc` before this step.
