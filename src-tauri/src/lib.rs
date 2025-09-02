// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use std::env;
use std::path::PathBuf;

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
        .invoke_handler(tauri::generate_handler![])
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
