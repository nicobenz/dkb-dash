# dkb-dash

## Git workflow and releases

These are standing instructions from the repository owner for every session, including cloud agents.

- Every change happens on its own feature branch cut from `develop`.
- Open a pull request into `develop` as a draft after the first push, and mark it ready for review when the work is complete. This is part of every task; you don't need to be asked. Never merge a PR yourself: the owner squash-merges every PR in the GitHub UI.
- The PR title and description become the squash commit, and the title becomes a line in the public release notes. Format the title as `<type>: <emoji> <short past-tense description>`, for example `feat: 🪵 improved logging`, with no scope.
- Don't add a "Generated with Claude Code" line, session link or any other attribution to PR descriptions. The description becomes the squash commit body and feeds the release notes. Attribution trailers in individual commits are fine.
- Design artifacts (impeccable briefs, critiques, audits, `DESIGN.md` updates, `.impeccable/`) stay on the feature branch and ship in the same PR as the implementation they lead to. A PR that holds only design artifacts stays a draft.
- Never push to `main`, open a PR into it, or create tags. A merge into `main` publishes a release. Only the owner starts one, by invoking `/promote` themselves.

Before you commit, branch or open a PR, load the `git-workflow` skill and follow it.
