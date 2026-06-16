# Hearth

Personal Windows customization hub — built with [Tauri v2](https://tauri.app) + vanilla JS.

Your one-stop dashboard for downloading, tracking, and managing your Windows ricing tools.

![palette: #AAFFC7 / #67C090 / #215B63 / #124170]

## Apps included

| App | Category |
|---|---|
| GlazeWM | Window Manager |
| YASB | Status Bar |
| TranslucentTB | Taskbar |
| MSI Afterburner | Hardware |
| RivaTuner RTSS | Hardware |

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Rust](https://rustup.rs) (stable)
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) — on Windows: Microsoft C++ Build Tools + WebView2

## Dev

```bash
npm install
npm run tauri dev
```

## Build (produces `.exe` installer + portable)

```bash
npm run tauri build
```

Output goes to `src-tauri/target/release/bundle/`.

## Add more apps

Open `src/main.js` and add an entry to the `APPS` array:

```js
{
  id: "myapp",
  name: "App Name",
  cat: "wm",           // wm | bar | taskbar | hw
  icon: "ti-apps",     // any Tabler icon name
  iconClass: "icon-wm",
  tagClass: "tag-wm",
  tagLabel: "Window Mgmt",
  desc: "Short description.",
  dl: "https://download-link.com",
  src: "https://github.com/...",
},
```

## Add a new category

Add it to the `CATS` object in `src/main.js` and add matching CSS classes in `src/style.css`.
