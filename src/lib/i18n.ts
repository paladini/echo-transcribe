// Sistema de internacionalização
export type Language = 'en' | 'pt' | 'es';

export interface Translation {
  [key: string]: string | Translation;
}

export const translations: Record<Language, Translation> = {
  en: {
    // Navigation
    settings: 'Settings',
    back: 'Back',
    
    // Settings page
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeDefaultLight: 'Default light theme',
    themeDefaultDark: 'Dark theme',
    language: 'Language',
    languageEn: 'English',
    languagePt: 'Portuguese',
    languageEs: 'Spanish',
    
    // Main app
    appTitle: 'EchoTranscribe',
    appSubtitle: 'Audio transcription with local AI',
    selectFiles: 'Select Audio Files',
    dragDropFiles: 'Drag and drop audio files here, or click to select',
    startTranscription: 'Start Transcription',
    
    // AI Models
    aiModel: 'AI Model',
    configure: 'Configure',
    available: 'Available',
    notDownloaded: 'Not Downloaded',
    download: 'Download',
    hide: 'Hide',
    performanceTips: 'Performance Tips',
    modelStatusTiny: 'Fast, ideal for testing',
    modelStatusSmall: 'Better quality, medium speed',
    modelStatusMedium: 'High quality, slower',
    localModels: 'Local models',
    status: 'Status',
    processing: 'Processing...',
    ready: 'Ready',
    modelTiny: 'Tiny (Fast)',
    modelBase: 'Base (Balanced)',
    modelSmall: 'Small (Quality)',
    modelMedium: 'Medium (Best)',
    downloadRequired: 'Download required',
    
    // File handling
    supportedFormats: 'Supported formats: MP3, WAV, FLAC, M4A, OGG, WebM',
    maxFiles: 'Maximum 10 files at once',
    fileSize: 'Maximum 500MB per file',
    
    // Progress and status
    transcriptionProgress: 'Transcription Progress',
    transcriptionResults: 'Transcription Results',
    readyToTranscribe: 'Ready to transcribe',
    readyDescription: 'Select an audio file, choose an AI model and click "Start Transcription" to begin.',
    processingFile: 'Processing file',
    of: 'of',
    statusCompleted: 'Completed',
    statusProcessing: 'Processing...',
    statusPending: 'Pending',
    statusError: 'Error',
    
    // Export
    exportTxt: 'Export TXT',
    exportJson: 'Export JSON',
    exportSrt: 'Export SRT',
    copy: 'Copy',
    copySrt: 'Copy SRT',
    copied: 'Copied!',
    copyWithTimestamps: 'Copy as SRT (subtitles with time)',
    noTranscriptionAvailable: 'No transcription available',
    
    // File info
    processingTime: 'Time',
    detectedLanguage: 'Language',
    confidence: 'Confidence',
    
    // Footer
    footerText: 'Audio transcription with local AI',
    footerMade: 'Made with ❤️ using Tauri and React',
    
    // Settings info
    settingsInfo: 'Your settings are automatically saved in the browser and will be kept the next time you open the application.',
    
    // Download notifications
    fileSaved: 'File saved successfully',
    viewFolder: 'View Folder',
    savedTo: 'Saved to',
    downloadLocation: 'Downloads folder',
    errorOpeningFolder: 'Could not open Downloads folder automatically. You can find your files in the system Downloads folder.',
    
    // Model download messages
    modelDownloadFeature: 'Model download feature will be implemented soon.',
    modelDownloadError: 'Error downloading model',
    copyError: 'Error copying text. Try selecting and copying manually.',
    exportEmptyError: 'Error: Empty content to export. Check if transcription was completed.',
    downloadErrorWithClipboard: 'Download error. Content was copied to clipboard.\n\nYou can paste it into a text editor and save as',
    downloadAndCopyError: 'Download and copy error. Copy the text manually from the interface and save as',
    exportError: 'Error exporting file',
    unknownError: 'Unknown error',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    apply: 'Apply',
    success: 'Success',
    error: 'Error',
    files: 'files',
    file: 'file',
  },
  
  pt: {
    // Navigation
    settings: 'Configurações',
    back: 'Voltar',
    
    // Settings page
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeDefaultLight: 'Tema claro padrão',
    themeDefaultDark: 'Tema escuro',
    language: 'Idioma',
    languageEn: 'English',
    languagePt: 'Português',
    languageEs: 'Español',
    
    // Main app
    appTitle: 'EchoTranscribe',
    appSubtitle: 'Transcrição de áudio com IA local',
    selectFiles: 'Selecionar Arquivos de Áudio',
    dragDropFiles: 'Arraste e solte arquivos de áudio aqui, ou clique para selecionar',
    startTranscription: 'Iniciar Transcrição',
    
    // AI Models
    aiModel: 'Modelo de IA',
    configure: 'Configurar',
    available: 'Disponível',
    notDownloaded: 'Não baixado',
    download: 'Baixar',
    hide: 'Ocultar',
    performanceTips: 'Dicas de Performance',
    modelStatusTiny: 'Rápido, ideal para testes',
    modelStatusSmall: 'Melhor qualidade, velocidade média',
    modelStatusMedium: 'Alta qualidade, mais lento',
    localModels: 'Modelos locais',
    status: 'Status',
    processing: 'Processando...',
    ready: 'Pronto',
    modelTiny: 'Tiny (Rápido)',
    modelBase: 'Base (Equilibrado)',
    modelSmall: 'Small (Qualidade)',
    modelMedium: 'Medium (Melhor)',
    downloadRequired: 'Requer download',
    
    // File handling
    supportedFormats: 'Formatos suportados: MP3, WAV, FLAC, M4A, OGG, WebM',
    maxFiles: 'Máximo 10 arquivos por vez',
    fileSize: 'Máximo 500MB por arquivo',
    
    // Progress and status
    transcriptionProgress: 'Progresso da Transcrição',
    transcriptionResults: 'Resultados da Transcrição',
    readyToTranscribe: 'Pronto para transcrever',
    readyDescription: 'Selecione um arquivo de áudio, escolha um modelo de IA e clique em "Iniciar Transcrição" para começar.',
    processingFile: 'Processando arquivo',
    of: 'de',
    statusCompleted: 'Concluído',
    statusProcessing: 'Processando...',
    statusPending: 'Pendente',
    statusError: 'Erro',
    
    // Export
    exportTxt: 'Exportar TXT',
    exportJson: 'Exportar JSON',
    exportSrt: 'Exportar SRT',
    copy: 'Copiar',
    copySrt: 'Copiar SRT',
    copied: 'Copiado!',
    copyWithTimestamps: 'Copiar como SRT (legendas com tempo)',
    noTranscriptionAvailable: 'Nenhuma transcrição disponível',
    
    // File info
    processingTime: 'Tempo',
    detectedLanguage: 'Idioma',
    confidence: 'Confiança',
    
    // Footer
    footerText: 'Transcrição de áudio com IA local',
    footerMade: 'Feito com ❤️ usando Tauri e React',
    
    // Settings info
    settingsInfo: 'Suas configurações são salvas automaticamente no navegador e serão mantidas na próxima vez que você abrir a aplicação.',
    
    // Download notifications
    fileSaved: 'Arquivo salvo com sucesso',
    viewFolder: 'Ver Pasta',
    savedTo: 'Salvo em',
    downloadLocation: 'Pasta Downloads',
    errorOpeningFolder: 'Não foi possível abrir a pasta Downloads automaticamente. Você pode encontrar seus arquivos na pasta Downloads do sistema.',
    
    // Model download messages
    modelDownloadFeature: 'Funcionalidade de download do modelo será implementada em breve.',
    modelDownloadError: 'Erro ao baixar modelo',
    copyError: 'Erro ao copiar texto. Tente selecionar e copiar manualmente.',
    exportEmptyError: 'Erro: Conteúdo vazio para exportar. Verifique se a transcrição foi concluída.',
    downloadErrorWithClipboard: 'Erro no download. O conteúdo foi copiado para a área de transferência.\n\nVocê pode colar em um editor de texto e salvar como',
    downloadAndCopyError: 'Erro no download e na cópia. Copie o texto manualmente da interface e salve como',
    exportError: 'Erro ao exportar arquivo',
    unknownError: 'Erro desconhecido',
    
    // Common
    save: 'Salvar',
    cancel: 'Cancelar',
    apply: 'Aplicar',
    success: 'Sucesso',
    error: 'Erro',
    files: 'arquivos',
    file: 'arquivo',
  },
  
  es: {
    // Navigation
    settings: 'Configuración',
    back: 'Volver',
    
    // Settings page
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeDefaultLight: 'Tema claro predeterminado',
    themeDefaultDark: 'Tema oscuro',
    language: 'Idioma',
    languageEn: 'English',
    languagePt: 'Português',
    languageEs: 'Español',
    
    // Main app
    appTitle: 'EchoTranscribe',
    appSubtitle: 'Transcripción de audio con IA local',
    selectFiles: 'Seleccionar Archivos de Audio',
    dragDropFiles: 'Arrastra y suelta archivos de audio aquí, o haz clic para seleccionar',
    startTranscription: 'Iniciar Transcripción',
    
    // AI Models
    aiModel: 'Modelo de IA',
    configure: 'Configurar',
    available: 'Disponible',
    notDownloaded: 'No descargado',
    download: 'Descargar',
    hide: 'Ocultar',
    performanceTips: 'Consejos de Rendimiento',
    modelStatusTiny: 'Rápido, ideal para pruebas',
    modelStatusSmall: 'Mejor calidad, velocidad media',
    modelStatusMedium: 'Alta calidad, más lento',
    localModels: 'Modelos locales',
    status: 'Estado',
    processing: 'Procesando...',
    ready: 'Listo',
    modelTiny: 'Tiny (Rápido)',
    modelBase: 'Base (Equilibrado)',
    modelSmall: 'Small (Calidad)',
    modelMedium: 'Medium (Mejor)',
    downloadRequired: 'Descarga requerida',
    
    // File handling
    supportedFormats: 'Formatos soportados: MP3, WAV, FLAC, M4A, OGG, WebM',
    maxFiles: 'Máximo 10 archivos a la vez',
    fileSize: 'Máximo 500MB por archivo',
    
    // Progress and status
    transcriptionProgress: 'Progreso de Transcripción',
    transcriptionResults: 'Resultados de Transcripción',
    readyToTranscribe: 'Listo para transcribir',
    readyDescription: 'Selecciona un archivo de audio, elige un modelo de IA y haz clic en "Iniciar Transcripción" para empezar.',
    processingFile: 'Procesando archivo',
    of: 'de',
    statusCompleted: 'Completado',
    statusProcessing: 'Procesando...',
    statusPending: 'Pendiente',
    statusError: 'Error',
    
    // Export
    exportTxt: 'Exportar TXT',
    exportJson: 'Exportar JSON',
    exportSrt: 'Exportar SRT',
    copy: 'Copiar',
    copySrt: 'Copiar SRT',
    copied: '¡Copiado!',
    copyWithTimestamps: 'Copiar como SRT (subtítulos con tiempo)',
    noTranscriptionAvailable: 'No hay transcripción disponible',
    
    // File info
    processingTime: 'Tiempo',
    detectedLanguage: 'Idioma',
    confidence: 'Confianza',
    
    // Footer
    footerText: 'Transcripción de audio con IA local',
    footerMade: 'Hecho con ❤️ usando Tauri y React',
    
    // Settings info
    settingsInfo: 'Tu configuración se guarda automáticamente en el navegador y se mantendrá la próxima vez que abras la aplicación.',
    
    // Download notifications
    fileSaved: 'Archivo guardado con éxito',
    viewFolder: 'Ver Carpeta',
    savedTo: 'Guardado en',
    downloadLocation: 'Carpeta de Descargas',
    errorOpeningFolder: 'No se pudo abrir la carpeta de Descargas automáticamente. Puedes encontrar tus archivos en la carpeta de Descargas del sistema.',
    
    // Model download messages
    modelDownloadFeature: 'La funcionalidad de descarga del modelo se implementará pronto.',
    modelDownloadError: 'Error al descargar modelo',
    copyError: 'Error al copiar texto. Intenta seleccionar y copiar manualmente.',
    exportEmptyError: 'Error: Contenido vacío para exportar. Verifica si la transcripción fue completada.',
    downloadErrorWithClipboard: 'Error en la descarga. El contenido fue copiado al portapapeles.\n\nPuedes pegarlo en un editor de texto y guardar como',
    downloadAndCopyError: 'Error en la descarga y copia. Copia el texto manualmente de la interfaz y guarda como',
    exportError: 'Error al exportar archivo',
    unknownError: 'Error desconocido',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    apply: 'Aplicar',
    success: 'Éxito',
    error: 'Error',
    files: 'archivos',
    file: 'archivo',
  },
};

// Função para obter valor aninhado das traduções
export function getNestedTranslation(obj: Translation, path: string): string {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Retorna a chave se não encontrar
    }
  }
  
  return typeof current === 'string' ? current : path;
}

// Hook para usar traduções
export function useTranslation(language: Language) {
  const t = (key: string): string => {
    return getNestedTranslation(translations[language], key);
  };
  
  return { t };
}
