#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
bash package.sh
code --install-extension "dist/local.vim-navigation-0.1.1.vsix" --force
printf 'Merge config on the Code UI host. Codex H/L also needs the user runtime focus patch; see README.md before restarting Code.\n'
