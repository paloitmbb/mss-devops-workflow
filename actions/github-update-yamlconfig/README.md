# GitHub - Update YAML Config

Generate and append a repository configuration entry to a YAML file.

This action automates the process of adding new repositories to a central configuration file (`repositories.yaml`). It merges organizational defaults with specific repository details to ensure consistency and compliance.

## Usage

```yaml
steps:
  - name: Update Repository Config
    uses: paloitmbb/mss-devops-workflow/actions/github-update-yamlconfig@main
    with:
      config-file: 'data/repositories.yaml'
      defaults-file: 'data/defaults.yaml'
      repository-name: 'new-service-api'
      tech-stack: 'typescript'
      teams: '["backend-team", "sre-team"]'
      team-permission: 'push'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `config-file` | Path to the target YAML configuration file. | **Yes** | |
| `defaults-file` | Path to the defaults YAML file. | **Yes** | |
| `repository-name` | Name of the repository to add. | **Yes** | |
| `tech-stack` | Technology stack (used for topic generation). | **Yes** | |
| `teams` | JSON array of team slugs to grant access. | No | `[]` |
| `team-permission` | Permission level for teams (`push`, `admin`, etc.). | No | `push` |
| `default-branch` | Default branch name. | No | `main` |
| `additional-topics` | Comma-separated list of extra GitHub topics. | No | `''` |

## Outputs

| Output | Description |
| :--- | :--- |
| `yaml-updated` | Boolean indicating success (`true` or `false`). |
| `entry-preview` | The generated YAML block that was appended. |
| `repository-description` | The auto-generated description for the repository. |

## Mechanics

This action uses `yq` to read defaults and `bash` string features to construct the new YAML entry. It ensures that the output format is byte-for-byte identical to expectations, preventing "drift" when consumed by Terraform or other IaC tools.
