# Guidelines for Contributors

This repository contains various Raycast scripts written in Python, Node.js, and
Bash. Follow these conventions when updating or adding files:

- **Python**: target Python 3.13 or newer. Keep scripts self-contained and add
  usage comments at the top.
- **Node.js / TypeScript**: use Yarn as the package manager. TypeScript projects
  should compile via `yarn build`. Node scripts must specify `type: "module"` in
  `package.json`.
- **Shell scripts**: begin with `#!/usr/bin/env bash` and prefer POSIX sh
  compatibility where possible.
- Document any new scripts or significant behavior changes in `README.md`.
- There is no automated test suite at the moment, so verify scripts manually
  when possible. Many scripts depend on external data or network access that is
  not available in the agent's environment, so complete verification may not be
  possible.
