# GitHub - Load Defaults

Load organizational defaults from a YAML configuration file and make them available as JSON.

This action reads a `defaults.yaml` file (commonly used for repository governance or global settings), converts it to JSON, and exports the values. It ensures that downstream steps can easily consume these configurations without complex parsing logic.

## Usage

```yaml
steps:
  - name: Load Repository Defaults
    id: defaults
    uses: paloitmbb/mss-devops-workflow/actions/github-load-defaults@main
    with:
      defaults-file: './config/defaults.yaml'

  - name: Use Defaults
    run: |
      echo "Visibility: ${{ steps.defaults.outputs.visibility }}"
      echo "JSON Context: ${{ steps.defaults.outputs.defaults }}"
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `defaults-file` | Path to the YAML file containing defaults. | No | `data/defaults.yaml` |
| `yq-download-url` | Custom URL to download `yq` if needed. | No | Latest release |

## Outputs

| Output | Description |
| :--- | :--- |
| `defaults` | The complete `repository_defaults` block as a JSON string. |
| `visibility` | The default repository visibility setting. |
| `has-issues` | The default `has_issues` boolean setting. |
| `has-projects` | The default `has_projects` boolean setting. |
| `has-wiki` | The default `has_wiki` boolean setting. |

## Dependencies

This action automatically installs [yq](https://github.com/mikefarah/yq) if it is not already present in the runner environment to perform the YAML-to-JSON conversion.
