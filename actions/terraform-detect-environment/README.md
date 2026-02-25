# Terraform - Detect Environment

Intelligently detect the target environment (`dev`, `stage`, `prod`) and the corresponding working directory based on changed files or manual input.

This action is crucial for monorepo setups or multi-environment repositories, ensuring that Terraform commands run in the correct context.

## Usage

```yaml
steps:
  - name: Detect Environment
    id: detect
    uses: paloitmbb/mss-devops-workflow/actions/terraform-detect-environment@main
    with:
      manual-environment: ${{ github.event.inputs.environment }} # Optional: from workflow_dispatch
      working-directory-prefix: './env'

  - name: Use Detected Env
    if: steps.detect.outputs.environment != ''
    run: |
      echo "Target Environment: ${{ steps.detect.outputs.environment }}"
      echo "Working Directory: ${{ steps.detect.outputs.working-directory }}"
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `manual-environment` | Override detection logic (useful for `workflow_dispatch`). | No | `''` |
| `working-directory-prefix` | Prefix path where environment folders are located. | No | `./env` |
| `base-ref` | Base branch for git diff comparison. | No | `main` |
| `fallback-environment` | Default environment if no changes are detected. | No | `dev` |

## Outputs

| Output | Description |
| :--- | :--- |
| `environment` | The detected environment name (`dev`, `stage`, `prod`). |
| `working-directory` | Full path to the working directory (e.g., `./env/dev`). |
| `changed-paths` | List of changed file paths. |
| `detection-method` | How the environment was determined (`manual`, `path-based`, `fallback`). |
| `is-multi-env` | `true` if changes affect multiple environments (dangerous). |

## Logic

1.  **Manual Input**: If `manual-environment` is provided, it takes precedence.
2.  **Path Detection**: Analyzes changed files (git diff) to see if they reside in `env/dev`, `env/stage`, etc.
3.  **Fallback**: If no relevant changes are found, uses `fallback-environment`.
4.  **Verification**: Checks if the target `working-directory` actually exists.
