# GitHub - Parse Issue Form

Parse structured GitHub Issue forms into typed outputs using generalized field extraction.

This action converts the body of a GitHub Issue (created from a YAML form template) into useable outputs for your workflow. It handles field mapping, fallback values, and cleaning up user input (e.g., removing "_No response_").

## Usage

```yaml
steps:
  - name: Parse Issue Body
    id: parse
    uses: paloitmbb/mss-devops-workflow/actions/github-parse-issueform@main
    with:
      issue-body: ${{ github.event.issue.body }}

      # Map form labels to output keys
      field-mapping: |
        {
          "repo-name": "Repository Name",
          "tech-stack": "Tech Stack",
          "teams": "Owner Teams"
        }

      # Default values for empty fields
      fallback-values: |
        {
          "default-branch": "main"
        }

  - name: Use Parsed Data
    run: |
      echo "Repo: ${{ steps.parse.outputs.repo-name }}"
      echo "Stack: ${{ steps.parse.outputs.tech-stack }}"
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `issue-body` | The raw body text of the GitHub issue. | **Yes** | |
| `field-mapping` | JSON object mapping output keys to form field labels. | **Yes** | |
| `fallback-values` | JSON object providing defaults for missing fields. | No | `{}` |

## Outputs

| Output | Description |
| :--- | :--- |
| `parsed-fields` | A JSON object containing all extracted fields. |
| `repo-name` | Extracted value for key `repo-name`. |
| `tech-stack` | Extracted value for key `tech-stack`. |
| `tech-stack-other` | Extracted value for key `tech-stack-other`. |
| `justification` | Extracted value for key `justification`. |
| `teams` | Extracted value for key `teams`. |
| `default-branch` | Extracted value for key `default-branch`. |

> [!TIP]
> The action uses regex to find content between `### Field Name` headers. It robustly handles multi-line input and Windows line endings.
