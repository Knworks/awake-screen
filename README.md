# AwakeScreen

AwakeScreen is a lightweight VS Code Desktop extension that temporarily prevents display sleep and idle sleep while you explicitly keep it enabled.

## Quick start

1. Open VS Code Desktop.
2. Enable Keep Awake from the status bar or run `Keep Awake: Toggle` from the Command Palette.
3. Wait until the status bar indicates that Keep Awake is active.
4. Disable it from the status bar or run `Keep Awake: Disable` when you no longer need sleep prevention.

## Features

- One-click sleep prevention from the VS Code status bar
- Three commands for toggle, explicit enable, and explicit disable flows
- OS-specific sleep prevention on Windows, macOS, and Linux without permanently changing power settings
- Warning state with retry when sleep prevention could not start

## Commands

- `Keep Awake: Toggle`
- `Keep Awake: Enable`
- `Keep Awake: Disable`

## Status bar states

The status bar always shows the Keep Awake status in one of four ways:

- Off, when sleep prevention is disabled
- Starting, while activation is in progress
- Active, while sleep prevention is running
- Warning, when startup failed and a retry is available

## Supported environments

- Windows: uses a hidden PowerShell helper that periodically calls `SetThreadExecutionState`
- macOS: uses `caffeinate -d -i`
- Linux: uses `systemd-inhibit --what=idle:sleep`
- VS Code for Web, github.dev, and vscode.dev are out of scope
- Remote SSH, WSL, and Dev Containers are supported only through the local VS Code UI side

## Limitations

This extension does not prevent manual sleep, screen lock, lid close, power button actions, or organization-enforced power policies. It does not change OS power settings permanently, requires no administrator privileges, and does not rely on a separate Node.js installation on the user machine.

If the required OS command or API path is unavailable, Keep Awake moves to the warning state and shows an error notification. On Linux, environments without `systemd-inhibit` are not supported.

## License

MIT
