---
name: desktop-app
description: |
  Desktop application development guide for Electron, Tauri, and native apps.
  Covers cross-platform desktop development for macOS, Windows, and Linux.
  Triggers: desktop app, Electron, Tauri, mac app, windows app, native app,
  데스크톱 앱, 일렉트론, 타우리, デスクトップアプリ, Electron,
  桌面应用, 桌面程序, aplicacion de escritorio, application bureau, Desktop-App
  Do NOT use for: mobile apps (use $mobile-app), web apps (use $dynamic or $starter).
---

# Desktop App Skill

> Cross-platform desktop development with Electron or Tauri.

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Initialize desktop project | `$desktop-app init my-app` |
| `guide` | Desktop dev guide | `$desktop-app guide` |
| `build` | Build configuration help | `$desktop-app build` |

## Framework Comparison

| Feature | Electron | Tauri |
|---------|----------|-------|
| Language | JS/TS (Node.js) | Rust + JS/TS |
| Bundle Size | ~100MB+ | ~5-10MB |
| Memory Usage | High | Low |
| Native APIs | Via Node.js | Via Rust |
| Web Tech | Chromium | System WebView |
| Maturity | Very mature | Growing rapidly |
| Best For | Feature-rich apps | Lightweight apps |

## Recommended: Tauri

For bkit-codex users, Tauri is recommended because:
- Smaller bundle size
- Lower memory footprint
- Better security model
- Uses system WebView (no Chromium bundled)
- Rust backend for performance-critical tasks

## Project Structure (Tauri)

```
desktop-app/
├── src/                       # Frontend (React/Next.js)
│   ├── app/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── src-tauri/                 # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── commands.rs       # IPC commands
│   │   └── lib.rs
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri configuration
│   └── icons/                # App icons
├── public/
├── package.json
└── tsconfig.json
```

## Core Patterns

### Tauri Commands (IPC)

```rust
// src-tauri/src/commands.rs
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}
```

```typescript
// Frontend: invoke Tauri commands
import { invoke } from '@tauri-apps/api/core';

async function readFile(path: string): Promise<string> {
  return invoke('read_file', { path });
}

async function saveFile(path: string, content: string): Promise<void> {
  return invoke('save_file', { path, content });
}
```

### Window Management

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();
await appWindow.minimize();
await appWindow.maximize();
await appWindow.setTitle('My App - Document.txt');
```

### System Tray

```rust
// src-tauri/src/main.rs
use tauri::{SystemTray, SystemTrayMenu, CustomMenuItem};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show"))
        .add_item(CustomMenuItem::new("quit", "Quit"));

    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .run(tauri::generate_context!())
        .expect("error running app");
}
```

### File Dialog

```typescript
import { open, save } from '@tauri-apps/plugin-dialog';

// Open file
const filePath = await open({
  filters: [{ name: 'Documents', extensions: ['txt', 'md', 'json'] }],
});

// Save file
const savePath = await save({
  filters: [{ name: 'Documents', extensions: ['txt'] }],
});
```

## Electron Alternative

```typescript
// main.ts (Electron)
import { app, BrowserWindow } from 'electron';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);
```

## Build & Distribution

### Tauri
```bash
# Development
npm run tauri dev

# Build
npm run tauri build

# Output: src-tauri/target/release/bundle/
# - macOS: .dmg, .app
# - Windows: .msi, .exe
# - Linux: .deb, .AppImage
```

### Code Signing
- macOS: Apple Developer ID certificate
- Windows: Code signing certificate (EV recommended)
- Linux: GPG signing

## Pipeline Integration

Desktop apps follow the 9-phase pipeline with desktop-specific considerations:
- Phase 3: Design for native OS look and feel
- Phase 5: Include OS-specific components (menu bar, tray, dialogs)
- Phase 6: Implement IPC between frontend and backend
- Phase 9: Code signing, auto-update, store submission

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Ignoring OS differences | Test on all target platforms |
| Large Electron bundles | Consider Tauri for smaller apps |
| No auto-updater | Implement from the start |
| Missing code signing | Users get security warnings without it |
| No offline support | Desktop apps should work offline |
