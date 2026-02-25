# Terraform - Extract Metadata

Generate comprehensive metadata and integrity hash for Terraform plan artifacts.

This action creates a `plan-metadata.json` file containing audit information and calculates the SHA256 hash of the `tfplan` binary. This enables secure artifact tracking, provenance verification, and policy attestation.

## Usage

```yaml
steps:
  - name: Extract Plan Metadata
    id: meta
    uses: paloitmbb/mss-devops-workflow/actions/terraform-extract-metadata@main
    with:
      working-directory: './terraform'
      environment: 'production'
      terraform-version: '1.5.0'

  - name: View Artifact Name
    run: echo "Artifact: ${{ steps.meta.outputs.artifact-name }}"
```

## Inputs

| Input | Description | Required |
| :--- | :--- | :--- |
| `working-directory` | Directory containing the `tfplan` file. | **Yes** |
| `environment` | Target environment name. | **Yes** |
| `terraform-version` | Terraform version used to generate the plan. | **Yes** |

## Outputs

| Output | Description |
| :--- | :--- |
| `artifact-name` | Generated unique name (e.g., `tfplan-prod-a1b2c3d-123`). |
| `plan-hash` | The calculated SHA256 hash of the plan file. |

## Artifacts Created

The action generates a `plan-metadata.json` in the working directory:
```json
{
  "plan_hash": "sha256...",
  "terraform_version": "1.5.0",
  "environment": "production",
  "commit_sha": "...",
  "actor": "user",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

> [!IMPORTANT]
> A valid `tfplan` file must exist in the `working-directory` before running this action.
