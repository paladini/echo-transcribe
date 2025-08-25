// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;
use std::path::PathBuf;

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Iniciar o servidor Python em background
            thread::spawn(move || {
                start_python_server();
            });
            
            // Aguardar o servidor iniciar
            thread::sleep(Duration::from_secs(3));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_python_server() {
    let backend_path = "backend";
    
    // Usar o comando shell para ativar o ambiente virtual e executar o Python
    let current_dir = std::env::current_dir().expect("Failed to get current directory");
    let project_root = current_dir.parent().unwrap_or(&current_dir);
    
    // Criar comando para ativar o venv e executar o servidor
    let shell_command = format!(
        "cd {} && source .venv/bin/activate && cd src-tauri/backend && python main.py",
        project_root.to_string_lossy()
    );
    
    println!("Starting Python server with command: {}", shell_command);
    println!("Current directory: {:?}", current_dir);
    println!("Project root: {:?}", project_root);
    
    let mut child = Command::new("bash")
        .arg("-c")
        .arg(&shell_command)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap_or_else(|e| {
            eprintln!("Failed to start Python backend: {:?}", e);
            eprintln!("Tried to run: bash -c '{}'", shell_command);
            panic!("Failed to start Python backend: {:?}", e);
        });
    
    // Aguardar o processo terminar
    let _ = child.wait();
}
