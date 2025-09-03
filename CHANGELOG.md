# Changelog

All notable changes to EchoTranscribe will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-09-02

### 🎉 New Features
- **Download Notifications**: Added user-friendly notifications showing where files are saved after download
- **View Downloads Folder**: Added "View Folder" button to quickly open the Downloads directory
- **Improved Downloads Path Display**: Shows full path where files are saved in download notifications

### 🐛 Bug Fixes
- **Fixed Downloads Folder Opening**: Resolved issue with ugly error messages when opening Downloads folder
  - Implemented native Rust function for reliable folder opening across platforms
  - Added support for multiple file managers (xdg-open, nautilus, dolphin on Linux)
  - Replaced JavaScript alerts with elegant notification system
- **Fixed Internationalization Issues**: Corrected hardcoded Portuguese messages appearing in other languages
  - Model download messages now properly translated across all supported languages
  - Error messages consistently use selected language (English, Portuguese, Spanish)
  - Copy, export, and download error messages now fully internationalized

### 🔧 Technical Improvements
- **Enhanced Error Handling**: Replaced browser alerts with custom notification system
- **Better Cross-Platform Support**: Improved Downloads folder detection and opening
  - Linux: xdg-open, nautilus, dolphin support
  - Windows: Windows Explorer integration
  - macOS: Finder integration
- **Code Quality**: Removed hardcoded strings and moved to translation system
- **Dependency Management**: Added `dirs` crate for better path handling

### 🌐 Internationalization
- **Complete Translation Coverage**: All user-facing messages now support:
  - 🇺🇸 English
  - 🇧🇷 Portuguese
  - 🇪🇸 Spanish
- **Consistent Language Experience**: No more mixed-language messages

### 📝 User Experience
- **Cleaner Notifications**: Removed technical details (model names) from download messages
- **Better Visual Feedback**: Improved notification styling and positioning
- **Auto-dismiss Notifications**: Error notifications automatically disappear after 5 seconds
- **Accessible UI**: Better contrast and readability for notification messages

### 🔧 Developer Experience
- **Code Organization**: Better separation of concerns for notification handling
- **Error Logging**: Improved error logging for debugging
- **Type Safety**: Enhanced TypeScript types for better development experience

---

## [0.1.0] - 2025-08-30

### 🎉 Initial Release
- **Core Transcription**: Audio file transcription using Whisper AI models
- **Batch Processing**: Support for multiple file transcription
- **Multiple Export Formats**: TXT, SRT, and JSON export options
- **Model Selection**: Choose between different Whisper model sizes
- **Multi-language Support**: Interface in English, Portuguese, and Spanish
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Cross-Platform**: Desktop app built with Tauri framework
- **Local Processing**: All transcription happens locally for privacy
