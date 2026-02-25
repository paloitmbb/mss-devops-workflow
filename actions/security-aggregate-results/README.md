# Security - Aggregate Results

Aggregate and evaluate results from multiple security scanners (tfsec, Checkov, Trivy).

This action acts as a centralized gate for security compliance. It takes the individual outcomes of various scanning tools and determines the overall security status of the workflow.

## Usage

```yaml
steps:
  - name: Aggregate Security Results
    id: security
    uses: paloitmbb/mss-devops-workflow/actions/security-aggregate-results@main
    with:
      # Module: tfsec
      tfsec-enabled: 'true'
      tfsec-outcome: ${{ steps.tfsec.outcome }}

      # Module: Checkov
      checkov-enabled: 'true'
      checkov-outcome: ${{ steps.checkov.outcome }}

      # Module: Trivy
      trivy-enabled: 'true'
      trivy-outcome: ${{ steps.trivy.outcome }}
```

## Inputs

| Input | Description | Required |
| :--- | :--- | :--- |
| `tfsec-enabled` | Was tfsec scanning enabled? | **Yes** |
| `tfsec-outcome` | Outcome of the tfsec step (`success`, `failure`, `skipped`). | **Yes** |
| `checkov-enabled` | Was Checkov scanning enabled? | **Yes** |
| `checkov-outcome` | Outcome of the Checkov step. | **Yes** |
| `trivy-enabled` | Was Trivy scanning enabled? | **Yes** |
| `trivy-outcome` | Outcome of the Trivy step. | **Yes** |

## Outputs

| Output | Description |
| :--- | :--- |
| `all-passed` | `true` if all **enabled** scanners succeeded. |
| `tfsec-status` | Final status for tfsec (`skipped` if disabled). |
| `checkov-status` | Final status for Checkov (`skipped` if disabled). |
| `trivy-status` | Final status for Trivy (`skipped` if disabled). |

## Logic

-   If a scanner is **disabled**, its final status is `skipped`.
-   If a scanner is **enabled** but fails, the overall `all-passed` output becomes `false`.
-   The action will log an error annotation if `all-passed` is `false`.

> [!TIP]
> Use this action after running scanners with `continue-on-error: true` to collect all results before failing the build.
