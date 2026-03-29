// Validates that a pull request title conforms to the Conventional Commits specification.
// See: https://www.conventionalcommits.org/
//
// Pattern: <type>[optional scope][optional !]: <description>
// - type      : feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
// - scope     : optional, enclosed in parentheses, e.g. (auth)
// - !         : optional, signals a breaking change
// - description: non-empty human-readable summary

'use strict';

const fs = require('fs');
const core = require('@actions/core');

const CONVENTIONAL_COMMITS_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

// ^(type)(optional scope)(optional !): (non-empty description)
const PATTERN = new RegExp(
  `^(${CONVENTIONAL_COMMITS_TYPES.join('|')})(\\([^)\\s]+\\))?(!)?: .+$`,
);

function loadPullRequest() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH environment variable is not set.');
  }
  const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  return payload.pull_request || null;
}

async function run() {
  try {
    const pr = loadPullRequest();

    if (!pr) {
      core.setFailed(
        'This action must be triggered by a pull_request event.',
      );
      return;
    }

    const title = pr.title;
    core.info(`PR title: "${title}"`);

    if (PATTERN.test(title)) {
      core.info('✅ PR title follows the Conventional Commits standard.');
      await core.summary
        .addHeading('PR Title Validation', 2)
        .addRaw('✅ **PASSED** — PR title follows the Conventional Commits standard.\n\n')
        .addTable([
          [{ data: 'Title', header: true }, { data: 'Status', header: true }],
          [title, '✅ Valid'],
        ])
        .write();
    } else {
      const typesDisplay = CONVENTIONAL_COMMITS_TYPES.join(', ');
      const message = [
        '❌ PR title does not follow the Conventional Commits standard.',
        '',
        `Title checked: "${title}"`,
        '',
        'Expected format: <type>[optional scope][optional !]: <description>',
        '',
        `Valid types: ${typesDisplay}`,
        '',
        'Examples:',
        '  feat: add new feature',
        '  fix(auth): resolve login issue',
        '  chore!: drop support for Node 16',
        '  feat(api)!: breaking API change',
      ].join('\n');

      await core.summary
        .addHeading('PR Title Validation', 2)
        .addRaw('❌ **FAILED** — PR title does not follow the Conventional Commits standard.\n\n')
        .addTable([
          [{ data: 'Title', header: true }, { data: 'Status', header: true }],
          [title, '❌ Invalid'],
        ])
        .addDetails(
          'Expected format',
          '<type>[optional scope][optional !]: <description>\n\nValid types: ' + typesDisplay,
        )
        .write();

      core.setFailed(message);
    }
  } catch (err) {
    core.setFailed(`Unexpected error: ${err.message}`);
  }
}

run();
