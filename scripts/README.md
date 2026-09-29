# Profile visuals

Run from the repository root with Node.js 22 or newer:

```sh
node --test scripts/profile-visuals.test.mjs
node scripts/profile-visuals.mjs
```

The renderer writes `assets/toolkit.svg` and `assets/activity.svg`.
`PROFILE_USER` defaults to `Z3NMA`; Actions uses the repository owner.
`PROFILE_DATE` optionally sets the final UTC date (`YYYY-MM-DD`); the source HTML must contain all 365 requested days. The live endpoint returns the current rolling year.
For offline verification, set `CONTRIBUTIONS_HTML` to a saved GitHub contributions response.

Activity uses 365 consecutive days from GitHub's public contributions calendar.
Weekly node height is linear in contribution count; radius reflects active days.
The first and last calendar weeks may be partial. The moving highlight is decorative.
These are GitHub contributions, not just commits. Private details are not requested.

The workflow runs daily at 00:00 UTC, on renderer/workflow changes to main/master,
and manually. It uses the automatic GITHUB_TOKEN to commit assets on the current
branch. No personal token is required. A fetch or calendar parsing failure stops
the job before rendering, leaving the previous assets in place. GitHub calendar
HTML can change; parser failures should be investigated rather than replaced with
empty or sample data. Image caches may delay daily changes briefly.

Toolkit entries live in `renderToolkit`. Banner animations are independent and
remain in `assets/profile-banner.svg`. The old snake workflow is replaced; no
output-branch asset is referenced by the README.
