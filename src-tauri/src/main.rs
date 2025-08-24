// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Iniciar o servidor Python em background
            let app_handle = app.handle();
            thread::spawn(move || {
                start_python_server();
            });
            
            // Aguardar o servidor iniciar
            thread::sleep(Duration::from_secs(2));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_python_server() {
    let backend_path = "backend";
    
    #[cfg(target_os = "windows")]
    let python_cmd = "python";
    #[cfg(not(target_os = "windows"))]
    let python_cmd = "python3";
    
    let mut child = Command::new(python_cmd)
        .arg("main.py")
        .current_dir(backend_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start Python backend");
    
    // Aguardar o processo terminar
    let _ = child.wait();
}
