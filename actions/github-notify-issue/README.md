# GitHub - Notify Issue

Post structured status comments on GitHub Issues, manage labels, and optionally close issues.

This action provides a standardized way to communicate workflow status back to the user via Issue comments. It supports rich formatting with summary tables, detail sections, and specific status types (success, failure, validation passed/failed).

## Usage

```yaml
steps:
  - name: Notify User
    uses: paloitmbb/mss-devops-workflow/actions/github-notify-issue@main
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      issue-number: ${{ github.event.issue.number }}
      status: 'validation-passed'
      title: '✅ Request Validated'

      # Structured Data
      summary-table: |
        [
          {"field": "Repository Name", "value": "my-service"},
          {"field": "Environment", "value": "production"}
        ]

      # Additional Details
      next-steps: |
        - Review the generated plan
        - Approve the Pull Request

      # Label Management
      labels-add: 'validated,ready-for-review'
      labels-remove: 'triage-needed'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `issue-number` | The issue number to comment on. | **Yes** | |
| `status` | Status type: `success`, `failure`, `validation-passed`, `validation-failed`, `in-progress`. | **Yes** | |
| `title` | Custom title for the comment (overrides default status title). | No | `''` |
| `summary-table` | JSON array of field/value objects: `[{"field": "...", "value": "..."}]`. | No | `[]` |
| `details-sections` | JSON array of sections: `[{"heading": "...", "body": "..."}]`. | No | `[]` |
| `next-steps` | Markdown list of next steps (for success states). | No | `''` |
| `error-details` | Markdown error description (for failure states). | No | `''` |
| `labels-add` | Comma-separated labels to add. | No | `''` |
| `labels-remove` | Comma-separated labels to remove. | No | `''` |
| `close-issue` | Set to `true` to close the issue. | No | `false` |
| `close-reason` | Reason for closing: `completed` or `not_planned`. | No | `completed` |
| `write-summary` | Write comment to `$GITHUB_STEP_SUMMARY`. | No | `true` |
| `github-token` | GitHub token for API operations. | No | `GITHUB_TOKEN` |

## Outputs

| Output | Description |
| :--- | :--- |
| `comment-id` | The ID of the created comment. |
| `comment-url` | The URL of the created comment. |

> [!NOTE]
> Requires `issues: write` permission to post comments and manage labels.
