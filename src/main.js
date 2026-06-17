import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

// ── EMBEDDED CONFIGS ─────────────────────────────────────────────────────────

const GLAZEWM_CONFIG = String.raw`general:
  startup_commands: []
  shutdown_commands: []
  config_reload_commands: []
  focus_follows_cursor: false
  toggle_workspace_on_refocus: false
  cursor_jump:
    enabled: true
    trigger: 'monitor_focus'
  hide_method: 'cloak'
  show_all_in_taskbar: false

gaps:
  scale_with_dpi: true
  inner_gap: '5px'
  outer_gap:
    top: '6px'
    right: '6px'
    bottom: '6px'
    left: '6px'

window_effects:
  focused_window:
    border:
      enabled: true
      color: '#8dbcff'
    hide_title_bar:
      enabled: false
    corner_style:
      enabled: false
      style: 'square'
    transparency:
      enabled: false
      opacity: '95%'
  other_windows:
    border:
      enabled: true
      color: '#a1a1a1'
    hide_title_bar:
      enabled: false
    corner_style:
      enabled: false
      style: 'square'
    transparency:
      enabled: false
      opacity: '0%'

window_behavior:
  initial_state: 'floating'
  state_defaults:
    floating:
      centered: true
      shown_on_top: false
    fullscreen:
      maximized: false
      shown_on_top: false

workspaces:
  - name: '1'
  - name: '2'
  - name: '3'
  - name: '4'
  - name: '5'
  - name: '6'
  - name: '7'
  - name: '8'
  - name: '9'

window_rules:
  - commands: ['ignore']
    match:
      - window_process: { equals: 'zebar' }
      - window_title: { regex: '[Pp]icture.in.[Pp]icture' }
        window_class: { regex: 'Chrome_WidgetWin_1|MozillaDialogClass' }
      - window_process: { equals: 'PowerToys' }
        window_class: { regex: 'HwndWrapper\[PowerToys\.PowerAccent.*?\]' }
      - window_process: { equals: 'PowerToys' }
        window_title: { regex: '.*? - Peek' }
      - window_process: { equals: 'Lively' }
        window_class: { regex: 'HwndWrapper' }
      - window_process: { equals: 'EXCEL' }
        window_class: { not_regex: 'XLMAIN' }
      - window_process: { equals: 'WINWORD' }
        window_class: { not_regex: 'OpusApp' }
      - window_process: { equals: 'POWERPNT' }
        window_class: { not_regex: 'PPTFrameClass' }
  - commands: ['ignore']
    match:
      - window_process: { equals: 'Sucrose' }
  - commands: ['set-fullscreen']
    match:
      - window_process: { equals: 'Discord' }
      - window_process: { equals: 'opera' }
      - window_process: { equals: 'Code' }

binding_modes:
  - name: 'resize'
    keybindings:
      - commands: ['resize --width -2%']
        bindings: ['h', 'left']
      - commands: ['resize --width +2%']
        bindings: ['l', 'right']
      - commands: ['resize --height +2%']
        bindings: ['k', 'up']
      - commands: ['resize --height -2%']
        bindings: ['j', 'down']
      - commands: ['wm-disable-binding-mode --name resize']
        bindings: ['escape', 'enter']

keybindings:
  - commands: ['focus --direction left']
    bindings: ['alt+h', 'alt+left']
  - commands: ['focus --direction right']
    bindings: ['alt+l', 'alt+right']
  - commands: ['focus --direction up']
    bindings: ['alt+k', 'alt+up']
  - commands: ['focus --direction down']
    bindings: ['alt+j', 'alt+down']
  - commands: ['move --direction left']
    bindings: ['alt+shift+h', 'alt+shift+left']
  - commands: ['move --direction right']
    bindings: ['alt+shift+l', 'alt+shift+right']
  - commands: ['move --direction up']
    bindings: ['alt+shift+k', 'alt+shift+up']
  - commands: ['move --direction down']
    bindings: ['alt+shift+j', 'alt+shift+down']
  - commands: ['resize --width -2%']
    bindings: ['alt+u']
  - commands: ['resize --width +2%']
    bindings: ['alt+p']
  - commands: ['resize --height +2%']
    bindings: ['alt+o']
  - commands: ['resize --height -2%']
    bindings: ['alt+i']
  - commands: ['wm-enable-binding-mode --name resize']
    bindings: ['alt+r']
  - commands: ['wm-toggle-pause']
    bindings: ['alt+shift+p']
  - commands: ['toggle-tiling-direction']
    bindings: ['alt+v']
  - commands: ['toggle-floating --centered']
    bindings: ['alt+shift+space']
  - commands: ['toggle-tiling']
    bindings: ['alt+t']
  - commands: ['toggle-fullscreen']
    bindings: ['alt+f']
  - commands: ['toggle-minimized']
    bindings: ['alt+m']
  - commands: ['close']
    bindings: ['alt+shift+q']
  - commands: ['wm-exit']
    bindings: ['alt+shift+e']
  - commands: ['wm-reload-config']
    bindings: ['alt+shift+r']
  - commands: ['wm-redraw']
    bindings: ['alt+shift+w']
  - commands: ['shell-exec cmd']
    bindings: ['alt+enter']
  - commands: ['focus --next-active-workspace']
    bindings: ['alt+s']
  - commands: ['focus --prev-active-workspace']
    bindings: ['alt+a']
  - commands: ['focus --recent-workspace']
    bindings: ['alt+d']
  - commands: ['focus --workspace 1']
    bindings: ['alt+1']
  - commands: ['focus --workspace 2']
    bindings: ['alt+2']
  - commands: ['focus --workspace 3']
    bindings: ['alt+3']
  - commands: ['focus --workspace 4']
    bindings: ['alt+4']
  - commands: ['focus --workspace 5']
    bindings: ['alt+5']
  - commands: ['focus --workspace 6']
    bindings: ['alt+6']
  - commands: ['focus --workspace 7']
    bindings: ['alt+7']
  - commands: ['focus --workspace 8']
    bindings: ['alt+8']
  - commands: ['focus --workspace 9']
    bindings: ['alt+9']
  - commands: ['move-workspace --direction left']
    bindings: ['alt+shift+a']
  - commands: ['move-workspace --direction right']
    bindings: ['alt+shift+f']
  - commands: ['move-workspace --direction up']
    bindings: ['alt+shift+d']
  - commands: ['move-workspace --direction down']
    bindings: ['alt+shift+s']
  - commands: ['move --workspace 1', 'focus --workspace 1']
    bindings: ['alt+shift+1']
  - commands: ['move --workspace 2', 'focus --workspace 2']
    bindings: ['alt+shift+2']
  - commands: ['move --workspace 3', 'focus --workspace 3']
    bindings: ['alt+shift+3']
  - commands: ['move --workspace 4', 'focus --workspace 4']
    bindings: ['alt+shift+4']
  - commands: ['move --workspace 5', 'focus --workspace 5']
    bindings: ['alt+shift+5']
  - commands: ['move --workspace 6', 'focus --workspace 6']
    bindings: ['alt+shift+6']
  - commands: ['move --workspace 7', 'focus --workspace 7']
    bindings: ['alt+shift+7']
  - commands: ['move --workspace 8', 'focus --workspace 8']
    bindings: ['alt+shift+8']
  - commands: ['move --workspace 9', 'focus --workspace 9']
    bindings: ['alt+shift+9']
`;

const YASB_CONFIG = String.raw`watch_stylesheet: true
watch_config: true
debug: false
update_check: true
komorebi:
  start_command: "komorebic start --whkd"
  stop_command: "komorebic stop --whkd"
  reload_command: "komorebic stop --whkd && komorebic start --whkd"
bars:
  primary-bar:
    enabled: true
    screens: ["primary"]
    class_name: "yasb-bar"
    alignment:
      position: "top"
      center: false
    animation:
      enabled: true
      duration: 1000
    blur_effect:
      enabled: true
      acrylic: false
      dark_mode: true
      round_corners: true
      round_corners_type: "normal"
      border_color: "System"
    window_flags:
      always_on_top: false
      windows_app_bar: true
    dimensions:
      width: "100%"
      height: 32
    padding:
      top: 6
      left: 6
      bottom: 0
      right: 6
    widgets:
      left: [
        "glazewm_workspaces",
        "pomodoro",
        "active_window",
        "microphone",
        "volume",
        "battery"
      ]
      center: [
        "clock",
        "taskbar"
      ]
      right: [
        "media",
        "memory",
        "traffic",
        "wifi",
        "power_menu"
      ]

widgets:
  glazewm_workspaces:
    type: "glazewm.workspaces.GlazewmWorkspacesWidget"
    options:
      offline_label: "GlazeWM Offline"
      hide_if_offline: true
      populated_label: "󱓼"
      empty_label: "󱓼"
      active_populated_label: "󱓻"
      active_empty_label: "󱓻"
      hide_empty_workspaces: false
      glazewm_server_uri: "ws://localhost:6123"
      enable_scroll_switching: true
      reverse_scroll_direction: true
      container_padding:
        top: 0
        left: 0
        bottom: 0
        right: 0

  pomodoro:
    type: "yasb.pomodoro.PomodoroWidget"
    options:
      label: "<span>{icon}</span> {remaining}"
      label_alt: "<span>{icon}</span> {session}/{total_sessions} - {status}"
      work_duration: 25
      break_duration: 5
      long_break_duration: 15
      long_break_interval: 4
      auto_start_breaks: true
      auto_start_work: true
      sound_notification: true
      show_notification: true
      hide_on_break: false
      session_target: 8
      icons:
        work: ""
        break: ""
        paused: ""
      container_padding:
        top: 0
        left: 12
        bottom: 0
        right: 12
      menu:
        blur: true
        round_corners: true
        round_corners_type: "normal"
        border_color: "System"
        alignment: "right"
        direction: "down"
        offset_top: 6
        offset_left: 0
        circle_background_color: "#09ffffff"
        circle_work_progress_color: "#88c0d0"
        circle_break_progress_color: "#a3be8c"
        circle_thickness: 8
        circle_size: 160
      callbacks:
        on_left: "toggle_menu"
        on_middle: "reset_timer"
        on_right: "toggle_label"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  active_window:
    type: "yasb.active_window.ActiveWindowWidget"
    options:
      label: "{win[title]}"
      label_alt: "[class_name='{win[class_name]}' exe='{win[process][name]}' hwnd={win[hwnd]}]"
      label_no_window: ""
      label_icon: true
      label_icon_size: 14
      max_length: 20
      max_length_ellipsis: "..."
      monitor_exclusive: true

  microphone:
    type: "yasb.microphone.MicrophoneWidget"
    options:
      label: "<span>{icon}</span> {level}"
      icons:
        normal: "󰍬"
        muted: "󰍭"
      callbacks:
        on_left: "toggle_mute"
        on_middle: "toggle_label"
        on_right: "exec cmd.exe /c start ms-settings:sound"

  volume:
    type: "yasb.volume.VolumeWidget"
    options:
      label: "<span>{icon}</span> {level}"
      volume_icons:
        - ""
        - ""
        - ""
        - ""
        - ""
      audio_menu:
        blur: true
        round_corners: true
        round_corners_type: "normal"
        border_color: "system"
        alignment: "center"
        direction: "down"
        offset_top: 6
        offset_left: 0
        show_apps: true
        show_app_labels: false
        show_app_icons: true
        show_apps_expanded: false
        app_icons:
          toggle_down: ""
          toggle_up: ""
      callbacks:
        on_left: "toggle_volume_menu"
        on_right: "toggle_mute"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  battery:
    type: "yasb.battery.BatteryWidget"
    options:
      label: "<span>{icon}</span> {percent}%"
      update_interval: 5000
      time_remaining_natural: False
      hide_unsupported: True
      charging_options:
        icon_format: "{charging_icon}"
        blink_charging_icon: true
        blink_interval: 500
      status_thresholds:
        critical: 10
        low: 25
        medium: 75
        high: 95
        full: 100
      status_icons:
        icon_charging: ""
        icon_critical: ""
        icon_low: ""
        icon_medium: ""
        icon_high: ""
        icon_full: ""
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  clock:
    type: "yasb.clock.ClockWidget"
    options:
      label: "{%H:%M:%S}"
      label_alt: "{%I:%M:%S}"
      timezones: []
      callbacks:
        on_left: "toggle_calendar"

  taskbar:
    type: "yasb.taskbar.TaskbarWidget"
    options:
      icon_size: 16
      tooltip: true
      show_only_visible: false
      strict_filtering: true
      monitor_exclusive: false
      animation:
        enabled: true
      preview:
        enabled: false
        width: 240
        delay: 400
        padding: 8
        margin: 8
      title_label:
        enabled: false
        show: "always"
        min_length: 10
        max_length: 30
      ignore_apps:
        processes: []
        titles: []
        classes: []

  media:
    type: "yasb.media.MediaWidget"
    options:
      label: "{title}"
      label_alt: "<span></span> {artist}"
      callbacks:
        on_left: "toggle_media_menu"
        on_middle: "do_nothing"
        on_right: "do_nothing"
      max_field_size:
        label: 20
      show_thumbnail: false
      controls_only: false
      controls_left: true
      hide_empty: true
      thumbnail_alpha: 250
      thumbnail_padding: 8
      thumbnail_corner_radius: 0
      icons:
        prev_track: ""
        next_track: ""
        play: ""
        pause: ""

  memory:
    type: "yasb.memory.MemoryWidget"
    options:
      label: "{virtual_mem_used}/{virtual_mem_total}"
      label_alt: "<span></span> VIRT: {virtual_mem_percent}% SWAP: {swap_mem_percent}%"
      update_interval: 5000
      callbacks:
        on_left: "toggle_label"
        on_middle: "do_nothing"
        on_right: "do_nothing"
      memory_thresholds:
        low: 25
        medium: 50
        high: 90
      histogram_icons:
        - "▁"
        - "▁"
        - "▂"
        - "▃"
        - "▄"
        - "▅"
        - "▆"
        - "▇"
        - "█"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  traffic:
    type: "yasb.traffic.TrafficWidget"
    options:
      label: " {download_speed} |  {upload_speed}"
      label_alt: "Download {download_speed} | Upload {upload_speed}"
      update_interval: 1000
      max_label_length: 8
      speed_unit: "bytes"
      menu:
        blur: true
        round_corners: true
        round_corners_type: "normal"
        border_color: "system"
        alignment: "left"
        direction: "down"
        offset_top: 6
        offset_left: 0
      callbacks:
        on_left: "toggle_menu"
        on_right: "toggle_label"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  wifi:
    type: "yasb.wifi.WifiWidget"
    options:
      label: "<span>{wifi_icon}</span>{wifi_name} {wifi_strength}%"
      update_interval: 5000
      callbacks:
        on_left: "toggle_menu"
        on_middle: "exec cmd.exe /c start ms-settings:network"
        on_right: "toggle_label"
      ethernet_label: "<span>{wifi_icon}</span>"
      ethernet_label_alt: "<span>{wifi_icon}</span>{ip_addr}"
      ethernet_icon: ""
      get_exact_wifi_strength: false
      wifi_icons: [
        "󰤮",
        "󰤟",
        "󰤢",
        "󰤥",
        "󰤨"
      ]
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]
      menu_config:
        blur: true
        round_corners: true
        round_corners_type: "normal"
        border_color: "System"
        alignment: "right"
        direction: "down"
        offset_top: 6
        offset_left: 0
        wifi_icons_secured: [
          "",
          "",
          "",
          "",
        ]
        wifi_icons_unsecured: [
          "",
          "",
          "",
          "",
        ]

  power_menu:
    type: "yasb.power_menu.PowerMenuWidget"
    options:
      label: ""
      uptime: True
      blur: False
      blur_background: True
      animation_duration: 200
      button_row: 5
      buttons:
        shutdown: ["", "Rage Quit"]
        restart: ["", "Oops, Reboot"]
        signout: ["󰍃", "Dip Out"]
        hibernate: ["", "Bear Mode"]
        sleep: ["⏾", "Nap Time"]
        cancel: ["", "Nah, Im Good "]
`;

const YASB_HW_WIDGETS = `
  cpu:
    type: "yasb.cpu.CpuWidget"
    options:
      label: "<span></span> {info[percent][total]}%"
      label_alt: "<span></span> {info[percent][total]}% | {info[freq][current]:.0f} MHz"
      update_interval: 2000
      cpu_thresholds:
        low: 25
        medium: 50
        high: 90
      callbacks:
        on_left: "toggle_label"
        on_right: "exec cmd /c Taskmgr"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  cpu_temp:
    type: "yasb.libre_monitor.LibreHardwareMonitorWidget"
    options:
      # Find your sensor ID at http://localhost:8085/data.json
      # AMD: /amdcpu/0/temperature/0  Intel: /intelcpu/0/temperature/8
      label: "{info[value]}{info[unit]}"
      label_alt: "{info[min]}/{info[max]} {info[unit]}"
      sensor_id: "/amdcpu/0/temperature/2"
      class_name: "cpu-temp"
      update_interval: 2000
      precision: 0
      server_host: "localhost"
      server_port: 8085
      callbacks:
        on_left: "toggle_label"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]

  gpu:
    type: "yasb.gpu.GpuWidget"
    options:
      label: "<span></span> {info[utilization]}% {info[temp]}°C"
      label_alt: "<span></span> {info[utilization]}% | VRAM: {info[mem_used]}/{info[mem_total]}"
      update_interval: 2000
      gpu_thresholds:
        low: 25
        medium: 50
        high: 90
      callbacks:
        on_left: "toggle_label"
        on_right: "exec cmd /c Taskmgr"
      label_shadow:
        enabled: true
        color: "black"
        radius: 3
        offset: [ 1, 1 ]
`;

const YASB_CONFIG_HW = YASB_CONFIG
  .replace(/"media",(\s+)"memory",/, '"media",$1"cpu",$1"cpu_temp",$1"gpu",$1"memory",')
  + YASB_HW_WIDGETS;

// ── DATA ─────────────────────────────────────────────────────────────────────

const APPS = [
  {
    id: "glazewm",
    name: "GlazeWM",
    cat: "wm",
    icon: "ti-layout-board",
    iconClass: "icon-wm",
    tagClass: "tag-wm",
    tagLabel: "Window Mgmt",
    desc: "Tiling window manager for Windows inspired by i3wm. Keyboard-driven, zero bloat.",
    dl: "https://github.com/glzr-io/glazewm/releases/latest",
    src: "https://github.com/glzr-io/glazewm",
    gh: "glzr-io/glazewm",
    dlFlags: ["/S"],
    // The plain .exe bundles Zebar; the "standalone" MSI is GlazeWM only.
    assetMatch: "standalone",
  },
  {
    id: "yasb",
    name: "YASB",
    cat: "bar",
    icon: "ti-layout-navbar",
    iconClass: "icon-bar",
    tagClass: "tag-bar",
    tagLabel: "Status Bar",
    desc: "Yet Another Status Bar — highly configurable Windows bar with widgets and YAML config.",
    dl: "https://github.com/amnweb/yasb/releases/latest",
    src: "https://github.com/amnweb/yasb",
    gh: "amnweb/yasb",
    dlFlags: ["/S"],
  },
  {
    id: "translucenttb",
    name: "TranslucentTB",
    cat: "taskbar",
    icon: "ti-border-bottom",
    iconClass: "icon-taskbar",
    tagClass: "tag-taskbar",
    tagLabel: "Taskbar",
    desc: "Makes the Windows taskbar translucent, transparent, or acrylic. Lightweight.",
    dl: "https://github.com/TranslucentTB/TranslucentTB/releases/latest",
    src: "https://github.com/TranslucentTB/TranslucentTB",
  },
  {
    id: "afterburner",
    name: "MSI Afterburner",
    cat: "hw",
    icon: "ti-flame",
    iconClass: "icon-hw",
    tagClass: "tag-hw",
    tagLabel: "Hardware",
    desc: "GPU overclocking, monitoring, custom fan curves and hardware stats overlay.",
    dl: "https://www.guru3d.com/download/msi-afterburner-beta-download/",
    src: "https://www.msi.com/Landing/afterburner/graphics-cards",
  },
  {
    id: "rivatuner",
    name: "RivaTuner RTSS",
    cat: "hw",
    icon: "ti-cpu",
    iconClass: "icon-hw",
    tagClass: "tag-hw",
    tagLabel: "Hardware",
    desc: "Framerate limiter and on-screen display server. Pairs with MSI Afterburner.",
    dl: "https://www.guru3d.com/download/rtss-rivatuner-statistics-server-download/",
    src: "https://www.guru3d.com/download/rtss-rivatuner-statistics-server-download/",
  },
  {
    id: "nerdfonts",
    name: "Nerd Fonts",
    cat: "font",
    icon: "ti-letter-case",
    iconClass: "icon-font",
    tagClass: "tag-font",
    tagLabel: "Font",
    desc: "Patched icon fonts with 3,600+ glyphs from FontAwesome, Material Design Icons, and more. Required for YASB bar icons to render correctly.",
    dl: "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip",
    src: "https://github.com/ryanoasis/nerd-fonts",
    fontInstall: true,
  },
  {
    id: "librehardwaremonitor",
    name: "LibreHardwareMonitor",
    cat: "hw",
    icon: "ti-temperature",
    iconClass: "icon-hw",
    tagClass: "tag-hw",
    tagLabel: "Hardware",
    desc: "Open-source hardware monitor for CPU/GPU temperatures, fan speeds, voltages, and more. Powers the temperature display in the status bar.",
    dl: "https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases/latest",
    src: "https://github.com/LibreHardwareMonitor/LibreHardwareMonitor",
    gh: "LibreHardwareMonitor/LibreHardwareMonitor",
    extractInstall: true,
    assetMatch: "net472",
  },
  {
    id: "fastfetch",
    name: "Fastfetch",
    cat: "shell",
    icon: "ti-terminal-2",
    iconClass: "icon-shell",
    tagClass: "tag-shell",
    tagLabel: "Shell",
    desc: "Blazing-fast system info tool. Displays OS, CPU, RAM, disk and more at terminal startup. Configure via JSON.",
    dl: "https://github.com/fastfetch-cli/fastfetch/releases/latest",
    src: "https://github.com/fastfetch-cli/fastfetch",
    gh: "fastfetch-cli/fastfetch",
    assetMatch: "windows-amd64.zip",
    extractInstall: true,
  },
  {
    id: "filepilot",
    name: "File Pilot",
    cat: "file",
    icon: "ti-folder-open",
    iconClass: "icon-file",
    tagClass: "tag-file",
    tagLabel: "File Manager",
    desc: "Modern, keyboard-driven file manager for Windows with a clean interface and fast navigation.",
    dl: "https://github.com/glzr-io/filepilot/releases/latest",
    src: "https://github.com/glzr-io/filepilot",
    gh: "glzr-io/filepilot",
    dlFlags: ["/S"],
  },
];

// Merge in any custom apps saved from the Add App dialog
try {
  const _custom = JSON.parse(localStorage.getItem("hearth.customApps") || "[]");
  APPS.push(..._custom);
} catch {}


const FASTFETCH_CONFIG = `{
  "$schema": "https://github.com/fastfetch-cli/fastfetch/raw/dev/doc/json_schema.json",
  "logo": {
    "type": "none"
  },
  "display": {
    "separator": " "
  },
  "modules": [
    "break",
    {
      "type": "title",
      "color": {
        "user": "#F5C2E7",
        "at": "#CDD6F4",
        "host": "#89DCEB"
      }
    },
    "break",
    {
      "type": "os",
      "key": "",
      "keyColor": "#89DCEB"
    },
    {
      "type": "cpu",
      "key": "",
      "keyColor": "#F5C2E7"
    },
    {
      "type": "board",
      "key": "󰚗",
      "keyColor": "#FAB387"
    },
    {
      "type": "memory",
      "key": "",
      "keyColor": "#A6E3A1",
      "format": "{used} / {total} ({percentage})"
    },
    {
      "type": "disk",
      "key": "",
      "keyColor": "#94E2D5"
    },
    "break",
    {
      "type": "colors",
      "symbol": "circle"
    }
  ]
}`;

const CONFIGS = [
  {
    id: "glazewm-config",
    appId: "glazewm",
    name: "GlazeWM",
    path: "~\\.glzr\\glazewm\\config.yaml",
    content: GLAZEWM_CONFIG,
  },
  {
    id: "yasb-config",
    appId: "yasb",
    name: "YASB",
    path: "~\\.config\\yasb\\config.yaml",
    content: YASB_CONFIG,
  },
  {
    id: "yasb-hw-config",
    appId: "yasb",
    name: "YASB + HW Monitor",
    path: "~\\.config\\yasb\\config.yaml",
    content: YASB_CONFIG_HW,
  },
  {
    id: "fastfetch-config",
    appId: "fastfetch",
    name: "Fastfetch",
    path: "~\\.config\\fastfetch\\config.jsonc",
    content: FASTFETCH_CONFIG,
  },
];

const VIEWS = ["apps", "configs"];
const CATS = {
  wm:      { label: "Window Mgmt",  icon: "ti-layout-board" },
  bar:     { label: "Status Bar",   icon: "ti-layout-navbar" },
  taskbar: { label: "Taskbar",      icon: "ti-border-bottom" },
  hw:      { label: "Hardware",     icon: "ti-cpu" },
  file:    { label: "File Manager", icon: "ti-folder-open" },
  font:    { label: "Font",         icon: "ti-letter-case" },
  shell:   { label: "Shell",        icon: "ti-terminal-2" },
};

// ── STATE ─────────────────────────────────────────────────────────────────────

let state = {
  view: "apps",
  cat: null,
  search: "",
  elevated: false,    // running with admin rights?
  hideSystem: true,   // hide critical Windows services in the Services view
  sidebarCollapsed: localStorage.getItem("hearth.sidebarCollapsed") === "1",
};

const installState      = {}; // appId -> { state, pct?, step?, total? }
const installedVersions = {}; // appId -> version string | "installed" | null
const latestVersions    = {}; // appId -> version string | null

let services = [];   // [{ Name, DisplayName, State, StartMode, PathName }]
let startupItems = []; // [{ id, name, command, location, enabled }]
let svcBusy = {};    // service name -> true while a toggle is in flight
let startupBusy = {}; // startup id -> true while a toggle is in flight

// Critical Windows services that should not be casually disabled. Used (with a
// "runs from \Windows\" heuristic) to hide system services behind a toggle.
const CRITICAL_SERVICES = new Set([
  "rpcss","rpceptmapper","dcomlaunch","lsm","plugplay","power","schedule","themes",
  "eventlog","dnscache","dhcp","bfe","mpssvc","windefend","wscsvc","wuauserv","cryptsvc",
  "audiosrv","audioendpointbuilder","profsvc","usermanager","samss","gpsvc","netprofm",
  "nlasvc","nsi","wcmsvc","shellhwdetection","systemeventsbroker","coremessagingregistrar",
  "brokerinfrastructure","dps","wdiservicehost","winmgmt","trustedinstaller","wlansvc",
  "lanmanworkstation","lanmanserver","eventsystem","fontcache","timebrokersvc","camsvc",
]);

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function openUrl(url) {
  try {
    await invoke("open_url", { url });
  } catch {
    window.open(url, "_blank");
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function versionGt(latest, installed) {
  if (!latest || !installed || installed === "installed") return false;
  const a = latest.replace(/^v/, "").split(".").map(Number);
  const b = installed.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

function installBtnHtml(appId, fontInstall) {
  const info = installState[appId];
  const s    = info?.state;

  if (s === "done")
    return `<i class="ti ti-check"></i> Installed!`;

  if (s === "fetching")
    return `<span class="step-label">1/3</span><i class="ti ti-loader-2 spin"></i>Fetching…`;

  if (s === "downloading") {
    const pct  = info.pct ?? 0;
    const step = fontInstall ? "1/2" : "2/3";
    return `<span class="step-label">${step}</span><i class="ti ti-loader-2 spin"></i><span class="dl-pct">${pct}%</span><div class="dl-bar"><div class="dl-fill" style="transform:scaleX(${pct/100})"></div></div>`;
  }

  if (s === "installing")
    return `<span class="step-label">3/3</span><i class="ti ti-loader-2 spin"></i>Installing…`;

  if (s === "extracting") {
    const step  = info.step  ?? 0;
    const total = info.total ?? 1;
    const pct   = total ? Math.round((step / total) * 100) : 0;
    return `<span class="step-label">2/2</span><i class="ti ti-loader-2 spin"></i><span class="dl-pct">${step}/${total}</span><div class="dl-bar"><div class="dl-fill" style="transform:scaleX(${pct/100})"></div></div>`;
  }

  if (s === "cancelled")
    return `<i class="ti ti-x"></i> Cancelled`;

  if (s === "error")
    return `<i class="ti ti-alert-triangle"></i> Failed`;

  if (versionGt(latestVersions[appId], installedVersions[appId]))
    return `<i class="ti ti-refresh"></i> Update`;

  // Detected as installed and up to date — show that, but stay clickable so it
  // can still be reinstalled/repaired.
  if (installedVersions[appId])
    return `<i class="ti ti-check"></i> Installed`;

  return fontInstall
    ? `<i class="ti ti-letter-case"></i> Install Font`
    : `<i class="ti ti-download"></i> Download`;
}

// True when the app is detected as installed with no pending update — used to
// give the button its "installed" styling.
function isInstalledIdle(appId) {
  return !installState[appId]
    && !!installedVersions[appId]
    && !versionGt(latestVersions[appId], installedVersions[appId]);
}

function updateInstallBtn(btn, appId) {
  if (!btn) return;
  const info = installState[appId];
  const s    = info?.state;
  const busy = s && s !== "done" && s !== "error" && s !== "cancelled";
  btn.disabled = !!busy;

  // Avoid replacing the spinner element on every pct tick — only patch the
  // dynamic text and fill bar so the CSS animation doesn't restart.
  const prevState = btn.dataset.installerState;
  if (prevState === s && (s === "downloading" || s === "extracting")) {
    const pctEl  = btn.querySelector(".dl-pct");
    const fillEl = btn.querySelector(".dl-fill");
    if (s === "downloading") {
      const pct = info?.pct ?? 0;
      if (pctEl)  pctEl.textContent  = `${pct}%`;
      if (fillEl) fillEl.style.transform = `scaleX(${pct / 100})`;
    } else {
      const step  = info?.step  ?? 0;
      const total = info?.total ?? 1;
      const pct   = total ? Math.round((step / total) * 100) : 0;
      if (pctEl)  pctEl.textContent  = `${step}/${total}`;
      if (fillEl) fillEl.style.transform = `scaleX(${pct / 100})`;
    }
  } else {
    btn.innerHTML = installBtnHtml(appId, btn.dataset.fontInstall === "true");
    btn.dataset.installerState = s ?? "";
    btn.title = (s === "error" && info?.msg) ? `Error: ${info.msg}` : "";
    btn.classList.toggle("is-installed", isInstalledIdle(appId));
  }

  const cancelBtn = document.getElementById(`btn-cancel-${appId}`);
  if (cancelBtn) {
    const cancellable = s === "downloading" || s === "extracting";
    cancelBtn.style.display = cancellable ? "flex" : "none";
    if (cancellable) cancelBtn.disabled = false;
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────

function getFiltered() {
  return APPS.filter(a => {
    const matchCat    = !state.cat || a.cat === state.cat;
    const matchSearch = !state.search
      || a.name.toLowerCase().includes(state.search)
      || a.desc.toLowerCase().includes(state.search)
      || a.tagLabel.toLowerCase().includes(state.search);
    return matchCat && matchSearch;
  });
}

function renderSidebar() {
  const navAll     = document.getElementById("nav-all");
  const navConfigs = document.getElementById("nav-configs");
  const navServices = document.getElementById("nav-services");
  const navStartup  = document.getElementById("nav-startup");
  const catNavs    = document.querySelectorAll("[data-cat]");

  const navHardware = document.getElementById("nav-hardware");
  [navAll, navConfigs, navServices, navStartup, navHardware].forEach(n => n?.classList.remove("active"));
  catNavs.forEach(n => n.classList.remove("active"));

  if (state.view === "apps" && !state.cat) navAll?.classList.add("active");
  if (state.view === "configs")  navConfigs?.classList.add("active");
  if (state.view === "services") navServices?.classList.add("active");
  if (state.view === "startup")  navStartup?.classList.add("active");
  if (state.view === "hardware") navHardware?.classList.add("active");
  if (state.cat) {
    document.querySelector(`[data-cat="${state.cat}"]`)?.classList.add("active");
  }
}

function renderTopbar() {
  const icon  = document.getElementById("topbar-icon");
  const title = document.getElementById("topbar-title");
  const sub   = document.getElementById("topbar-sub");

  const labels = {
    apps:     { icon: "ti-apps",         label: "Apps",     sub: "All tools" },
    configs:  { icon: "ti-file-code",    label: "Configs",  sub: "Dotfiles & config links" },
    services: { icon: "ti-settings-cog", label: "Services", sub: "Enable or disable Windows services" },
    startup:  { icon: "ti-player-play",  label: "Startup",  sub: "Toggle startup apps on or off" },
    hardware: { icon: "ti-cpu-2",        label: "Hardware", sub: "CPU & GPU temperatures and load" },
  };

  const info = labels[state.view];
  icon.className    = `ti ${info.icon} topbar-icon`;
  title.textContent = state.cat ? CATS[state.cat]?.label : info.label;
  sub.textContent   = state.cat ? `${APPS.filter(a => a.cat === state.cat).length} apps` : info.sub;

  // Search box is only meaningful for the list-style views.
  const placeholders = { apps: "Search apps…", services: "Search services…", startup: "Search startup apps…" };
  const ph = placeholders[state.view];
  const searchEl = document.getElementById("search");
  const wrap = searchEl?.closest(".search-wrap");
  if (wrap) wrap.style.display = ph ? "" : "none";
  if (searchEl && ph) { searchEl.placeholder = ph; searchEl.value = state.search; }
}

function renderContent() {
  const content = document.getElementById("content");

  if (state.view === "configs") {
    content.innerHTML = `
      <div class="section-header">
        <span class="section-title">Config Files</span>
        <div class="section-line"></div>
      </div>
      <div class="config-list">${CONFIGS.map(configCard).join("")}</div>
    `;

    content.querySelectorAll("[data-copy-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const cfg = CONFIGS.find(c => c.id === btn.dataset.copyId);
        if (!cfg) return;
        navigator.clipboard.writeText(cfg.content).then(() => {
          btn.innerHTML = `<i class="ti ti-check"></i> Copied!`;
          setTimeout(() => { btn.innerHTML = `<i class="ti ti-copy"></i> Copy`; }, 2000);
        }).catch(() => {});
      });
    });

    content.querySelectorAll("[data-apply-id]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const cfg = CONFIGS.find(c => c.id === btn.dataset.applyId);
        if (!cfg) return;
        const ok = await confirmDialog(
          "Apply config?",
          `Write to ${cfg.path}? The existing file will be backed up as *.hearth.bak first.`,
          { confirmLabel: "Apply", confirmClass: "modal-btn-ok", icon: "ti-device-floppy" }
        );
        if (!ok) return;
        try {
          await invoke("write_config_file", { path: cfg.path, content: cfg.content });
          toast(`${cfg.name} written to disk.`, "ok");
        } catch (e) {
          toast(`Apply failed: ${e}`, "error");
        }
      });
    });

    content.querySelectorAll("[data-open-path]").forEach(btn => {
      btn.addEventListener("click", async () => {
        try { await invoke("open_in_explorer", { path: btn.dataset.openPath }); } catch {}
      });
    });

    content.querySelectorAll(".config-card-header").forEach(header => {
      header.addEventListener("click", e => {
        if (e.target.closest("[data-copy-id]") || e.target.closest("[data-apply-id]") || e.target.closest("[data-open-path]")) return;
        header.closest(".config-card").classList.toggle("collapsed");
      });
    });
    return;
  }

  if (state.view === "services") { renderServices(content); return; }
  if (state.view === "startup")  { renderStartup(content);  return; }
  if (state.view === "hardware") { renderHardware(content);  return; }

  // Apps view
  const apps    = getFiltered();
  const allChecked     = Object.keys(installedVersions).length >= APPS.length;
  const installedCount = APPS.filter(a => installedVersions[a.id]).length;
  const statHtml = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">Total Apps</div>
        <div class="stat-val">${APPS.length}<span>tools</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Installed</div>
        <div class="stat-val">${allChecked ? installedCount : "—"}<span>${allChecked ? `of ${APPS.length}` : "checking"}</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Config Files</div>
        <div class="stat-val">${CONFIGS.length}<span>saved</span></div>
      </div>
    </div>`;

  const sectionLabel  = state.cat ? CATS[state.cat]?.label : "All Apps";
  const cardsHtml     = apps.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--faint);font-size:13px;">No apps found.</div>`
    : apps.map(appCard).join("");

  const autoApps      = APPS.filter(a => (a.gh || a.fontInstall) && !installState[a.id] && !installedVersions[a.id]);
  const dlAllDisabled = autoApps.length === 0 ? "disabled" : "";
  const dlAllLabel    = autoApps.length === 0
    ? `<i class="ti ti-check"></i> All Installed`
    : `<i class="ti ti-download"></i> Install All (${autoApps.length})`;

  content.innerHTML = `
    ${statHtml}
    <div class="section-header">
      <span class="section-title">${sectionLabel}</span>
      <div class="section-line"></div>
      <button class="btn-dl-all" id="btn-dl-all" ${dlAllDisabled}>${dlAllLabel}</button>
    </div>
    <div class="app-grid">${cardsHtml}</div>
  `;

  // Bind download buttons
  content.querySelectorAll("[data-install-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const appId       = btn.dataset.installId;
      const gh          = btn.dataset.gh;
      const dl          = btn.dataset.dl;
      const flags       = JSON.parse(btn.dataset.flags || "[]");
      const fontInstall = btn.dataset.fontInstall === "true";

      if (installState[appId]) return; // already in progress

      const extractInstall = btn.dataset.extractInstall === "true";
      if (fontInstall) {
        await handleFontInstall(btn, appId, dl);
      } else if (extractInstall && gh) {
        await handleExtractInstall(btn, appId, gh, btn.dataset.assetMatch || "");
      } else if (gh) {
        await handleAutoInstall(btn, appId, gh, dl, flags);
      } else {
        openUrl(dl);
      }
    });
  });

  // Bind cancel buttons
  content.querySelectorAll("[data-cancel-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const appId = btn.dataset.cancelId;
      btn.disabled = true;
      try { await invoke("cancel_download", { appId }); } catch {}
    });
  });

  // Bind source buttons
  content.querySelectorAll("[data-src]").forEach(btn => {
    btn.addEventListener("click", () => openUrl(btn.dataset.src));
  });

  // Install All
  document.getElementById("btn-dl-all")?.addEventListener("click", () => {
    const targets = APPS.filter(a => (a.gh || a.fontInstall) && !installState[a.id] && !installedVersions[a.id]);
    for (const app of targets) {
      const btn = document.querySelector(`[data-install-id="${app.id}"]`);
      if (app.fontInstall) handleFontInstall(btn, app.id, app.dl);
      else                 handleAutoInstall(btn, app.id, app.gh, app.dl, app.dlFlags || []);
    }
  });
}

function appCard(app) {
  const s          = installState[app.id]?.state;
  const busy       = s && s !== "done" && s !== "error";
  const dlHtml     = installBtnHtml(app.id, !!app.fontInstall);
  const dlDisabled = busy ? "disabled" : "";

  const srcIcon = app.src.includes("github.com")
    ? `<i class="ti ti-brand-github"></i>`
    : `<i class="ti ti-world"></i>`;

  // Version badges
  const installed = installedVersions[app.id];
  const latest    = latestVersions[app.id];
  const hasUpdate = versionGt(latest, installed);
  let vBadges = "";
  if (installed) {
    const label = installed === "installed" ? "Installed" : `v${installed}`;
    vBadges += `<span class="ver-badge ver-ok"><i class="ti ti-check-circle"></i> ${label}</span>`;
  }
  if (hasUpdate) {
    vBadges += `<span class="ver-badge ver-new"><i class="ti ti-arrow-up"></i> v${latest}</span>`;
  } else if (!installed && latest) {
    vBadges += `<span class="ver-badge ver-avail">v${latest}</span>`;
  }
  const versionRow = vBadges ? `<div class="version-row">${vBadges}</div>` : "";

  return `
    <div class="app-card">
      <div class="card-top">
        <div class="app-icon ${app.iconClass}">
          <i class="ti ${app.icon}"></i>
        </div>
        <span class="app-tag ${app.tagClass}">${app.tagLabel}</span>
      </div>
      <div class="app-name">${app.name}</div>
      <div class="app-desc">${app.desc}</div>
      ${versionRow}
      <div class="card-actions">
        <button class="btn-dl${isInstalledIdle(app.id) ? " is-installed" : ""}" ${dlDisabled}
          data-install-id="${app.id}"
          data-gh="${app.gh || ""}"
          data-dl="${app.dl}"
          data-flags='${JSON.stringify(app.dlFlags || [])}'
          data-font-install="${app.fontInstall ? 'true' : 'false'}"
          data-extract-install="${app.extractInstall ? 'true' : 'false'}"
          data-asset-match="${app.assetMatch || ''}">
          ${dlHtml}
        </button>
        <button class="btn-cancel" id="btn-cancel-${app.id}"
          style="display:none"
          data-cancel-id="${app.id}"
          title="Cancel download">
          <i class="ti ti-x"></i>
        </button>
        <button class="btn-src" data-src="${app.src}" title="Open on GitHub / website">
          ${srcIcon}
        </button>
      </div>
      ${CONFIGS.some(c => c.appId === app.id) ? `
      <div class="config-row">
        <i class="ti ti-file-code"></i> Config saved
      </div>` : ""}
    </div>
  `;
}

function configCard(cfg) {
  const app = APPS.find(a => a.id === cfg.appId);
  return `
    <div class="config-card collapsed" data-config-id="${cfg.id}">
      <div class="config-card-header">
        <div class="app-icon ${app?.iconClass || ""}" style="flex-shrink:0">
          <i class="ti ${app?.icon || "ti-file-code"}"></i>
        </div>
        <div class="config-card-meta">
          <div class="config-card-name">${escapeHtml(cfg.name)}</div>
          <div class="config-card-path">${escapeHtml(cfg.path)}</div>
        </div>
        <button class="btn-folder" data-open-path="${escapeHtml(cfg.path)}" title="Open file location">
          <i class="ti ti-folder-open"></i>
        </button>
        <button class="btn-apply" data-apply-id="${cfg.id}" title="Write this config to disk">
          <i class="ti ti-device-floppy"></i> Apply
        </button>
        <button class="btn-copy" data-copy-id="${cfg.id}">
          <i class="ti ti-copy"></i> Copy
        </button>
        <i class="ti ti-chevron-down config-chevron"></i>
      </div>
      <div class="config-body">
        <div class="config-body-inner">
          <pre class="config-code">${escapeHtml(cfg.content)}</pre>
        </div>
      </div>
    </div>
  `;
}

function render() {
  renderSidebar();
  renderTopbar();
  renderContent();
}

// ── HARDWARE MONITOR ──────────────────────────────────────────────────────────

let hwData     = [];
let lhmRunning = false;
let hwInterval = null;

const HW_HISTORY_MAX = 24; // 24 × 2.5 s = 60 s rolling window
const hwHistory = {};

function hwHistoryPush(key, sensor) {
  if (!sensor) return;
  if (!hwHistory[key]) hwHistory[key] = [];
  hwHistory[key].push(sensor.value);
  if (hwHistory[key].length > HW_HISTORY_MAX) hwHistory[key].shift();
}

function sparkline(data, color = "var(--c2)") {
  if (!data || data.length < 2) return "";
  const W = 64, H = 24;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = ((i / (data.length - 1)) * W).toFixed(1);
    const y = (H - ((v - min) / range) * (H - 3) - 1.5).toFixed(1);
    return `${x},${y}`;
  }).join(" ");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;overflow:visible" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.75"/></svg>`;
}

async function pollHardware() {
  try {
    lhmRunning = await invoke("check_lhm_running");
    if (lhmRunning) {
      hwData = await invoke("get_hardware_data") || [];
      hwHistoryPush("cpuTemp",  hwData.find(s => s.type === "Temperature" && /tdie|tctl|cpu package/i.test(s.name)));
      hwHistoryPush("cpuLoad",  hwData.find(s => s.type === "Load"        && /cpu total/i.test(s.name)));
      hwHistoryPush("gpuTemp",  hwData.find(s => s.type === "Temperature" && /gpu core|gpu chip|gpu diode/i.test(s.name)));
      hwHistoryPush("gpuLoad",  hwData.find(s => s.type === "Load"        && /gpu core/i.test(s.name)));
      hwHistoryPush("ramLoad",  hwData.find(s => s.type === "Load"        && /memory/i.test(s.name)));
    }
  } catch { lhmRunning = false; }
  if (state.view === "hardware") renderContent();
}

function startHwPolling() {
  stopHwPolling();
  pollHardware();
  hwInterval = setInterval(pollHardware, 2500);
}

function stopHwPolling() {
  if (hwInterval) { clearInterval(hwInterval); hwInterval = null; }
}

function hwFind(type, nameRe) {
  return hwData.find(s => s.type === type && nameRe.test(s.name));
}

function hwRow(label, sensor, unit = "", decimals = 0, histKey = null) {
  if (!sensor) return "";
  const spark = histKey ? `<span class="hw-spark">${sparkline(hwHistory[histKey])}</span>` : "";
  return `<div class="hw-row"><span class="hw-label">${label}</span>${spark}<span class="hw-val">${sensor.value.toFixed(decimals)}${unit}</span></div>`;
}

function renderHardware(content) {
  const running = lhmRunning;

  const badge = running
    ? `<span class="hw-badge hw-badge-on"><i class="ti ti-circle-check"></i> Running</span>`
    : `<span class="hw-badge hw-badge-off"><i class="ti ti-circle-x"></i> Not running</span>`;

  let body = "";
  if (running && hwData.length > 0) {
    const cpuTemp  = hwFind("Temperature", /tdie|tctl|cpu package/i);
    const gpuTemp  = hwFind("Temperature", /gpu core|gpu chip|gpu diode/i);
    const cpuLoad  = hwFind("Load",        /cpu total/i);
    const gpuLoad  = hwFind("Load",        /gpu core/i);
    const ramLoad  = hwFind("Load",        /memory/i);
    const cpuPower = hwFind("Power",       /package/i);
    const gpuMemU  = hwFind("SmallData",   /gpu memory used/i);
    const gpuMemT  = hwFind("SmallData",   /gpu memory total/i);

    body = `
      <div class="hw-grid">
        <div class="hw-card">
          <div class="hw-card-title"><i class="ti ti-cpu"></i> CPU</div>
          ${hwRow("Temperature", cpuTemp, " °C", 0, "cpuTemp")}
          ${hwRow("Load",        cpuLoad, " %",  0, "cpuLoad")}
          ${hwRow("Power",       cpuPower," W",  1)}
        </div>
        <div class="hw-card">
          <div class="hw-card-title"><i class="ti ti-device-desktop"></i> GPU</div>
          ${hwRow("Temperature", gpuTemp, " °C", 0, "gpuTemp")}
          ${hwRow("Load",        gpuLoad, " %",  0, "gpuLoad")}
          ${(gpuMemU && gpuMemT) ? `<div class="hw-row"><span class="hw-label">VRAM</span><span class="hw-spark"></span><span class="hw-val">${gpuMemU.value.toFixed(0)} / ${gpuMemT.value.toFixed(0)} MB</span></div>` : ""}
        </div>
        <div class="hw-card" style="grid-column:1/-1">
          <div class="hw-card-title"><i class="ti ti-circuits"></i> Memory</div>
          ${hwRow("Usage", ramLoad, " %", 0, "ramLoad")}
        </div>
      </div>`;
  } else if (running) {
    body = `
      <div class="hw-empty">
        <i class="ti ti-loader-2 spin"></i>
        <p>Connected — waiting for sensor data…</p>
      </div>`;
  } else {
    const installed = installedVersions["librehardwaremonitor"];
    body = `
      <div class="hw-empty">
        <i class="ti ti-temperature-off"></i>
        <p>LibreHardwareMonitor is not running.</p>
        <p class="hw-empty-sub">${installed
          ? 'Start it below to see live sensor data.'
          : 'Download it from the Apps section, then start it here.'}</p>
        ${installed ? `<button class="btn-hw-start" id="btn-start-lhm"><i class="ti ti-player-play"></i> Start LHM</button>` : ""}
      </div>`;
  }

  content.innerHTML = `
    <div class="section-header">
      <span class="section-title">Hardware Monitor</span>
      <div class="section-line"></div>
      ${badge}
      <button class="btn-refresh" id="btn-refresh-hw" title="Refresh"><i class="ti ti-refresh"></i></button>
    </div>
    ${body}
    <div class="hw-note">Powered by <strong>LibreHardwareMonitor</strong> · HTTP server on port 8085</div>
  `;

  document.getElementById("btn-refresh-hw")?.addEventListener("click", pollHardware);
  document.getElementById("btn-start-lhm")?.addEventListener("click", async () => {
    try {
      await invoke("start_lhm");
      toast("LibreHardwareMonitor starting…", "ok");
      setTimeout(pollHardware, 2000);
    } catch (e) {
      toast(String(e), "error");
    }
  });
}

// ── BOOT ──────────────────────────────────────────────────────────────────────

document.getElementById("app").innerHTML = `
  <div class="titlebar">
    <button class="titlebar-btn tb-collapse" id="btn-collapse" title="Collapse sidebar" aria-label="Toggle sidebar">
      <i class="ti ti-layout-sidebar-left-collapse"></i>
    </button>
    <div class="titlebar-logo"><i class="ti ti-flame"></i></div>
    <span class="titlebar-name">Hearth</span>
    <div class="titlebar-controls">
      <button class="titlebar-btn tb-min"   id="btn-min"   title="Minimize"><i class="ti ti-minus"></i></button>
      <button class="titlebar-btn tb-max"   id="btn-max"   title="Maximize"><i class="ti ti-square"></i></button>
      <button class="titlebar-btn tb-close" id="btn-close" title="Close"><i class="ti ti-x"></i></button>
    </div>
  </div>

  <div class="layout">
    <aside class="sidebar">
      <div class="nav-section-label">Menu</div>
      <button type="button" class="nav-item active" id="nav-all" title="Apps">
        <i class="ti ti-apps" aria-hidden="true"></i> <span class="nav-label">Apps</span>
        <span class="nav-badge">${APPS.length}</span>
      </button>
      <button type="button" class="nav-item" id="nav-configs" title="Configs">
        <i class="ti ti-file-code" aria-hidden="true"></i> <span class="nav-label">Configs</span>
        <span class="nav-badge">${CONFIGS.length}</span>
      </button>

      <div class="nav-section-label">System</div>
      <button type="button" class="nav-item" id="nav-services" title="Services">
        <i class="ti ti-settings-cog" aria-hidden="true"></i> <span class="nav-label">Services</span>
      </button>
      <button type="button" class="nav-item" id="nav-startup" title="Startup">
        <i class="ti ti-player-play" aria-hidden="true"></i> <span class="nav-label">Startup</span>
      </button>
      <button type="button" class="nav-item" id="nav-hardware" title="Hardware">
        <i class="ti ti-cpu-2" aria-hidden="true"></i> <span class="nav-label">Hardware</span>
      </button>

<div class="sidebar-spacer"></div>
      <div class="sidebar-add-wrap">
        <button class="sidebar-add" id="btn-add" title="Add App">
          <i class="ti ti-plus"></i> <span class="nav-label">Add App</span>
        </button>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <i id="topbar-icon" class="ti ti-apps topbar-icon"></i>
        <span id="topbar-title" class="topbar-title">Apps</span>
        <span id="topbar-sub" class="topbar-sub">All tools</span>
        <div class="search-wrap">
          <i class="ti ti-search"></i>
          <input class="search-input" id="search" placeholder="Search apps…" />
        </div>
      </div>
      <div class="content" id="content"></div>
    </main>
  </div>
`;

// ── EVENTS ────────────────────────────────────────────────────────────────────

document.getElementById("btn-close").addEventListener("click", () => invoke("window_close").catch(() => {}));
document.getElementById("btn-min").addEventListener("click",   () => invoke("window_minimize").catch(() => {}));
document.getElementById("btn-max").addEventListener("click",   () => invoke("window_maximize").catch(() => {}));

// Sidebar collapse — narrows the sidebar to an icon-only rail. Choice persists.
function applySidebar() {
  const layout = document.querySelector(".layout");
  layout?.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  const btn = document.getElementById("btn-collapse");
  if (btn) {
    const i = btn.querySelector("i");
    if (i) i.className = `ti ti-layout-sidebar-left-${state.sidebarCollapsed ? "expand" : "collapse"}`;
    btn.title = state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";
    btn.setAttribute("aria-expanded", String(!state.sidebarCollapsed));
  }
}
document.getElementById("btn-collapse").addEventListener("click", () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  localStorage.setItem("hearth.sidebarCollapsed", state.sidebarCollapsed ? "1" : "0");
  applySidebar();
});
applySidebar();

document.getElementById("nav-all").addEventListener("click", () => {
  stopHwPolling();
  state.view = "apps"; state.cat = null; render();
});
document.getElementById("nav-configs").addEventListener("click", () => {
  stopHwPolling();
  state.view = "configs"; state.cat = null; render();
});
document.getElementById("nav-services").addEventListener("click", () => {
  stopHwPolling();
  state.view = "services"; state.cat = null; state.search = ""; render();
  if (!servicesLoaded) loadServices();
});
document.getElementById("nav-startup").addEventListener("click", () => {
  stopHwPolling();
  state.view = "startup"; state.cat = null; state.search = ""; render();
  if (!startupLoaded) loadStartup();
});
document.getElementById("nav-hardware").addEventListener("click", () => {
  state.view = "hardware"; state.cat = null; state.search = ""; render();
  startHwPolling();
});

document.querySelectorAll("[data-cat]").forEach(el => {
  el.addEventListener("click", () => {
    stopHwPolling();
    const cat = el.dataset.cat;
    state.cat  = state.cat === cat ? null : cat;
    state.view = "apps";
    render();
  });
});

document.getElementById("search").addEventListener("input", e => {
  state.search = e.target.value.toLowerCase().trim();
  render();
});

// ── ADD APP DIALOG ────────────────────────────────────────────────────────────

document.getElementById("btn-add").addEventListener("click", () => {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal add-app-modal" role="dialog" aria-modal="true" aria-labelledby="add-app-title">
      <div class="modal-title" id="add-app-title"><i class="ti ti-puzzle"></i> Add Custom App</div>
      <form id="add-app-form" class="add-app-form">
        <div class="add-app-field">
          <label>Name</label>
          <input type="text" name="name" required placeholder="e.g. Flow Launcher" />
        </div>
        <div class="add-app-field">
          <label>Description</label>
          <input type="text" name="desc" required placeholder="Short description" />
        </div>
        <div class="add-app-field">
          <label>Category</label>
          <select name="cat">
            ${Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}
          </select>
        </div>
        <div class="add-app-field">
          <label>Download URL</label>
          <input type="url" name="dl" required placeholder="https://…" />
        </div>
        <div class="add-app-field">
          <label>GitHub repo <span class="add-app-opt">(optional)</span></label>
          <input type="text" name="gh" placeholder="owner/repo" />
        </div>
        <div class="add-app-field">
          <label>Source URL <span class="add-app-opt">(optional)</span></label>
          <input type="url" name="src" placeholder="https://…" />
        </div>
      </form>
      <div class="modal-actions">
        <button type="button" class="modal-btn cancel" id="add-app-cancel">Cancel</button>
        <button type="submit" form="add-app-form" class="modal-btn modal-btn-ok">Add App</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const form      = overlay.querySelector("#add-app-form");
  const cancelBtn = overlay.querySelector("#add-app-cancel");
  const close     = () => { overlay.remove(); };

  cancelBtn.onclick = close;
  overlay.onclick   = e => { if (e.target === overlay) close(); };
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc, true); }
  }, true);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (!d.src) d.src = d.gh ? `https://github.com/${d.gh}` : d.dl;
    const cat = CATS[d.cat] || CATS.wm;
    const app = {
      id:        `custom-${Date.now()}`,
      name:      d.name.trim(),
      cat:       d.cat,
      icon:      cat.icon,
      iconClass: `icon-${d.cat}`,
      tagClass:  `tag-${d.cat}`,
      tagLabel:  cat.label,
      desc:      d.desc.trim(),
      dl:        d.dl,
      src:       d.src,
      gh:        d.gh.trim() || null,
    };
    APPS.push(app);
    const stored = JSON.parse(localStorage.getItem("hearth.customApps") || "[]");
    stored.push(app);
    localStorage.setItem("hearth.customApps", JSON.stringify(stored));
    close();
    state.view = "apps"; state.cat = null;
    render();
    toast(`${app.name} added.`, "ok");
  });

  overlay.querySelector("[name='name']")?.focus();
});

// ── AUTO-INSTALL ─────────────────────────────────────────────────────────────

async function handleFontInstall(btn, appId, url) {
  try {
    installState[appId] = { state: "downloading" };
    updateInstallBtn(btn, appId);
    await invoke("download_and_install_font", { appId, url });
  } catch (e) {
    const errStr = String(e);
    // "cancelled" — Rust already emitted the cancelled event; let it handle the UI
    if (errStr.includes("cancelled")) return;
    // For events Rust already emitted (error mid-download), don't override
    const current = installState[appId]?.state;
    if (current === "done" || current === "cancelled" || current === "error") return;
    // Pre-flight failure: no event was emitted yet
    console.error("[Hearth] font install:", errStr);
    installState[appId] = { state: "error" };
    updateInstallBtn(document.querySelector(`[data-install-id="${appId}"]`), appId);
    setTimeout(() => {
      delete installState[appId];
      updateInstallBtn(document.querySelector(`[data-install-id="${appId}"]`), appId);
    }, 3000);
  }
}

async function handleExtractInstall(btn, appId, gh, assetMatch) {
  try {
    installState[appId] = { state: "fetching" };
    updateInstallBtn(btn, appId);
    const url = await invoke("get_github_asset_url", { repo: gh, assetMatch: assetMatch || null });
    await invoke("download_and_extract_lhm", { appId, url });
  } catch (e) {
    const errStr = String(e);
    if (errStr.includes("cancelled")) return;
    const current = installState[appId]?.state;
    if (current === "done" || current === "cancelled" || current === "error") return;
    console.error("[Hearth] extract install:", errStr);
    installState[appId] = { state: "error" };
    updateInstallBtn(document.querySelector(`[data-install-id="${appId}"]`), appId);
    setTimeout(() => {
      delete installState[appId];
      updateInstallBtn(document.querySelector(`[data-install-id="${appId}"]`), appId);
    }, 3000);
  }
}

async function handleAutoInstall(btn, appId, gh, dlUrl, flags) {
  try {
    installState[appId] = { state: "fetching" };
    updateInstallBtn(btn, appId);

    const assetMatch = APPS.find(a => a.id === appId)?.assetMatch ?? null;
    const url = await invoke("get_github_asset_url", { repo: gh, assetMatch });
    await invoke("download_and_install", { appId, url, flags });
  } catch (e) {
    const errStr = String(e);
    if (errStr.includes("cancelled")) return;
    const current = installState[appId]?.state;
    if (current === "done" || current === "cancelled" || current === "error") return;
    console.error("[Hearth] install:", errStr);
    installState[appId] = { state: "error" };
    updateInstallBtn(document.querySelector(`[data-install-id="${appId}"]`), appId);
    setTimeout(() => {
      delete installState[appId];
      updateInstallBtn(document.querySelector(`[data-install-id="${appId}"]`), appId);
    }, 3000);
  }
}

// Listen for install progress events from Rust
listen("install-progress", ({ payload }) => {
  installState[payload.id] = {
    state: payload.state,
    pct:   payload.pct,
    step:  payload.step,
    total: payload.total,
    msg:   payload.msg,
  };
  const btn = document.querySelector(`[data-install-id="${payload.id}"]`);
  updateInstallBtn(btn, payload.id);

  const clearAfter = (ms) => setTimeout(() => {
    delete installState[payload.id];
    const b = document.querySelector(`[data-install-id="${payload.id}"]`);
    if (b) b.dataset.installerState = "";
    updateInstallBtn(b, payload.id);
  }, ms);

  if (payload.state === "done")      { clearAfter(3000); refreshAppVersion(payload.id); }
  if (payload.state === "cancelled") clearAfter(1500);
  if (payload.state === "error")     clearAfter(4000);
}).catch(() => {});

// Re-check a single app's installed/latest version after it finishes installing,
// so the badge and button stop showing stale pre-install data.
async function refreshAppVersion(appId) {
  // Give the installer a moment to finish writing its uninstall/registry entries.
  await new Promise(r => setTimeout(r, 1500));
  try {
    installedVersions[appId] = await invoke("check_app_installed", { appId });
  } catch { /* keep previous value */ }
  const app = APPS.find(a => a.id === appId);
  if (app?.gh) {
    try { latestVersions[appId] = await invoke("get_latest_version", { repo: app.gh }); } catch {}
  }
  if (state.view === "apps") renderContent();
}

// ── VERSION DETECTION ─────────────────────────────────────────────────────────

function updateNavBadge() {
  const updateCount = APPS.filter(a => versionGt(latestVersions[a.id], installedVersions[a.id])).length;
  const badge = document.querySelector("#nav-all .nav-badge");
  if (!badge) return;
  if (updateCount > 0) {
    badge.textContent = `${updateCount} ↑`;
    badge.classList.add("badge-update");
  } else {
    badge.textContent = APPS.length;
    badge.classList.remove("badge-update");
  }
}

async function loadVersionInfo() {
  // Check installed status (local registry/filesystem — all concurrent, fast)
  await Promise.all(APPS.map(async app => {
    try {
      installedVersions[app.id] = await invoke("check_app_installed", { appId: app.id });
    } catch {
      installedVersions[app.id] = null;
    }
  }));
  if (state.view === "apps") renderContent();
  updateNavBadge();

  // Fetch latest GitHub versions concurrently; re-render as each arrives
  APPS.filter(a => a.gh).forEach(async app => {
    try {
      latestVersions[app.id] = await invoke("get_latest_version", { repo: app.gh });
    } catch {
      latestVersions[app.id] = null;
    }
    if (state.view === "apps") renderContent();
    updateNavBadge();
  });
}

// ── SERVICES & STARTUP ────────────────────────────────────────────────────────

let servicesLoaded = false;
let startupLoaded  = false;

function toast(msg, kind = "info") {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  // Errors should interrupt; routine updates can wait their turn.
  host.setAttribute("aria-live", kind === "error" ? "assertive" : "polite");
  const el = document.createElement("div");
  el.className = `toast toast-${kind}`;
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 250); }, 3800);
}

// Trigger a one-time elevation if needed. Returns true if already elevated.
async function ensureAdmin() {
  if (state.elevated) return true;
  try { await invoke("relaunch_as_admin"); } catch (e) { toast(`Couldn't elevate: ${e}`, "error"); }
  return false;
}

function elevationBanner() {
  if (state.elevated) return "";
  return `
    <div class="elev-banner">
      <i class="ti ti-shield-lock"></i>
      <div class="elev-text">
        <strong>Administrator required</strong>
        <span>Viewing is fine, but changing services or startup entries needs admin rights.</span>
      </div>
      <button class="elev-btn" id="btn-elevate"><i class="ti ti-shield-check"></i> Run as Admin</button>
    </div>`;
}

function bindElevateBtn() {
  document.getElementById("btn-elevate")?.addEventListener("click", () => ensureAdmin());
}

function toggleSwitch(kind, key, checked, busy, label) {
  const action = checked ? "Turn off" : "Turn on";
  const aria = label ? `${action} ${label}` : action;
  return `<button class="tswitch ${checked ? "on" : "off"}${busy ? " busy" : ""}"
    data-toggle="${kind}" data-key="${encodeURIComponent(key)}" ${busy ? "disabled" : ""}
    role="switch" aria-checked="${checked}" aria-label="${escapeHtml(aria)}" title="${action}">
    ${busy ? `<i class="ti ti-loader-2 spin" aria-hidden="true"></i>` : `<span class="tswitch-knob"></span>`}
  </button>`;
}

function bindStartupToggles(content) {
  content.querySelectorAll("[data-toggle='startup']").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = decodeURIComponent(btn.dataset.key);
      const it = startupItems.find(i => i.id === id);
      if (it) toggleStartup(id, !it.enabled);
    });
  });
}

// Lightweight in-app confirmation (Tauri blocks native window.confirm).
// Accessible: dialog semantics, focus moves in and is restored, Escape cancels,
// Tab is trapped between the two buttons.
function confirmDialog(title, message, { confirmLabel = "Confirm", confirmClass = "danger", icon = "ti-alert-triangle" } = {}) {
  return new Promise(resolve => {
    const prevFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-t" aria-describedby="modal-m">
        <div class="modal-title" id="modal-t"><i class="ti ${escapeHtml(icon)}" aria-hidden="true"></i> ${escapeHtml(title)}</div>
        <div class="modal-msg" id="modal-m">${escapeHtml(message)}</div>
        <div class="modal-actions">
          <button class="modal-btn cancel">Cancel</button>
          <button class="modal-btn ${escapeHtml(confirmClass)}" data-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector(".cancel");
    const dangerBtn = overlay.querySelector("[data-confirm]");
    const done = v => {
      document.removeEventListener("keydown", onKey, true);
      overlay.remove();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(v);
    };
    const onKey = e => {
      if (e.key === "Escape") { e.preventDefault(); done(false); }
      else if (e.key === "Tab") {        // trap focus between the two buttons
        e.preventDefault();
        (document.activeElement === cancelBtn ? dangerBtn : cancelBtn).focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    cancelBtn.onclick = () => done(false);
    dangerBtn.onclick = () => done(true);
    overlay.onclick = e => { if (e.target === overlay) done(false); };
    cancelBtn.focus(); // default to the safe choice
  });
}

function emptyRow(text) {
  return `<div class="empty-row">${text}</div>`;
}

// ── Services ──

function isSystemService(s) {
  const name = (s.Name || "").toLowerCase();
  if (CRITICAL_SERVICES.has(name)) return true;
  const path = (s.PathName || "").toLowerCase();
  return path.includes("\\windows\\system32\\")
      || path.includes("\\windows\\syswow64\\")
      || path.includes("\\windows\\servicing\\")
      || path.includes("svchost.exe");
}

// Normalise Win32_Service StartMode to one of: auto | manual | disabled.
function currentMode(s) {
  const m = (s?.StartMode || "").toLowerCase();
  if (m === "disabled") return "disabled";
  if (m === "manual")   return "manual";
  return "auto"; // Auto / Boot / System
}

function serviceModeControl(s) {
  if (svcBusy[s.Name]) {
    return `<div class="seg-group"><span class="seg-busy"><i class="ti ti-loader-2 spin" aria-hidden="true"></i></span></div>`;
  }
  const cur  = currentMode(s);
  const key  = encodeURIComponent(s.Name);
  const name = escapeHtml(s.DisplayName || s.Name);
  const seg = (val, label) =>
    `<button class="seg${cur === val ? " active" : ""}${val === "disabled" ? " off" : ""}" data-svcmode="${val}" data-svc="${key}" aria-pressed="${cur === val}" aria-label="Set ${name} startup to ${label}">${label}</button>`;
  return `<div class="seg-group" role="group" aria-label="Startup type for ${name}">${seg("auto", "Auto")}${seg("manual", "Manual")}${seg("disabled", "Off")}</div>`;
}

function serviceRow(s) {
  const running = (s.State || "").toLowerCase() === "running";
  const sys     = isSystemService(s);
  return `
    <div class="svc-row${running ? " is-on" : ""}${sys ? " is-system" : ""}">
      <div class="svc-info">
        <div class="svc-name">${escapeHtml(s.DisplayName || s.Name)}${sys ? ` <span class="sys-tag">system</span>` : ""}</div>
        <div class="svc-sub">${escapeHtml(s.Name)} · <span class="svc-state ${running ? "run" : "stop"}">${running ? "Running" : "Stopped"}</span> · ${escapeHtml(s.StartMode || "")}</div>
      </div>
      ${serviceModeControl(s)}
    </div>`;
}

function renderServices(content) {
  const q = state.search;
  let list = services;
  if (state.hideSystem) list = list.filter(s => !isSystemService(s));
  if (q) list = list.filter(s =>
    (s.DisplayName || "").toLowerCase().includes(q) || (s.Name || "").toLowerCase().includes(q));

  content.innerHTML = `
    ${elevationBanner()}
    <div class="section-header">
      <span class="section-title">Services</span>
      <div class="section-line"></div>
      <button class="toggle-pill ${state.hideSystem ? "on" : ""}" id="btn-hide-system">
        <i class="ti ti-${state.hideSystem ? "eye-off" : "eye"}"></i>
        ${state.hideSystem ? "System services hidden" : "Showing all"}
      </button>
      <button class="btn-refresh" id="btn-refresh-svc" title="Refresh"><i class="ti ti-refresh"></i></button>
    </div>
    ${!servicesLoaded
      ? `<div class="loading-row"><i class="ti ti-loader-2 spin"></i> Loading services…</div>`
      : `<div class="svc-meta">${list.length} of ${services.length} services</div>
         <div class="svc-list">${list.map(serviceRow).join("") || emptyRow("No services match.")}</div>`}
  `;

  document.getElementById("btn-hide-system")?.addEventListener("click", () => {
    state.hideSystem = !state.hideSystem; renderContent();
  });
  document.getElementById("btn-refresh-svc")?.addEventListener("click", () => { servicesLoaded = false; loadServices(); });
  content.querySelectorAll("[data-svcmode]").forEach(btn => {
    btn.addEventListener("click", () =>
      setServiceMode(decodeURIComponent(btn.dataset.svc), btn.dataset.svcmode));
  });
  bindElevateBtn();
}

async function loadServices() {
  try {
    const data = await invoke("list_services");
    services = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("list_services:", e);
    toast(`Failed to load services: ${e}`, "error");
  }
  servicesLoaded = true;
  svcBusy = {};
  if (state.view === "services") renderContent();
}

async function setServiceMode(name, mode) {
  if (svcBusy[name]) return;                      // ignore double-fire while in flight
  const svc = services.find(s => s.Name === name);
  if (svc && currentMode(svc) === mode) return; // already in that state

  // Guard against disabling a critical/system service.
  if (mode === "disabled" && svc && isSystemService(svc)) {
    const ok = await confirmDialog(
      "Disable system service?",
      `"${svc.DisplayName || name}" is a core Windows/system service. Disabling it stops it now (along with any services that depend on it) and prevents it starting at boot, which can make Windows unstable. Disable it anyway?`,
      { confirmLabel: "Disable" }
    );
    if (!ok) return;
  }

  if (!(await ensureAdmin())) return;
  svcBusy[name] = true; renderContent();
  try {
    await invoke("set_service_mode", { name, mode });
    const label = mode === "auto" ? "Automatic & started" : mode === "manual" ? "Manual" : "Disabled & stopped";
    toast(`${svc?.DisplayName || name}: ${label}`, "ok");
  } catch (e) {
    toast(`Service change failed: ${e}`, "error");
  }
  await loadServices();   // re-reads state and clears svcBusy
}

// ── Startup ──

function startupNeedsAdmin(id) {
  return id.startsWith("run-hklm") || id.startsWith("folder-common");
}

function startupRow(i) {
  const busy = !!startupBusy[i.id];
  // A record with no command is a leftover approval entry (the app removed its
  // launch value). Re-enabling only flips the flag — nothing will actually run,
  // same as Task Manager. Flag it so it isn't mistaken for a working entry.
  const detail = i.command
    ? ` · <span class="svc-cmd">${escapeHtml(i.command)}</span>`
    : ` · <span class="svc-cmd ghost">no launch command</span>`;
  const titleAttr = i.command ? "" : ` title="No launch command — enabling won't start anything (the app removed its startup entry)."`;
  return `
    <div class="svc-row${i.enabled ? " is-on" : ""}"${titleAttr}>
      <div class="svc-info">
        <div class="svc-name">${escapeHtml(i.name)}</div>
        <div class="svc-sub">${escapeHtml(i.location)}${detail}</div>
      </div>
      ${toggleSwitch("startup", i.id, i.enabled, busy, i.name)}
    </div>`;
}

function renderStartup(content) {
  const q = state.search;
  let list = startupItems;
  if (q) list = list.filter(i =>
    (i.name || "").toLowerCase().includes(q) || (i.command || "").toLowerCase().includes(q));

  content.innerHTML = `
    ${elevationBanner()}
    <div class="section-header">
      <span class="section-title">Startup Apps</span>
      <div class="section-line"></div>
      <button class="btn-refresh" id="btn-refresh-startup" title="Refresh"><i class="ti ti-refresh"></i></button>
    </div>
    ${!startupLoaded
      ? `<div class="loading-row"><i class="ti ti-loader-2 spin"></i> Loading startup apps…</div>`
      : `<div class="svc-list">${list.map(startupRow).join("") || emptyRow("No startup apps found.")}</div>`}
  `;

  document.getElementById("btn-refresh-startup")?.addEventListener("click", () => { startupLoaded = false; loadStartup(); });
  bindElevateBtn();
  bindStartupToggles(content);
}

async function loadStartup() {
  try {
    const data = await invoke("list_startup");
    startupItems = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("list_startup:", e);
    toast(`Failed to load startup apps: ${e}`, "error");
  }
  startupLoaded = true;
  startupBusy = {};
  if (state.view === "startup") renderContent();
}

async function toggleStartup(id, enable) {
  if (startupBusy[id]) return;                    // ignore double-fire while in flight
  if (startupNeedsAdmin(id) && !(await ensureAdmin())) return;
  startupBusy[id] = true; renderContent();
  try {
    await invoke("set_startup", { id, enabled: enable });
    const it = startupItems.find(x => x.id === id);
    if (it) it.enabled = enable;
  } catch (e) {
    toast(`Startup change failed: ${e}`, "error");
  }
  delete startupBusy[id];
  renderContent();
}

// ── INIT ──────────────────────────────────────────────────────────────────────

render();
loadVersionInfo();

// Detect elevation so the views can show the right banner / behaviour.
invoke("is_elevated")
  .then(v => {
    state.elevated = !!v;
    if (state.view === "services" || state.view === "startup") renderContent();
  })
  .catch(() => {});
