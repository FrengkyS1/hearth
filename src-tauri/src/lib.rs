use tauri::{Emitter, Manager};
use serde_json::Value;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::collections::HashMap;
use winreg::{enums::*, RegKey};

fn is_safe_url(url: &str) -> bool {
    url.starts_with("https://") || url.starts_with("http://")
}

fn is_trusted_download_url(url: &str) -> bool {
    url.starts_with("https://github.com/")
        || url.starts_with("https://objects.githubusercontent.com/")
        || url.starts_with("https://github-releases.githubusercontent.com/")
}

fn sanitize_filename(url: &str) -> String {
    let raw = url
        .split('/')
        .last()
        .and_then(|s| s.split('?').next())
        .filter(|s| !s.is_empty())
        .unwrap_or("hearth_installer.exe");

    let clean: String = raw
        .chars()
        .filter(|c| c.is_alphanumeric() || matches!(c, '.' | '-' | '_'))
        .collect();

    if clean.is_empty() { "hearth_installer.exe".to_string() } else { clean }
}

fn build_client(timeout_secs: u64) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent("Hearth/1.0")
        .timeout(Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| e.to_string())
}

// ── cancel registry ────────────────────────────────────────────────────────────

#[derive(Default)]
struct Downloads(Mutex<HashMap<String, Arc<AtomicBool>>>);

impl Downloads {
    fn register(&self, id: &str) -> Arc<AtomicBool> {
        let flag = Arc::new(AtomicBool::new(false));
        self.0.lock().unwrap().insert(id.to_string(), Arc::clone(&flag));
        flag
    }
    fn cancel(&self, id: &str) {
        if let Some(flag) = self.0.lock().unwrap().get(id) {
            flag.store(true, Ordering::Relaxed);
        }
    }
    fn remove(&self, id: &str) {
        self.0.lock().unwrap().remove(id);
    }
}

// ── stream download ────────────────────────────────────────────────────────────

async fn stream_download(
    app: &tauri::AppHandle,
    app_id: &str,
    response: reqwest::Response,
    cancel: &Arc<AtomicBool>,
) -> Result<Vec<u8>, String> {
    let content_length = response.content_length();
    let mut downloaded: u64 = 0;
    let mut buf: Vec<u8> = Vec::new();
    if let Some(total) = content_length {
        buf.reserve(total as usize);
    }
    let mut last_pct: u8 = 255;
    let mut response = response;

    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        if cancel.load(Ordering::Relaxed) {
            return Err("cancelled".to_string());
        }
        downloaded += chunk.len() as u64;
        buf.extend_from_slice(&chunk);

        if let Some(total) = content_length {
            let pct = ((downloaded * 100) / total).min(100) as u8;
            if pct != last_pct {
                last_pct = pct;
                app.emit("install-progress", serde_json::json!({
                    "id": app_id, "state": "downloading", "pct": pct
                })).ok();
            }
        }
    }
    Ok(buf)
}

// ── helpers ────────────────────────────────────────────────────────────────────

fn emit_final(app: &tauri::AppHandle, app_id: &str, result: &Result<(), String>) {
    let payload = match result {
        Ok(()) => serde_json::json!({ "id": app_id, "state": "done" }),
        Err(e) if e == "cancelled" => serde_json::json!({ "id": app_id, "state": "cancelled" }),
        Err(e) => serde_json::json!({ "id": app_id, "state": "error", "msg": e }),
    };
    app.emit("install-progress", payload).ok();
}

// ── commands ───────────────────────────────────────────────────────────────────

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if !is_safe_url(&url) {
        return Err("Only http/https URLs are allowed".to_string());
    }
    open::that(url).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_github_asset_url(repo: String, asset_match: Option<String>) -> Result<String, String> {
    let client = build_client(30)?;
    let api_url = format!("https://api.github.com/repos/{}/releases/latest", repo);
    let json: Value = client
        .get(&api_url)
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let assets = json["assets"]
        .as_array()
        .ok_or_else(|| "No assets in latest release".to_string())?;

    // Optional per-app filter, e.g. "standalone" to pick GlazeWM without Zebar.
    let match_lc = asset_match.filter(|s| !s.is_empty()).map(|s| s.to_lowercase());

    let url = assets
        .iter()
        .filter(|a| {
            let name = a["name"].as_str().unwrap_or("").to_lowercase();
            (name.ends_with(".exe") || name.ends_with(".msi") || name.ends_with(".zip"))
                && !name.contains("debug")
                && !name.contains("symbol")
                // Skip builds for other CPU architectures (this app ships x64).
                && !name.contains("arm64")
                && !name.contains("aarch64")
                && match_lc.as_ref().map_or(true, |m| name.contains(m.as_str()))
        })
        .max_by_key(|a| {
            let name = a["name"].as_str().unwrap_or("").to_lowercase();
            let mut score = 0i32;
            if name.contains("setup") || name.contains("installer") { score += 4; }
            // Prefer a real .exe installer (supports the silent "/S" flag) over a
            // raw .msi, which has to be driven through msiexec instead.
            if name.ends_with(".exe") { score += 2; }
            if name.ends_with(".zip") { score += 1; }
            if name.contains("x64") || name.contains("x86_64") || name.contains("win64") { score += 1; }
            score
        })
        .and_then(|a| a["browser_download_url"].as_str())
        .ok_or_else(|| "No Windows installer found in latest release".to_string())?
        .to_string();

    Ok(url)
}

#[tauri::command]
fn cancel_download(app_id: String, app: tauri::AppHandle) -> Result<(), String> {
    app.state::<Downloads>().cancel(&app_id);
    Ok(())
}

#[tauri::command]
fn window_minimize(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or_else(|| "window not found".to_string())?
        .minimize()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn window_maximize(app: tauri::AppHandle) -> Result<(), String> {
    let win = app.get_webview_window("main")
        .ok_or_else(|| "window not found".to_string())?;
    if win.is_maximized().map_err(|e| e.to_string())? {
        win.unmaximize().map_err(|e| e.to_string())
    } else {
        win.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn window_close(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or_else(|| "window not found".to_string())?
        .close()
        .map_err(|e| e.to_string())
}

// ── installer launch ─────────────────────────────────────────────────────────

/// Relaunch an installer with elevation via ShellExecute's "runas" verb.
/// `std::process::Command` uses CreateProcess, which cannot show a UAC prompt,
/// so installers manifested as `requireAdministrator` fail with os error 740.
fn run_elevated(path: &std::path::Path, flags: &[String]) -> Result<i32, String> {
    let arg_list = if flags.is_empty() {
        String::new()
    } else {
        let joined = flags
            .iter()
            .map(|f| format!("'{}'", f.replace('\'', "''")))
            .collect::<Vec<_>>()
            .join(",");
        format!(" -ArgumentList {joined}")
    };
    let script = format!(
        "$p = Start-Process -FilePath '{}'{} -Verb RunAs -Wait -PassThru; exit $p.ExitCode",
        path.display().to_string().replace('\'', "''"),
        arg_list,
    );
    let status = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .status()
        .map_err(|e| format!("Elevated launch failed: {e}"))?;
    Ok(status.code().unwrap_or(-1))
}

/// Run a downloaded installer, picking the right launch strategy by file type.
fn launch_installer(path: &std::path::Path, flags: &[String]) -> Result<(), String> {
    let is_msi = path
        .extension()
        .map(|e| e.eq_ignore_ascii_case("msi"))
        .unwrap_or(false);

    let code = if is_msi {
        // An .msi is not an executable — it must run through msiexec, which also
        // self-elevates for per-machine packages. NSIS-style "/S" means nothing to
        // msiexec, so use Windows Installer's own passive switches instead.
        std::process::Command::new("msiexec")
            .arg("/i")
            .arg(path)
            .args(["/passive", "/norestart"])
            .status()
            .map_err(|e| format!("Failed to launch msiexec: {e}"))?
            .code()
            .unwrap_or(-1)
    } else {
        match std::process::Command::new(path).args(flags).status() {
            Ok(status) => status.code().unwrap_or(-1),
            Err(e) if e.raw_os_error() == Some(740) => run_elevated(path, flags)?,
            Err(e) => return Err(format!("Failed to launch installer: {e}")),
        }
    };

    // 0 = success; 3010 = success but a reboot is required (common for MSI).
    match code {
        0 | 3010 => Ok(()),
        // 1602 = user cancelled, 1223 = UAC prompt declined.
        1602 | 1223 => Err("Installation was cancelled".to_string()),
        _ => Err(format!("Installer exited with code {code}")),
    }
}

// ── installer ─────────────────────────────────────────────────────────────────

async fn do_install(
    app: &tauri::AppHandle,
    app_id: &str,
    url: &str,
    flags: &[String],
    cancel: &Arc<AtomicBool>,
) -> Result<(), String> {
    app.emit("install-progress",
        serde_json::json!({ "id": app_id, "state": "downloading", "pct": 0 })).ok();

    let response = build_client(300)?.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    let bytes = stream_download(app, app_id, response, cancel).await?;

    if cancel.load(Ordering::Relaxed) {
        return Err("cancelled".to_string());
    }

    let filename  = sanitize_filename(url);
    let temp_path = std::env::temp_dir().join(&filename);
    tokio::fs::write(&temp_path, &bytes).await.map_err(|e| e.to_string())?;

    app.emit("install-progress",
        serde_json::json!({ "id": app_id, "state": "installing" })).ok();

    let path_clone  = temp_path.clone();
    let flags_clone = flags.to_vec();
    let result = tokio::task::spawn_blocking(move || launch_installer(&path_clone, &flags_clone))
        .await
        .map_err(|e| e.to_string())?;

    tokio::fs::remove_file(&temp_path).await.ok();
    result
}

#[tauri::command]
async fn download_and_install(
    app: tauri::AppHandle,
    app_id: String,
    url: String,
    flags: Vec<String>,
) -> Result<(), String> {
    if !is_trusted_download_url(&url) {
        return Err("Download URL must originate from github.com".to_string());
    }

    let cancel = app.state::<Downloads>().register(&app_id);
    let result = do_install(&app, &app_id, &url, &flags, &cancel).await;
    app.state::<Downloads>().remove(&app_id);
    emit_final(&app, &app_id, &result);
    result
}

// ── font installer ─────────────────────────────────────────────────────────────

fn install_fonts_from_zip(
    data: &[u8],
    app: tauri::AppHandle,
    app_id: &str,
    cancel: &Arc<AtomicBool>,
) -> Result<(), String> {
    use std::io::{Cursor, Read};
    use zip::ZipArchive;
    use std::path::Path;

    let cursor = Cursor::new(data);
    let mut archive = ZipArchive::new(cursor).map_err(|e| format!("ZIP open failed: {}", e))?;

    // Single pass: read all font data into memory before writing anything to disk.
    // This avoids re-seeking the archive a second time (which can fail on some ZIP types).
    struct FontEntry { filename: String, is_otf: bool, data: Vec<u8> }
    let mut fonts: Vec<FontEntry> = Vec::new();

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let raw_name = entry.name().to_string();
        let lower    = raw_name.to_lowercase();

        if !lower.ends_with(".ttf") && !lower.ends_with(".otf") {
            continue;
        }

        let filename = raw_name.rsplit(['/', '\\']).next()
            .filter(|s| !s.is_empty()).unwrap_or(&raw_name).to_string();
        let filename: String = filename.chars()
            .filter(|c| c.is_alphanumeric() || matches!(c, '.' | '-' | '_' | ' '))
            .collect();
        if filename.is_empty() { continue; }

        let mut buf = Vec::new();
        entry.read_to_end(&mut buf).map_err(|e| format!("Read {} failed: {}", filename, e))?;
        fonts.push(FontEntry { filename, is_otf: lower.ends_with(".otf"), data: buf });
    }

    let total = fonts.len() as u32;
    if total == 0 {
        return Err("No .ttf/.otf files found in the ZIP archive".to_string());
    }

    let local_app_data = std::env::var("LOCALAPPDATA")
        .map_err(|_| "LOCALAPPDATA env var not set".to_string())?;
    let fonts_dir = Path::new(&local_app_data)
        .join("Microsoft").join("Windows").join("Fonts");
    std::fs::create_dir_all(&fonts_dir)
        .map_err(|e| format!("Cannot create fonts dir: {}", e))?;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (fonts_key, _) = hkcu
        .create_subkey("SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts")
        .map_err(|e| format!("Registry error: {}", e))?;

    for (idx, font) in fonts.iter().enumerate() {
        if cancel.load(Ordering::Relaxed) {
            return Err("cancelled".to_string());
        }

        let dest = fonts_dir.join(&font.filename);
        std::fs::write(&dest, &font.data)
            .map_err(|e| format!("Write {} failed: {}", font.filename, e))?;

        let ext_label = if font.is_otf { "OpenType" } else { "TrueType" };
        let stem = Path::new(&font.filename).file_stem()
            .and_then(|s| s.to_str()).unwrap_or(&font.filename).to_string();
        fonts_key.set_value(
            &format!("{} ({})", stem, ext_label),
            &dest.to_string_lossy().to_string(),
        ).map_err(|e| format!("Registry write failed: {}", e))?;

        app.emit("install-progress", serde_json::json!({
            "id": app_id,
            "state": "extracting",
            "step": idx as u32 + 1,
            "total": total,
        })).ok();
    }

    Ok(())
}

async fn do_font_install(
    app: &tauri::AppHandle,
    app_id: &str,
    url: &str,
    cancel: &Arc<AtomicBool>,
) -> Result<(), String> {
    app.emit("install-progress",
        serde_json::json!({ "id": app_id, "state": "downloading", "pct": 0 })).ok();

    let response = build_client(300)?.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    let bytes = stream_download(app, app_id, response, cancel).await?;

    if cancel.load(Ordering::Relaxed) {
        return Err("cancelled".to_string());
    }

    let app_clone    = app.clone();
    let app_id_clone = app_id.to_string();
    let cancel_clone = Arc::clone(cancel);
    tokio::task::spawn_blocking(move || {
        install_fonts_from_zip(&bytes, app_clone, &app_id_clone, &cancel_clone)
    })
    .await.map_err(|e| e.to_string())?.map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_and_install_font(
    app: tauri::AppHandle,
    app_id: String,
    url: String,
) -> Result<(), String> {
    if !is_trusted_download_url(&url) {
        return Err("Download URL must originate from github.com".to_string());
    }

    let cancel = app.state::<Downloads>().register(&app_id);
    let result = do_font_install(&app, &app_id, &url, &cancel).await;
    app.state::<Downloads>().remove(&app_id);
    emit_final(&app, &app_id, &result);
    result
}

// ── installed-app detection ───────────────────────────────────────────────────

fn check_nerd_fonts_installed() -> Result<Option<String>, String> {
    let local = std::env::var("LOCALAPPDATA").unwrap_or_default();
    if !local.is_empty() {
        let dir = std::path::Path::new(&local).join("Microsoft").join("Windows").join("Fonts");
        if let Ok(rd) = std::fs::read_dir(&dir) {
            for e in rd.flatten() {
                if e.file_name().to_string_lossy().to_lowercase().starts_with("jetbrainsmono") {
                    return Ok(Some("installed".to_string()));
                }
            }
        }
    }
    let windir = std::env::var("WINDIR").unwrap_or_else(|_| "C:\\Windows".to_string());
    let sys = std::path::Path::new(&windir).join("Fonts");
    if let Ok(rd) = std::fs::read_dir(&sys) {
        for e in rd.flatten() {
            if e.file_name().to_string_lossy().to_lowercase().starts_with("jetbrainsmono") {
                return Ok(Some("installed".to_string()));
            }
        }
    }
    Ok(None)
}

fn scan_uninstall_key(key: &RegKey, names: &[&str]) -> Option<String> {
    for key_name in key.enum_keys().flatten() {
        if let Ok(sub) = key.open_subkey(&key_name) {
            let display: String = sub.get_value("DisplayName").unwrap_or_default();
            let dl = display.to_lowercase();
            if names.iter().any(|n| dl.contains(&n.to_lowercase())) {
                let ver: String = sub.get_value("DisplayVersion").unwrap_or_default();
                return Some(if ver.is_empty() { "installed".to_string() } else { ver });
            }
        }
    }
    None
}

/// Search a hive's Uninstall key in BOTH the 64-bit and 32-bit registry views.
/// The explicit KEY_WOW64_* flags make detection independent of this process's
/// bitness — otherwise WOW64 redirection hides half the entries (32-bit apps
/// like MSI Afterburner / RivaTuner live only under the 32-bit view).
fn find_in_uninstall(hive: RegKey, names: &[&str]) -> Option<String> {
    const UNINST: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";
    for view in [KEY_WOW64_64KEY, KEY_WOW64_32KEY] {
        if let Ok(key) = hive.open_subkey_with_flags(UNINST, KEY_READ | view) {
            if let Some(v) = scan_uninstall_key(&key, names) {
                return Some(v);
            }
        }
    }
    None
}

/// Detect a Microsoft Store (UWP/AppX) package by name. These never appear in
/// the Uninstall registry, so query the packaging API via PowerShell.
fn check_appx_installed(name_match: &str) -> Option<String> {
    let script = format!(
        "(Get-AppxPackage -Name '*{name_match}*' | Select-Object -First 1 -ExpandProperty Version)"
    );
    let ver = run_ps(&script).ok()?.trim().to_string();
    if ver.is_empty() { None } else { Some(ver) }
}

/// Synchronous body of `check_app_installed` (registry scan + optional AppX
/// query). Run off-thread by the command wrapper so the UI never blocks.
fn check_app_installed_sync(app_id: &str) -> Result<Option<String>, String> {
    if app_id == "nerdfonts"            { return check_nerd_fonts_installed(); }
    if app_id == "librehardwaremonitor" {
        let addr: std::net::SocketAddr = "127.0.0.1:8085".parse().unwrap();
        if std::net::TcpStream::connect_timeout(&addr, Duration::from_millis(500)).is_ok() {
            return Ok(Some("installed".to_string()));
        }
        return Ok(find_lhm_exe().map(|_| "installed".to_string()));
    }
    // TranslucentTB ships from the Microsoft Store as a UWP package.
    if app_id == "translucenttb" { return Ok(check_appx_installed("TranslucentTB")); }
    // fastfetch is typically installed via WinGet — detect via PATH lookup.
    if app_id == "fastfetch" {
        let found = std::process::Command::new("where.exe")
            .arg("fastfetch")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);
        return Ok(if found { Some("installed".to_string()) } else { None });
    }

    let names: &[&str] = match app_id {
        "glazewm"     => &["GlazeWM"],
        "yasb"        => &["YASB", "Yet Another Status Bar"],
        "afterburner" => &["MSI Afterburner"],
        "rivatuner"   => &["RivaTuner Statistics Server"],
        "filepilot"   => &["File Pilot", "FilePilot"],
        _             => return Ok(None),
    };
    if let Some(v) = find_in_uninstall(RegKey::predef(HKEY_LOCAL_MACHINE), names) { return Ok(Some(v)); }
    if let Some(v) = find_in_uninstall(RegKey::predef(HKEY_CURRENT_USER),  names) { return Ok(Some(v)); }
    Ok(None)
}

#[tauri::command]
async fn check_app_installed(app_id: String) -> Result<Option<String>, String> {
    tokio::task::spawn_blocking(move || check_app_installed_sync(&app_id))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn get_latest_version(repo: String) -> Result<String, String> {
    let client = build_client(15)?;
    let url = format!("https://api.github.com/repos/{}/releases/latest", repo);
    let json: serde_json::Value = client
        .get(&url).send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;
    json["tag_name"]
        .as_str()
        .map(|s| s.trim_start_matches('v').to_string())
        .ok_or_else(|| "no tag_name".to_string())
}

// ── services & startup (PowerShell-backed) ──────────────────────────────────────

/// Run a PowerShell script with no console window and return stdout (or stderr
/// on failure). Output is forced to UTF-8 so JSON with non-ASCII names is safe.
/// Uses a default 30s timeout to guard against a wedged WMI/PowerShell hang.
fn run_ps(script: &str) -> Result<String, String> {
    run_ps_timeout(script, Duration::from_secs(30))
}

/// `run_ps` with an explicit wall-clock timeout. The child's stdout/stderr are
/// drained on dedicated threads so a full pipe buffer can never deadlock the
/// process while we wait; on timeout the child is killed.
fn run_ps_timeout(script: &str, timeout: Duration) -> Result<String, String> {
    use std::io::Read;
    use std::os::windows::process::CommandExt;
    use std::process::Stdio;
    use std::time::Instant;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    let full = format!("[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;\n{script}");
    let mut child = std::process::Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", &full])
        .creation_flags(CREATE_NO_WINDOW)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let mut out_pipe = child.stdout.take().unwrap();
    let mut err_pipe = child.stderr.take().unwrap();
    let out_reader = std::thread::spawn(move || { let mut b = Vec::new(); out_pipe.read_to_end(&mut b).ok(); b });
    let err_reader = std::thread::spawn(move || { let mut b = Vec::new(); err_pipe.read_to_end(&mut b).ok(); b });

    let start = Instant::now();
    let status = loop {
        match child.try_wait().map_err(|e| e.to_string())? {
            Some(status) => break status,
            None => {
                if start.elapsed() >= timeout {
                    child.kill().ok();
                    let _ = child.wait();
                    let _ = out_reader.join();
                    let _ = err_reader.join();
                    return Err("PowerShell timed out".to_string());
                }
                std::thread::sleep(Duration::from_millis(40));
            }
        }
    };

    let stdout = out_reader.join().unwrap_or_default();
    let stderr = err_reader.join().unwrap_or_default();
    if status.success() {
        Ok(String::from_utf8_lossy(&stdout).to_string())
    } else {
        let err = String::from_utf8_lossy(&stderr).trim().to_string();
        Err(if err.is_empty() {
            format!("PowerShell exited with code {}", status.code().unwrap_or(-1))
        } else {
            err
        })
    }
}

/// Parse PowerShell `ConvertTo-Json` output into a JSON array. A single object
/// (PowerShell drops the array wrapper for one item) is wrapped back into one.
fn ps_json_array(stdout: &str) -> Result<Value, String> {
    let t = stdout.trim();
    if t.is_empty() {
        return Ok(Value::Array(vec![]));
    }
    let v: Value = serde_json::from_str(t).map_err(|e| e.to_string())?;
    Ok(match v {
        Value::Array(_) => v,
        other => Value::Array(vec![other]),
    })
}

#[tauri::command]
async fn is_elevated() -> Result<bool, String> {
    let out = tokio::task::spawn_blocking(|| run_ps(
        "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent())\
         .IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)",
    )).await.map_err(|e| e.to_string())??;
    Ok(out.trim().eq_ignore_ascii_case("true"))
}

/// Guards against firing a second elevation while one is already in flight
/// (e.g. a double click), which would otherwise spawn duplicate instances.
static RELAUNCHING: AtomicBool = AtomicBool::new(false);

/// Relaunch this app elevated (UAC prompt), then exit the current instance.
/// If the user declines UAC, the error propagates and the app keeps running
/// (and the guard is reset so they can retry).
#[tauri::command]
async fn relaunch_as_admin(app: tauri::AppHandle) -> Result<(), String> {
    if RELAUNCHING.swap(true, Ordering::SeqCst) {
        return Ok(()); // already relaunching
    }
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_esc = exe.display().to_string().replace('\'', "''");
    let script = format!("Start-Process -FilePath '{exe_esc}' -Verb RunAs");
    let result = tokio::task::spawn_blocking(move || run_ps(&script))
        .await
        .map_err(|e| e.to_string())?;
    if let Err(e) = result {
        RELAUNCHING.store(false, Ordering::SeqCst); // let the user try again
        return Err(e);
    }
    app.exit(0);
    Ok(())
}

#[tauri::command]
async fn list_services() -> Result<Value, String> {
    let out = tokio::task::spawn_blocking(|| run_ps(
        "Get-CimInstance Win32_Service | \
         Select-Object Name, DisplayName, State, StartMode, PathName | \
         Sort-Object DisplayName | ConvertTo-Json -Compress",
    )).await.map_err(|e| e.to_string())??;
    ps_json_array(&out)
}

/// Set a service's startup type. `mode` is "auto", "manual" or "disabled":
///   auto     → Automatic, and start it now (start failure is non-fatal — the
///              startup type still changed, and some services can't start on demand)
///   manual   → Manual (won't auto-start; running state left as-is)
///   disabled → stop it now and set Disabled
#[tauri::command]
async fn set_service_mode(name: String, mode: String) -> Result<(), String> {
    let safe = name.replace('\'', "''");
    let script = match mode.as_str() {
        "auto" => format!(
            "Set-Service -Name '{safe}' -StartupType Automatic -ErrorAction Stop; \
             Start-Service -Name '{safe}' -ErrorAction SilentlyContinue"
        ),
        "manual" => format!(
            "Set-Service -Name '{safe}' -StartupType Manual -ErrorAction Stop"
        ),
        "disabled" => format!(
            "Stop-Service -Name '{safe}' -Force -ErrorAction SilentlyContinue; \
             Set-Service -Name '{safe}' -StartupType Disabled -ErrorAction Stop"
        ),
        other => return Err(format!("unknown service mode: {other}")),
    };
    let result = tokio::task::spawn_blocking(move || run_ps(&script))
        .await.map_err(|e| e.to_string())?;
    result.map(|_| ()).map_err(|e| friendly_service_error(&e))
}

/// Turn a raw PowerShell/SCM service error into one clear sentence.
fn friendly_service_error(raw: &str) -> String {
    let low = raw.to_lowercase();
    if low.contains("access is denied") || low.contains("permissiondenied") {
        "Access denied. This service is protected by Windows and can't be reconfigured — \
         even as administrator. (Some system and managed services refuse changes by design.)"
            .to_string()
    } else if low.contains("cannot find any service") || low.contains("was not found") {
        "That service no longer exists — try refreshing.".to_string()
    } else if low.contains("dependent services") || low.contains("depend on") {
        "Can't change this service: other running services depend on it.".to_string()
    } else if low.contains("marked for deletion") {
        "This service is being removed by Windows; try again shortly.".to_string()
    } else {
        // Strip PowerShell's "At line:.. char:.." trailer and the leading "Cmd :".
        let head = raw.split("At line:").next().unwrap_or(raw).trim();
        let head = head.splitn(2, " : ").nth(1).unwrap_or(head).trim();
        head.to_string()
    }
}

const STARTUP_LIST_BODY: &str = r#"
$ErrorActionPreference = 'SilentlyContinue'
$items = New-Object System.Collections.ArrayList
# Enabled unless the StartupApproved flag has bit 0 set (disabled). A missing
# record means the item has never been toggled = enabled.
function IsEnabled($approvedPath, $valueName) {
  $v = (Get-ItemProperty -Path $approvedPath -Name $valueName -ErrorAction SilentlyContinue).$valueName
  if ($null -eq $v) { return $true }
  return (($v[0] -band 1) -eq 0)
}

# Run-key locations. We merge the LIVE Run values with the StartupApproved
# records: disabled apps (Discord, Spotify, ...) often have only an approval
# record and no live value, yet Task Manager still lists them — so must we.
$runKeys = @(
  @{ Path='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'; Approved='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'; Loc='HKCU Run'; Src='run-hkcu' },
  @{ Path='HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'; Approved='HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'; Loc='HKLM Run'; Src='run-hklm' },
  @{ Path='HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Run'; Approved='HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run32'; Loc='HKLM Run (32-bit)'; Src='run-hklm32' }
)
foreach ($rk in $runKeys) {
  $cmds = @{}
  $live = Get-ItemProperty -Path $rk.Path -ErrorAction SilentlyContinue
  if ($live) {
    foreach ($p in $live.PSObject.Properties) {
      if ($p.Name -like 'PS*') { continue }
      $cmds[$p.Name] = [string]$p.Value
    }
  }
  # Names = union of live Run values and any StartupApproved records.
  $names = New-Object System.Collections.Generic.HashSet[string]
  foreach ($n in $cmds.Keys) { [void]$names.Add($n) }
  $appr = Get-ItemProperty -Path $rk.Approved -ErrorAction SilentlyContinue
  if ($appr) {
    foreach ($p in $appr.PSObject.Properties) {
      if ($p.Name -like 'PS*') { continue }
      [void]$names.Add($p.Name)
    }
  }
  foreach ($name in $names) {
    $cmd = if ($cmds.ContainsKey($name)) { $cmds[$name] } else { '' }
    $en  = IsEnabled $rk.Approved $name
    [void]$items.Add([pscustomobject]@{ id=($rk.Src+'|'+$name); name=$name; command=$cmd; location=$rk.Loc; enabled=$en })
  }
}

# Startup folders: union of files on disk and any StartupApproved\StartupFolder records.
$folders = @(
  @{ Path=[Environment]::GetFolderPath('Startup'); Approved='HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder'; Loc='Startup folder'; Src='folder-user' },
  @{ Path=[Environment]::GetFolderPath('CommonStartup'); Approved='HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder'; Loc='Startup folder (all users)'; Src='folder-common' }
)
foreach ($f in $folders) {
  $files = @{}
  if (Test-Path $f.Path) {
    Get-ChildItem -Path $f.Path -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in '.lnk','.exe','.bat','.cmd' } | ForEach-Object {
      $files[$_.Name] = $_.FullName
    }
  }
  $names = New-Object System.Collections.Generic.HashSet[string]
  foreach ($n in $files.Keys) { [void]$names.Add($n) }
  $appr = Get-ItemProperty -Path $f.Approved -ErrorAction SilentlyContinue
  if ($appr) {
    foreach ($p in $appr.PSObject.Properties) {
      if ($p.Name -like 'PS*') { continue }
      [void]$names.Add($p.Name)
    }
  }
  foreach ($name in $names) {
    $cmd  = if ($files.ContainsKey($name)) { $files[$name] } else { '' }
    $base = [System.IO.Path]::GetFileNameWithoutExtension($name)
    $en   = IsEnabled $f.Approved $name
    [void]$items.Add([pscustomobject]@{ id=($f.Src+'|'+$name); name=$base; command=$cmd; location=$f.Loc; enabled=$en })
  }
}
ConvertTo-Json -InputObject @($items) -Compress
"#;

#[tauri::command]
async fn list_startup() -> Result<Value, String> {
    let out = tokio::task::spawn_blocking(|| run_ps(STARTUP_LIST_BODY))
        .await.map_err(|e| e.to_string())??;
    ps_json_array(&out)
}

const STARTUP_SET_BODY: &str = r#"
$ErrorActionPreference = 'Stop'
$parts = $Id -split '\|', 2
$src = $parts[0]; $name = $parts[1]
$map = @{
  'run-hkcu'      = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
  'run-hklm'      = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run'
  'run-hklm32'    = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run32'
  'folder-user'   = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder'
  'folder-common' = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder'
}
$key = $map[$src]
if (-not $key) { throw "unknown startup source: $src" }
if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
if ($Enable) { $bytes = [byte[]](2,0,0,0,0,0,0,0,0,0,0,0) } else { $bytes = [byte[]](3,0,0,0,0,0,0,0,0,0,0,0) }
New-ItemProperty -Path $key -Name $name -PropertyType Binary -Value $bytes -Force | Out-Null
"#;

#[tauri::command]
async fn set_startup(id: String, enabled: bool) -> Result<(), String> {
    let id_esc = id.replace('\'', "''");
    let enable = if enabled { "$true" } else { "$false" };
    let script = format!("$Id = '{id_esc}'; $Enable = {enable}\n{STARTUP_SET_BODY}");
    tokio::task::spawn_blocking(move || run_ps(&script))
        .await.map_err(|e| e.to_string())?.map(|_| ())
}

// ── LHM / Hardware Monitor ─────────────────────────────────────────────────────

fn find_lhm_exe() -> Option<std::path::PathBuf> {
    let managed = std::env::var("LOCALAPPDATA").ok().map(|d|
        std::path::PathBuf::from(d).join("Hearth").join("lhm").join("LibreHardwareMonitor.exe")
    );
    if let Some(ref p) = managed { if p.exists() { return managed; } }
    [
        r"C:\Program Files\LibreHardwareMonitor\LibreHardwareMonitor.exe",
        r"C:\LibreHardwareMonitor\LibreHardwareMonitor.exe",
    ].iter().map(std::path::PathBuf::from).find(|p| p.exists())
}

// LHM JSON tree: group nodes carry the Type ("Load", "Data", …) and their
// leaf children may or may not repeat it.  We propagate the parent type down
// so leaves without their own Type field are still typed correctly.
fn collect_sensors<'a>(node: &'a Value, parent_type: &'a str, out: &mut Vec<Value>) {
    let type_str = node.get("Type")
        .and_then(|v| v.as_str())
        .unwrap_or(parent_type);

    if let (Some(text), Some(val)) = (
        node.get("Text").and_then(|v| v.as_str()),
        node.get("Value").and_then(|v| v.as_str()),
    ) {
        // Skip placeholder nodes ("-") and unnamed / type-less roots
        if val != "-" && !val.is_empty() && !type_str.is_empty() {
            let num: f64 = val.chars()
                .take_while(|c| c.is_ascii_digit() || *c == '.' || *c == ',')
                .collect::<String>()
                .replace(',', ".")
                .parse()
                .unwrap_or(0.0);
            out.push(serde_json::json!({ "type": type_str, "name": text, "value": num, "raw": val }));
        }
    }
    if let Some(children) = node.get("Children").and_then(|v| v.as_array()) {
        for child in children { collect_sensors(child, type_str, out); }
    }
}

#[tauri::command]
async fn check_lhm_running() -> bool {
    match build_client(2) {
        Ok(c) => c.get("http://localhost:8085/data.json")
            .send().await
            .map(|r| r.status().is_success())
            .unwrap_or(false),
        Err(_) => false,
    }
}

#[tauri::command]
async fn get_hardware_data() -> Result<Value, String> {
    let client = build_client(3)?;
    let data: Value = client
        .get("http://localhost:8085/data.json")
        .send().await.map_err(|e| format!("LHM not reachable: {e}"))?
        .json().await.map_err(|e| e.to_string())?;
    let mut sensors = Vec::new();
    collect_sensors(&data, "", &mut sensors);
    Ok(Value::Array(sensors))
}

#[tauri::command]
fn start_lhm() -> Result<(), String> {
    let exe = find_lhm_exe()
        .ok_or_else(|| "LibreHardwareMonitor not found. Download it first.".to_string())?;
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    std::process::Command::new(&exe)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| if e.raw_os_error() == Some(740) {
            "LibreHardwareMonitor needs administrator privileges to read hardware sensors.".to_string()
        } else {
            format!("Failed to start LibreHardwareMonitor: {e}")
        })
        .map(|_| ())
}

fn extract_zip_to_dir(
    data: &[u8],
    dest: &std::path::Path,
    app: &tauri::AppHandle,
    app_id: &str,
    cancel: &Arc<AtomicBool>,
) -> Result<(), String> {
    use std::io::{Cursor, Read};
    use zip::ZipArchive;
    let mut archive = ZipArchive::new(Cursor::new(data)).map_err(|e| e.to_string())?;
    let total = archive.len() as u32;
    std::fs::create_dir_all(dest).map_err(|e| format!("Cannot create dir: {e}"))?;
    for i in 0..archive.len() {
        if cancel.load(Ordering::Relaxed) { return Err("cancelled".to_string()); }
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        if entry.name().ends_with('/') { continue; }
        let raw_name = entry.name().to_string();
        let filename = raw_name.rsplit(['/', '\\']).next()
            .filter(|s| !s.is_empty()).unwrap_or(&raw_name);
        let filename: String = filename.chars()
            .filter(|c| c.is_alphanumeric() || matches!(c, '.' | '-' | '_' | ' '))
            .collect();
        if filename.is_empty() { continue; }
        let mut buf = Vec::new();
        entry.read_to_end(&mut buf).map_err(|e| e.to_string())?;
        std::fs::write(dest.join(&filename), &buf)
            .map_err(|e| format!("Write {filename}: {e}"))?;
        app.emit("install-progress", serde_json::json!({
            "id": app_id, "state": "extracting",
            "step": i as u32 + 1, "total": total,
        })).ok();
    }
    Ok(())
}

async fn do_extract_to_dir(
    app: &tauri::AppHandle,
    app_id: &str,
    url: &str,
    dest: std::path::PathBuf,
    cancel: &Arc<AtomicBool>,
) -> Result<(), String> {
    app.emit("install-progress",
        serde_json::json!({ "id": app_id, "state": "downloading", "pct": 0 })).ok();
    let response = build_client(300)?.get(url).send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }
    let bytes = stream_download(app, app_id, response, cancel).await?;
    if cancel.load(Ordering::Relaxed) { return Err("cancelled".to_string()); }
    app.emit("install-progress",
        serde_json::json!({ "id": app_id, "state": "installing" })).ok();
    let (app_c, id_c, cc) = (app.clone(), app_id.to_string(), Arc::clone(cancel));
    tokio::task::spawn_blocking(move || extract_zip_to_dir(&bytes, &dest, &app_c, &id_c, &cc))
        .await.map_err(|e| e.to_string())?
}

#[tauri::command]
async fn download_and_extract_lhm(
    app: tauri::AppHandle,
    app_id: String,
    url: String,
) -> Result<(), String> {
    if !is_trusted_download_url(&url) {
        return Err("Download URL must originate from github.com".to_string());
    }
    let dest = std::path::PathBuf::from(
        std::env::var("LOCALAPPDATA").map_err(|e| e.to_string())?
    ).join("Hearth").join("lhm");
    let cancel = app.state::<Downloads>().register(&app_id);
    let result = do_extract_to_dir(&app, &app_id, &url, dest, &cancel).await;
    app.state::<Downloads>().remove(&app_id);
    emit_final(&app, &app_id, &result);
    result
}

// ── config file write ──────────────────────────────────────────────────────────

#[tauri::command]
async fn write_config_file(path: String, content: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let home = std::env::var("USERPROFILE").unwrap_or_default();
        let expanded = path.replace('~', &home);
        let p = std::path::Path::new(&expanded);
        if p.exists() {
            let bak = format!("{}.hearth.bak", &expanded);
            std::fs::copy(p, &bak).map_err(|e| format!("Backup failed: {}", e))?;
        }
        if let Some(parent) = p.parent() {
            std::fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {}", e))?;
        }
        std::fs::write(p, content).map_err(|e| format!("Write failed: {}", e))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn open_in_explorer(path: String) -> Result<(), String> {
    let home = std::env::var("USERPROFILE").unwrap_or_default();
    let expanded = path.replace('~', &home);
    let p = std::path::Path::new(&expanded);
    let folder = if p.is_file() {
        p.parent().and_then(|d| d.to_str()).unwrap_or("").to_string()
    } else if p.exists() {
        expanded.clone()
    } else {
        p.parent().and_then(|d| d.to_str()).unwrap_or("").to_string()
    };
    // Use cmd start so Windows opens the folder in the user's default file manager
    std::process::Command::new("cmd")
        .args(["/c", "start", "", &folder])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ── entry point ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Downloads::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            open_url,
            get_github_asset_url,
            download_and_install,
            download_and_install_font,
            cancel_download,
            window_minimize,
            window_maximize,
            window_close,
            check_app_installed,
            get_latest_version,
            is_elevated,
            relaunch_as_admin,
            list_services,
            set_service_mode,
            list_startup,
            set_startup,
            check_lhm_running,
            get_hardware_data,
            start_lhm,
            download_and_extract_lhm,
            write_config_file,
            open_in_explorer,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_decorations(false).ok();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
