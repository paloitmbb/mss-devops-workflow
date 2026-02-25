# GitHub - Comment Plan on PR

Post the results of a Terraform plan and security scans as a formatted comment on a Pull Request.

This action aggregates information from Terraform (fmt, validate, plan) and security scanners (tfsec, Trivy) to provide a comprehensive summary directly in the PR.

## Usage

```yaml
steps:
  - name: Post Plan Comment
    uses: paloitmbb/mss-devops-workflow/actions/github-comment-plan@main
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      working-directory: './terraform'
      environment: 'dev'
      terraform-version: '1.5.0'
      # Plan Details
      plan-exitcode: ${{ steps.plan.outputs.exitcode }}
      plan-summary: ${{ steps.plan.outputs.stdout }}
      # Validation Statuses
      fmt-status: ${{ steps.fmt.outcome }}
      validate-status: ${{ steps.validate.outcome }}
      tfsec-status: ${{ steps.tfsec.outcome }}
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `github-token` | GitHub token for posting comments. | **Yes** | |
| `working-directory` | Directory containing `plan-output.txt`. | **Yes** | |
| `environment` | The target environment name (e.g., dev, prod). | **Yes** | |
| `terraform-version` | The Terraform version used. | **Yes** | |
| `plan-exitcode` | The exit code from the `terraform plan` command. | **Yes** | |
| `plan-summary` | Fallback text summary if `plan-output.txt` is missing. | No | `''` |
| `plan-hash` | SHA256 hash of the plan file (if generated). | No | `''` |
| `fmt-status` | Status of `terraform fmt`. | No | `''` |
| `validate-status` | Status of `terraform validate`. | No | `''` |
| `tflint-status` | Status of `tflint`. | No | `''` |
| `tfsec-status` | Status of `tfsec` scan. | No | `skipped` |
| `trivy-status` | Status of `trivy` scan. | No | `skipped` |

## Features

-   **Automatic Truncation**: Large plans are automatically truncated to fit within GitHub's comment character limit.
-   **Status Emojis**: Visual indicators for success, failure, and skipped steps.
-   **Security Integration**: Displays the status of security tools alongside the infrastructure plan.

> [!IMPORTANT]
> `pull-requests: write` permission is required for the job to post comments.
