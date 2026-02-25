# Terraform - Validate Syntax

Validate Terraform configuration files for syntax correctness and code quality.

This action runs a suite of static checks:
1.  `terraform fmt`: Checks for canonical formatting.
2.  `terraform validate`: Checks for syntax validity and attribute correctness.
3.  `tflint`: (Optional) Runs deep linting for provider-specific issues and best practices.

## Usage

```yaml
steps:
  - name: Validate Syntax
    uses: paloitmbb/mss-devops-workflow/actions/terraform-validate-syntax@main
    with:
      working-directory: './terraform'
      enable-tflint: 'true'
      tflint-version: 'v0.50.0'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `working-directory` | Path to Terraform code. | No | `.` |
| `enable-tflint` | Enable TFLint checks. | No | `true` |
| `tflint-version` | Version of TFLint to install. | No | `v0.60.0` |

## Outputs

| Output | Description |
| :--- | :--- |
| `fmt-status` | Status of format check (`success`/`failure`). |
| `validate-status` | Status of syntax validation (`success`/`failure`). |
| `tflint-status` | Status of linting (`success`/`failure`/`skipped`). |

> [!IMPORTANT]
> `terraform validate` requires providers to be initialized. Ensure `terraform-init` has run successfully before calling this action.
