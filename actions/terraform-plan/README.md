# Terraform - Plan

Generate a Terraform execution plan (`tfplan`) with integrated artifact management and reporting.

This action runs `terraform plan`, captures the output, and optionally handles attestation generation, metadata extraction, and artifact uploading. It also parses the plan summary for display in GitHub Actions.

## Usage

```yaml
steps:
  - name: Terraform Plan
    uses: paloitmbb/mss-devops-workflow/actions/terraform-plan@main
    with:
      environment: 'dev'
      working-directory: './terraform'
      var-file: 'dev.tfvars'

      # Advanced Options
      upload-artifacts: 'true'
      generate-metadata: 'true'
      generate-attestation: 'true'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `environment` | Target environment name. | **Yes** | |
| `working-directory` | Path to Terraform code. | No | `.` |
| `var-file` | Path to a variable file (`-var-file`). | No | `''` |
| `terraform-version` | Version string for metadata. | No | `1.7.0` |
| `upload-artifacts` | Upload plan and metadata as artifacts. | No | `false` |
| `generate-metadata` | Generate `plan-metadata.json`. | No | `false` |
| `generate-attestation` | Generate build provenance attestation. | No | `false` |
| `show-summary` | Display plan summary in step output. | No | `true` |

## Outputs

| Output | Description |
| :--- | :--- |
| `exitcode` | Plan exit code (`0`=no changes, `2`=changes). |
| `has-changes` | Boolean `true` if changes detected. |
| `plan-summary` | Text summary of changes (Add/Change/Destroy). |
| `plan-hash` | SHA256 hash of the plan (if metadata enabled). |
| `artifact-name` | Name of the uploaded artifact. |

> [!NOTE]
> Returns `exitcode` 2 if changes are detected (standard Terraform behavior with `-detailed-exitcode`). This is often treated as success in CI pipelines.
