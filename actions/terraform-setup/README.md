# Terraform - Setup

Perform essential setup tasks for Terraform workflows.

This action orchestrates the initial environment setup:
1.  Check out the repository.
2.  Install the specified version of Terraform.
3.  Configure automation-friendly environment variables (`TF_IN_AUTOMATION`, etc.).

**This MUST be the first step in any workflow using Terraform.**

## Usage

```yaml
steps:
  - name: Setup Terraform
    uses: paloitmbb/mss-devops-workflow/actions/terraform-setup@main
    with:
      terraform-version: '1.7.0'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `terraform-version` | The version of Terraform to install. | No | `1.7.0` |

## Outputs

| Output | Description |
| :--- | :--- |
| `terraform-version` | The installed version string. |

## Environment Variables

This action automatically sets the following environment variables for subsequent steps:

-   `TF_IN_AUTOMATION=true`: Adjusts Terraform output for CI/CD environments.
-   `TF_INPUT=false`: Disables interactive prompts.
-   `TF_CLI_ARGS=-no-color`: Removes ANSI color codes from default output (handlers enable color explicitly where safe).

## Security

-   `persist-credentials: false` is used during checkout to prevent token exposure.
-   `fetch-depth: 0` is used to ensure full git history is available for environment detection logic.
