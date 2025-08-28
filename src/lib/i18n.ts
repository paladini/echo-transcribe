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
    
    // Model Manager
    modelManager: 'AI Model Manager',
    manageModels: 'Manage models',
    downloadModels: 'Download and manage Whisper models for transcription',
    installedModels: 'Installed',
    activeDownloads: 'Active downloads',
    usedSpace: 'Used space',
    availableModels: 'Available Models',
    downloadProgress: 'Progress',
    downloadSpeed: 'Speed',
    downloading: 'Downloading...',
    downloadError: 'Error',
    tryAgain: 'Try Again',
    remove: 'Remove',
    confirmDelete: 'Are you sure you want to remove the model',
    cannotUndo: 'This action cannot be undone',
    modelRemoved: 'Model removed successfully',
    importantTips: 'Important tips',
    englishOptimized: '.en models are optimized for English only',
    largeModels: 'Large models (large, large-v2, large-v3) offer better quality',
    savedLocation: 'Downloads are saved in ~/.echo-transcribe/models',
    offlineUse: 'You can use models offline after download',
    
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
    
    // Model Manager
    modelManager: 'Gerenciador de Modelos de IA',
    manageModels: 'Gerenciar modelos',
    downloadModels: 'Baixe e gerencie modelos Whisper para transcrição',
    installedModels: 'Instalados',
    activeDownloads: 'Downloads ativos',
    usedSpace: 'Espaço usado',
    availableModels: 'Modelos Disponíveis',
    downloadProgress: 'Progresso',
    downloadSpeed: 'Velocidade',
    downloading: 'Baixando...',
    downloadError: 'Erro',
    tryAgain: 'Tentar Novamente',
    remove: 'Remover',
    confirmDelete: 'Tem certeza que deseja remover o modelo',
    cannotUndo: 'Esta ação não pode ser desfeita',
    modelRemoved: 'Modelo removido com sucesso',
    importantTips: 'Dicas importantes',
    englishOptimized: 'Modelos .en são otimizados apenas para inglês',
    largeModels: 'Modelos grandes (large, large-v2, large-v3) oferecem melhor qualidade',
    savedLocation: 'Downloads são salvos em ~/.echo-transcribe/models',
    offlineUse: 'Você pode usar os modelos offline após o download',
    
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
    
    // Model Manager
    modelManager: 'Gestor de Modelos de IA',
    manageModels: 'Gestionar modelos',
    downloadModels: 'Descarga y gestiona modelos Whisper para transcripción',
    installedModels: 'Instalados',
    activeDownloads: 'Descargas activas',
    usedSpace: 'Espacio usado',
    availableModels: 'Modelos Disponibles',
    downloadProgress: 'Progreso',
    downloadSpeed: 'Velocidad',
    downloading: 'Descargando...',
    downloadError: 'Error',
    tryAgain: 'Intentar de Nuevo',
    remove: 'Eliminar',
    confirmDelete: '¿Estás seguro de que quieres eliminar el modelo',
    cannotUndo: 'Esta acción no se puede deshacer',
    modelRemoved: 'Modelo eliminado correctamente',
    importantTips: 'Consejos importantes',
    englishOptimized: 'Los modelos .en están optimizados solo para inglés',
    largeModels: 'Los modelos grandes (large, large-v2, large-v3) ofrecen mejor calidad',
    savedLocation: 'Las descargas se guardan en ~/.echo-transcribe/models',
    offlineUse: 'Puedes usar los modelos sin conexión después de la descarga',
    
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
