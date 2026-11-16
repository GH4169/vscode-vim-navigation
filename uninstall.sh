#!/usr/bin/env bash
set -euo pipefail
code --uninstall-extension local.vim-navigation
printf 'Remove only this feature’s config entries; preserve unrelated user settings.\n'
