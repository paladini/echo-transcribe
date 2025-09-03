// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use std::env;
use std::path::PathBuf;
use tauri::command;

#[command]
fn get_downloads_path() -> Result<String, String> {
    // Tentar obter o caminho da pasta Downloads do usuário
    if let Some(home_dir) = dirs::home_dir() {
        let downloads_path = home_dir.join("Downloads");
        if downloads_path.exists() {
            return Ok(downloads_path.to_string_lossy().to_string());
        }
    }
    
    // Fallback para diferentes sistemas
    #[cfg(target_os = "linux")]
    {
        if let Ok(xdg_downloads) = env::var("XDG_DOWNLOAD_DIR") {
            let path = PathBuf::from(xdg_downloads);
            if path.exists() {
                return Ok(path.to_string_lossy().to_string());
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Some(downloads) = dirs::download_dir() {
            return Ok(downloads.to_string_lossy().to_string());
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        if let Some(downloads) = dirs::download_dir() {
            return Ok(downloads.to_string_lossy().to_string());
        }
    }
    
    Err("Could not determine downloads folder".to_string())
}

#[command]
fn open_downloads_folder() -> Result<String, String> {
    // Obter o caminho da pasta Downloads
    let downloads_path = get_downloads_path()?;
    
    // Abrir a pasta usando comando específico do sistema
    #[cfg(target_os = "linux")]
    {
        let result = Command::new("xdg-open")
            .arg(&downloads_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
        
        match result {
            Ok(status) if status.success() => Ok("Pasta Downloads aberta com sucesso".to_string()),
            _ => {
                // Tentar com nautilus (GNOME)
                let nautilus_result = Command::new("nautilus")
                    .arg(&downloads_path)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .status();
                
                match nautilus_result {
                    Ok(status) if status.success() => Ok("Pasta Downloads aberta com sucesso".to_string()),
                    _ => {
                        // Tentar com dolphin (KDE)
                        let dolphin_result = Command::new("dolphin")
                            .arg(&downloads_path)
                            .stdout(Stdio::null())
                            .stderr(Stdio::null())
                            .status();
                        
                        match dolphin_result {
                            Ok(status) if status.success() => Ok("Pasta Downloads aberta com sucesso".to_string()),
                            _ => Err("Não foi possível abrir o gerenciador de arquivos".to_string())
                        }
                    }
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let result = Command::new("explorer")
            .arg(&downloads_path)
            .status();
        
        match result {
            Ok(status) if status.success() => Ok("Pasta Downloads aberta com sucesso".to_string()),
            _ => Err("Não foi possível abrir o Explorer".to_string())
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let result = Command::new("open")
            .arg(&downloads_path)
            .status();
        
        match result {
            Ok(status) if status.success() => Ok("Pasta Downloads aberta com sucesso".to_string()),
            _ => Err("Não foi possível abrir o Finder".to_string())
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Iniciar o servidor Python em background
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                start_python_server(&app_handle);
            });
            
            // Aguardar o servidor iniciar
            thread::sleep(Duration::from_secs(5));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_downloads_path, open_downloads_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_python_server(_app_handle: &tauri::AppHandle) {
    // Determinar o diretório do executável
    let exe_dir = env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| env::current_dir().unwrap_or_default());
    
    // Tentar diferentes caminhos para o backend
    let possible_backend_paths = vec![
        exe_dir.join("backend"),              // Executável: ./backend/
        exe_dir.join("../backend"),           // Executável: ../backend/
        exe_dir.join("../../backend"),        // Executável: ../../backend/
        exe_dir.join("src-tauri/backend"),    // Dev: src-tauri/backend/
        PathBuf::from("src-tauri/backend"),   // Dev: relativo
        env::current_dir().unwrap_or_default().join("src-tauri/backend"), // Dev: absoluto
    ];
    
    let mut backend_path = None;
    for path in &possible_backend_paths {
        let main_py = path.join("main.py");
        let start_py = path.join("start_backend.py");
        if main_py.exists() || start_py.exists() {
            backend_path = Some(path.clone());
            println!("Found backend at: {:?}", backend_path);
            break;
        }
    }
    
    let backend_dir = match backend_path {
        Some(path) => path,
        None => {
            eprintln!("Backend directory not found! Searched paths:");
            for path in &possible_backend_paths {
                eprintln!("  - {:?}", path);
            }
            return;
        }
    };
    
    println!("Starting Python server from: {:?}", backend_dir);
    
    // Tentar usar o script de inicialização primeiro, depois o main.py diretamente
    let script_files = vec!["start_backend.py", "main.py"];
    let python_commands = vec!["python3", "python"];
    let mut started = false;
    
    for script in script_files {
        let script_path = backend_dir.join(script);
        if !script_path.exists() {
            continue;
        }
        
        for python_cmd in &python_commands {
            println!("Trying to start {} with: {}", script, python_cmd);
            
            let mut child = match Command::new(python_cmd)
                .arg(&script_path)
                .current_dir(&backend_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
            {
                Ok(child) => {
                    println!("Successfully started Python server: {} with {}", script, python_cmd);
                    started = true;
                    child
                }
                Err(e) => {
                    eprintln!("Failed to start {} with {}: {:?}", script, python_cmd, e);
                    continue;
                }
            };
            
            if started {
                // Aguardar o processo em background
                thread::spawn(move || {
                    match child.wait() {
                        Ok(status) => println!("Python server exited with status: {:?}", status),
                        Err(e) => eprintln!("Error waiting for Python server: {:?}", e),
                    }
                });
                return; // Sair da função se conseguiu iniciar
            }
        }
        
        if started {
            break;
        }
    }
    
    if !started {
        eprintln!("Failed to start Python backend with any method!");
        eprintln!("Make sure Python is installed and accessible.");
        eprintln!("Backend directory: {:?}", backend_dir);
        eprintln!("Required files: main.py or start_backend.py");
    }
}
