# Migration - Parse Issue Form

Parse structured GitHub Issue forms for migration requests.

This action extracts field values from a GitHub Issue body based on a provided JSON mapping. It is specifically designed for handling migration requests where source/target repository details, team mappings, and other configuration options are provided via a standardized issue form.

## Usage

```yaml
steps:
  - name: Parse Migration Request
    id: parser
    uses: paloitmbb/mss-devops-workflow/actions/migration-parse-issue-form@main
    with:
      issue-body: ${{ github.event.issue.body }}

      # Map form labels to output keys
      field-mapping: |
        {
          "source_org": "Source Organization",
          "source_repo": "Source Repository",
          "target_org": "Target Organization",
          "target_repo": "Target Repository Name",
          "migration_options": "Migration Options",
          "justification": "Business Justification"
        }

      # Define field types
      textarea-fields: '["team_mappings", "justification"]'
      checkbox-fields: '["migration_options"]'

      # Default values
      fallback-values: '{"target_visibility": "private"}'

  - name: Use Parsed Data
    run: |
      echo "Migrating ${{ steps.parser.outputs.issueparser_source_repo }} to ${{ steps.parser.outputs.issueparser_target_repo }}"
      echo "Options: ${{ steps.parser.outputs.issueparser_migration_options }}"
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `issue-body` | The raw body text of the GitHub issue. | **Yes** | |
| `field-mapping` | JSON object mapping output keys to issue form labels. | **Yes** | |
| `textarea-fields` | JSON array of keys that should be parsed as multi-line text. | No | `[]` |
| `checkbox-fields` | JSON array of keys that should be parsed as checkboxes (comma-separated output). | No | `[]` |
| `fallback-values` | JSON object providing defaults for missing fields. | No | `{}` |

## Outputs

All outputs are prefixed with `issueparser_`.

| Output | Description |
| :--- | :--- |
| `issueparser_source_organization` | Parsed source organization. |
| `issueparser_source_repo` | Parsed source repository name. |
| `issueparser_target_organization` | Parsed target organization. |
| `issueparser_target_repo` | Parsed target repository name. |
| `issueparser_target_visibility` | Parsed target visibility. |
| `issueparser_migration_options` | Selected migration options (comma-separated). |
| `issueparser_admins` | Parsed admin users list. |
| `issueparser_team_mappings` | Parsed team mapping configuration. |
| `issueparser_justification` | Parsed business justification. |

> [!TIP]
> This action uses regex to parse the issue body, looking for `### Label Name` patterns. Ensure your issue template labels match the `field-mapping` exactly.
