---
name: "PR Title Validator"
description: "Validates that pull request titles follow the Conventional Commits standard and comments with guidance if they do not"

on:
  workflow_call:

permissions:
  contents: read

engine:
  id: copilot
  env:
    GITHUB_COPILOT_BASE_URL: "https://api.githubcopilot.com"

tools:
  github:
    toolsets: [pull_requests]

safe-outputs:
  add-comment:
    max: 1
    target: triggering
---

# PR Title Validator

When a pull request is opened or updated, read its title.

Validate the title against the Conventional Commits specification (https://www.conventionalcommits.org/).

**Valid format**: `<type>[optional scope][optional !]: <description>`

**Valid types** (lowercase only): `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rules**:

- The type must be one of the valid types listed above and written in lowercase
- An optional scope may follow the type enclosed in parentheses, e.g. `(auth)`, and must not contain spaces
- An optional `!` immediately after the type or scope signals a breaking change
- A colon and a single space must separate the type/scope from the description
- The description must be non-empty

**Examples of valid titles**:

- `feat: add OAuth2 login`
- `fix(auth): resolve token expiry race condition`
- `chore!: drop Python 3.8 support`
- `feat(api)!: breaking change to endpoint schema`
- `docs: update README`
- `ci: pin GitHub Actions to SHA`

**Examples of invalid titles**:

- `Add new feature` (missing type prefix)
- `WIP: something` (WIP is not a valid type)
- `feat:no space after colon`
- `FEAT: uppercase type`
- `feat(): empty scope`

If the title is **valid**, do not comment — silently pass.

If the title is **invalid**, add exactly one comment to the PR that:

1.  States clearly that the PR title does not follow the Conventional Commits standard
2.  Shows the exact title that was checked
3.  Explains the expected format with the valid types listed
4.  Provides two or three concrete examples of valid titles
5.  Asks the author to update the PR title before merging
