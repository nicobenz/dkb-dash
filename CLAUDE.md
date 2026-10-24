# dkb-dash

## Git workflow and releases

These are standing instructions from the repository owner for every session, including cloud agents.

- Every change happens on its own feature branch cut from `develop` and lands in `develop` through a pull request. Opening that PR and squash-merging it once checks pass is part of finishing the task; you don't need to be asked separately.
- Never push to, open a PR into, or merge into `main`. A merge into `main` publishes a release. Only the owner starts one, by invoking `/promote` themselves.
- Commit messages and PR titles follow Conventional Commits. The squash commit on `develop` becomes a line in the public release notes, so write it for the people who run dkb-dash.

Before you commit, branch, open or merge a PR, load the `git-workflow` skill and follow it.
