# Vim 窗口与 Explorer 导航

补充侧栏可见性捕获、显式 Explorer 开关、拒绝替换未保存标签的文件打开命令，以及代码区与右侧 Codex 的焦点切换。

键位位于 config/。Ctrl+H/J/K/L、组内 Tab、Leader n/q、快速分屏及 Codex 次级侧栏规则由统一配置合并。

## 安装

这是独立 Git 仓库，可单独上传 GitHub。构建仅依赖 Bash、Python 3 标准库；逻辑模块使用 Node 18+。安装位置为实际运行 VS Code 窗口的 UI 端，当前部署目标为 Windows Code 1.145.2 + WSL Ubuntu 26.04。

```sh
bash package.sh
code --install-extension dist/local.vim-navigation-0.1.1.vsix --force
```

Windows 上建议用 Windows Code CLI 安装。WSL 的 `code` 默认可能转交远程端，不要据此误判 UI 扩展安装位置。`package.json` 声明 `extensionKind: ["ui"]`。

`config/settings.json` 和 `config/keybindings.json` 是本功能配置片段，必须按键/映射合并，不能整份覆盖已有配置。完整键位与保留 JSONC 注释的合并、备份、回滚工具见同级独立仓库 `vscode-custom-keybindings`。安装后由用户在合适时机 Reload Window；本脚本不会重启编辑器。

## Codex 输入框往返

- 编辑器 Normal/Visual 系列按 Ctrl+L：优先聚焦右侧已有编辑器组；到右边界后调用已显示 Codex 的 view focus，进入输入框。
- 右侧 Codex 内按 Ctrl+H：返回最近活动的代码编辑器组，保留 Vim 模式、光标和选区。鼠标直接点入 Codex 后也适用。
- Codex 内 Ctrl+J/K/L 消费边界按键，保持草稿；不会发送问题。隐藏的 Codex 不会被 Ctrl+L 打开。

Code 1.145.2 的 sidebar Webview 获焦时，`focusedView`、`auxiliaryBarFocus` 会被清空；`webviewId` 仅用于右键菜单，不能用来判断键盘焦点。`patch-code.js` 在用户运行副本中将 Code 自身的 active webview 事件转换为 `vimNavigation.focusedWebview`，焦点离开时清空。该规则限定 `chatgpt.sidebarSecondaryView`，不依赖 Codex 草稿、会话或网络接口，也不修改官方 Codex 扩展。

完整往返需要实际承载窗口的 Code 安装包含焦点桥。已有安装可执行以下命令增量安装，参数必须是该安装的 `resources/app` 实际目录；修改前成对备份 workbench 与 product.json：

```sh
node patch-code.js "<实际 Code 安装的 resources/app>"
```

首次构建可使用同级 `editor-ime-mode/build-vscode.sh`，它会一并应用本补丁。脚本仅支持 Code 1.145.2 / `c4453f8ea430795f941c1b2ff6c9321135a74a02`，校验工作台散列及结构后更新校验和，重复运行幂等。通常保留系统安装不变，使用用户运行副本。

当前 WSL `~/.local/bin/code` 指向用户运行副本，但 VS Code 会把打开请求转交给已有主进程。最近一次 WSL 窗口的日志显示主进程来自系统安装，该安装此前没有焦点桥，导致 Ctrl+L 可进入 Codex、Ctrl+H 无法返回。

此次按用户修复本机的要求，将相同焦点桥补到 Windows 系统版 Code 1.145.2；用户副本原有补丁保留。两份工作台的焦点函数和各自 product.json 校验和均已核对。系统版原文件及散列在 `backups/2026-11-18T02-18-39Z-system-focus/`，未修改 Codex 扩展或登录数据。当前键位无需更改；已打开的窗口需执行 Developer: Reload Window，重新加载工作台。此焦点修复不再要求先退出系统版再选择特定入口。Code 升级会替换安装文件，需要检查新版本兼容性并重新适配。

用户运行副本入口仍是 `%LOCALAPPDATA%\editor-tools\code-ime.cmd`。仅当需要切换到其中的其他运行时补丁时，才需要保存文件、退出所有 Code 窗口后从该入口启动。

## 测试

```sh
node --test test/*.test.js
```

联合回归：`cd ../vscode-custom-keybindings && bash test/run-integration.sh`。测试创建独立 Xvnc、用户配置、扩展目录和工作区；不使用登录态，不向日常桌面发送按键。Linux Code 测试运行副本与 VSCodeVim 1.32.4 的位置可通过 `EDITOR_TOOLS_TEST_CODE` / `EDITOR_TOOLS_TEST_VIM` 指定。

2026-11-16 的联合结果：SV、Visual、分屏搜索、颜色标记次数/固定坐标、marker 一次撤销、Enter、快速分屏、Leader 共存、局部编辑区/终端限制均通过 Linux Code 1.145.2 集成检查。**这不等于 Windows 拼音和真实 Codex 提交已验收。** 原始结果在联合仓库的 `test-results/`，该目录不加入 Git。

本次修复后 6 项导航/补丁逻辑测试与 21 项联合 GUI 检查通过。新增真实 Webview 测试夹具与官方 Codex 26.1111.21308 使用相同的 secondary view ID 和窗口获焦后聚焦 composer 的逻辑，检查实际 X11 按键、鼠标点入、Normal/Visual 往返、草稿保持、隐藏侧栏、Quick Input 排除。夹具只装进临时扩展目录。官方扩展在无凭据隔离实例中可打开登录页，但没有输入框，故不宣称已验证登录后的官方 Codex 输入框或 Windows 实际桌面。

此次本机复现使用同版本隔离运行时，仅移除焦点桥：Ctrl+L 进入输入框通过，Ctrl+H 的键盘进入/鼠标点入两项失败。补回同一焦点桥后，6 项焦点 GUI 检查及 6 项导航/补丁逻辑测试全部通过。前后结果与实际 Windows 文件校验记录在同级 `vscode-custom-keybindings/test-results/focus-before-integration.json`、`integration.json`、`focus-windows-runtime.json`。这些 GUI 检查仍使用独立桌面的 Linux Code 与 Webview 夹具，未操作用户的 Windows 焦点或真实 Codex 草稿。

## 停用与卸载

```sh
code --uninstall-extension local.vim-navigation
```

在统一键位仓库执行受保护回滚，或仅删本仓库 config 中对应的键/映射。若安装后用户继续编辑了配置，回滚器拒绝覆盖后续修改，应根据备份合并恢复。

VSIX 卸载不修改 Code 安装文件。只停用 H/L 时移除相关键位即可；需撤掉焦点桥时，针对实际修改的系统版或用户副本恢复其成对备份的 workbench/product.json，先核对当前散列仍与备份清单的安装后散列一致，避免覆盖后续更新。用户副本也可不带导航补丁重新构建。

## 兼容范围和限制

登录后的官方 Codex 输入框、全部 Remote WSL view 上下文及 Explorer 的固定标签边缘情况仍需目标 Windows 端验收。方向导航使用当前 Code 原生命令，只访问可见区域。焦点桥依赖指定 Code 构建，升级 Code 后必须重新适配；旧版 primary sidebar 不在当前键位配置范围。

备份、测试日志、运行副本、VSIX、编译产物不纳入 Git。没有复制浏览器/Codex 凭据。源码按 MIT 许可提供。
