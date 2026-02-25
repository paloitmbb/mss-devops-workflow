# GitHub - Validate Repository Request

Validate repository requests against naming conventions, checking for duplication and team existence.

This action acts as a gatekeeper for repository creation workflows. It ensures that requested names follow the organization's standards, that the repository doesn't already exist, and that any assigned teams are valid.


## Usage

```yaml
steps:
  - name: Validate Request
    id: validate
    uses: paloitmbb/mss-devops-workflow/actions/github-validate-request@main
    with:
      github-token: ${{ secrets.ORG_READ_TOKEN }}
      organization: 'my-org'
      repository-name: 'new-service'
      teams: 'team-alpha,team-beta'
      name-pattern: '^[a-z0-9-]+$' # Optional custom regex
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `repository-name` | The proposed name for the repository. | **Yes** | |
| `organization` | The GitHub organization name. | **Yes** | |
| `github-token` | Token with `read:org` scope. | **Yes** | |
| `teams` | Comma-separated list of team slugs to validate. | No | `''` |
| `name-pattern` | Regex pattern for name validation. | No | `^[a-z0-9-]+$` |

## Naming Rules

By default, the action uses the regex pattern `^[a-z0-9-]+$` to enforce strict kebab-case naming.

**Accepted Examples:**
- `my-service`
- `web-app-v2`
- `data-pipeline-2024`

**Rejected Examples:**
- `MyService` (contains uppercase)
- `my_service` (contains underscore)
- `service/api` (contains slash)

## Outputs

| Output | Description |
| :--- | :--- |
| `validation-passed` | Overall result (`true` if all checks pass). |
| `name-valid` | Result of name format check (`true`/`false`). |
| `name-error` | Error message if name is invalid. |
| `teams-valid` | Result of team existence check (`true`/`false`). |
| `teams-error` | Error message if teams are missing. |
| `repository-exists` | `true` if the repository name is already taken. |
| `validation-summary` | A Markdown table summarizing all results. |

> [!IMPORTANT]
> The `github-token` must have `read:org` permissions to list teams and verify their existence within the organization.
