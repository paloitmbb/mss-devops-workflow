# Security - Generate SARIF Name

Standardize SARIF report filenames for consistent artifact management.

This utility action renames a SARIF file to a strictly defined format including environment, repository, scanner, branch, commit, and run ID. This ensures traceability and uniqueness when uploading multiple security reports.

## Format

The generated filename follows this pattern:
`{env}-{repo}-{scanner}-{branch}-{commit}-{runid}.sarif`

## Usage

```yaml
steps:
  - name: Rename Results
    uses: paloitmbb/mss-devops-workflow/actions/security-generate-sarifname@main
    with:
      scanner-name: 'tfsec'
      source-file: './tfsec-results.sarif'
      environment: 'production'
```

## Inputs

| Input | Description | Required |
| :--- | :--- | :--- |
| `scanner-name` | Name of the tool (e.g., `checkov`, `tfsec`, `trivy`). | **Yes** |
| `source-file` | Path to the original SARIF file. | **Yes** |
| `environment` | Target environment (e.g., `dev`, `stage`, `prod`). | **Yes** |

## Outputs

| Output | Description |
| :--- | :--- |
| `renamed-file` | The new filename (e.g., `prod-myrepo-tfsec-main-a1b2c3d-1234.sarif`). |
| `renamed-path` | The absolute path to the renamed file. |

## Features

-   **Branch Sanitization**: Replaces slashes `/` in branch names with hyphens `-` to ensure valid filenames.
-   **Context Awareness**: Detects correct commit SHA for Pull Requests (HEAD SHA) vs Pushes (Merge SHA).
-   **Error Handling**: Warns and exits gracefully if the source file does not exist.
