# Migration - Validation

Validate source and target repository conditions before starting a migration.

This action performs pre-flight checks to ensure a smooth migration process:
1.  Verifies the **source repository** exists and is accessible.
2.  Ensures the **source repository** is NOT archived (archived repos cannot be migrated directly).
3.  Verifies the **target organization** (or user) exists.
4.  Ensures the **target repository name** is available (not already taken).

## Usage

```yaml
steps:
  - name: Validate Request
    uses: paloitmbb/mss-devops-workflow/actions/migration-validation@main
    with:
      source-org: 'legacy-org'
      source-repo: 'old-app'
      source-token: ${{ secrets.SOURCE_PAT }}

      target-org: 'new-org'
      target-repo: 'new-app'
      target-token: ${{ secrets.TARGET_PAT }}

      issue-number: ${{ github.event.issue.number }}
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Required |
| :--- | :--- | :--- |
| `source-org` | Source organization name. | **Yes** |
| `source-repo` | Source repository name. | **Yes** |
| `source-token` | PAT with read access to the source. | **Yes** |
| `target-org` | Target organization (or user) name. | **Yes** |
| `target-repo` | Target repository name. | **Yes** |
| `target-token` | PAT with access to the target org. | **Yes** |
| `issue-number` | Issue number to post error comments on. | **Yes** |
| `github-token` | Token for commenting on the issue. | **Yes** |

## Validation Logic

-   **Source Check**: Calls GitHub API to check existence and `archived` status.Fails if 404 or `archived: true`.
-   **Target Org Check**: Checks availability of the destination organization.
-   **Target Repo Check**: Checks if a repo with the target name already exists. Fails if 200 OK (repo exists), Passes if 404 (repo available).

> [!IMPORTANT]
> The `source-token` and `target-token` must have appropriate scopes (`repo` read/write) for their respective platforms/organizations.
