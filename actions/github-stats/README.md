# GitHub - Repository Stats

Gather comprehensive statistics and configuration details for a GitHub repository.

This action queries the GitHub API to retrieve a wide range of data about a repository, including branch counts, protection rules, security features, and activity metrics. It is useful for auditing, reporting, or conditional logic in workflows.

## Usage

```yaml
steps:
  - name: Get Repo Stats
    id: stats
    uses: paloitmbb/mss-devops-workflow/actions/github-stats@main
    with:
      repository: 'my-org/my-repo'
      token: ${{ secrets.PAT_WITH_READ_ACCESS }}

  - name: Check Status
    run: |
      echo "Issues: ${{ steps.stats.outputs.issue_count }}"
      echo "PRs: ${{ steps.stats.outputs.pr_count }}"
      echo "Scanning Enabled: ${{ steps.stats.outputs.code_scanning_enabled }}"
```

## Inputs

| Input | Description | Required |
| :--- | :--- | :--- |
| `repository` | The full repository name (e.g., `owner/repo`). | **Yes** |
| `token` | A GitHub Personal Access Token (PAT) with read access. | **Yes** |

## Outputs

Values are returned as step outputs. Key outputs include:

| Output | Description |
| :--- | :--- |
| `repo_name` | Full repository name. |
| `is_archived` | Boolean indicating if the repo is archived. |
| `repo_size` | Human-readable size strings. |
| `default_branch` | Name of the default branch. |
| `branches` | Total number of branches. |
| `pr_count` | Total number of Pull Requests. |
| `issue_count` | Total number of Issues. |
| `code_scanning_enabled` | Boolean status of code scanning. |
| `secret_scanning_enabled` | Boolean status of secret scanning. |
| `last_push` | Timestamp of the last push. |
| `variables_list` | List of repository variables. |
| `secrets_list` | List of repository secret names (not values). |

> [!WARNING]
> This action performs multiple API calls. Ensure your token has sufficient rate limit capacity for frequent usage.
