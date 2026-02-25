# GitHub - Create Pull Request

Create a branch, commit configuration changes, and open a Pull Request automatically.

This action is designed for GitOps workflows where configuration files are modified programmatically (e.g. by other actions or scripts) and need to be reviewed via a PR.

## Usage

```yaml
steps:
  - name: Create Configuration PR
    uses: paloitmbb/mss-devops-workflow/actions/github-create-pullrequest@main
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}

      # Branch Configuration
      branch-prefix: 'config-update'
      branch-suffix: 'new-service'
      base-branch: 'main'

      # Commit Details
      file-paths: 'config/services.yaml data/values.json'
      commit-title: 'feat: add new service configuration'

      # PR Details
      pr-title: 'feat: Add New Service Configuration'
      pr-body: 'Automated PR to register the new service in the registry.'
      pr-labels: 'automated,configuration'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `branch-prefix` | Prefix for the new branch. | **Yes** | |
| `branch-suffix` | Suffix for the new branch (e.g., entity name). | **Yes** | |
| `file-paths` | Space-separated list of files to stage and commit. | **Yes** | |
| `commit-title` | The commit message subject line. | **Yes** | |
| `pr-title` | The title of the Pull Request. | **Yes** | |
| `pr-body` | The description/body of the Pull Request. | **Yes** | |
| `github-token` | Token for creating the PR. | No | `GITHUB_TOKEN` |
| `pr-labels` | Comma-separated list of labels to add. | No | `''` |
| `linked-issue` | Issue number to close (adds `Closes #N`). | No | `''` |
| `base-branch` | Target branch for the PR. | No | `main` |
| `commit-body` | Extended commit description. | No | `''` |
| `git-user-name` | Name for the git commit author. | No | `github-actions[bot]` |
| `git-user-email` | Email for the git commit author. | No | `github-actions[bot]...` |

## Outputs

| Output | Description |
| :--- | :--- |
| `branch-name` | The full name of the created branch. |
| `pr-number` | The number of the created Pull Request. |
| `pr-url` | The HTML URL of the created Pull Request. |

> [!WARNING]
> Requires `contents: write` and `pull-requests: write` permissions.
