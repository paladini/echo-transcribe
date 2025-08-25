// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Simply log that app started, don't auto-start backend
            println!("EchoTranscribe started. Please ensure backend is running on http://localhost:8000");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![check_backend_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn check_backend_status() -> Result<bool, String> {
    // Check if backend is responding
    match reqwest::get("http://localhost:8000/health").await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}
