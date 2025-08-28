import React, { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, CheckCircle, AlertCircle, Clock, HardDrive, Wifi, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  available: boolean;
  file_size?: number;
}

interface DownloadStatus {
  model_name: string;
  status: 'downloading' | 'completed' | 'error' | 'idle';
  progress: number;
  download_speed?: string;
  eta?: string;
  error_message?: string;
}

interface ModelManagerProps {
  onClose: () => void;
  className?: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const ModelManager: React.FC<ModelManagerProps> = ({ onClose, className }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloadStatuses, setDownloadStatuses] = useState<Record<string, DownloadStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch modelos disponíveis
  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setModels(data);
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  // Fetch status de downloads
  const fetchDownloadStatuses = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/downloads/status`);
      if (response.ok) {
        const data = await response.json();
        setDownloadStatuses(data);
      }
    } catch (err) {
      console.error('Erro ao buscar status de downloads:', err);
    }
  }, []);

  // Iniciar download de modelo
  const downloadModel = useCallback(async (modelName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${modelName}/download`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Download iniciado para ${modelName}:`, result);
      
      // Começar a monitorar o progresso
      monitorDownloadProgress(modelName);
      
    } catch (err) {
      console.error(`Erro ao iniciar download de ${modelName}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar download');
    }
  }, []);

  // Monitorar progresso do download
  const monitorDownloadProgress = useCallback((modelName: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/models/${modelName}/download/status`);
        if (response.ok) {
          const status: DownloadStatus = await response.json();
          
          setDownloadStatuses(prev => ({
            ...prev,
            [modelName]: status
          }));
          
          // Parar monitoramento se completou ou erro
          if (status.status === 'completed' || status.status === 'error') {
            clearInterval(interval);
            // Atualizar lista de modelos
            fetchModels();
          }
        }
      } catch (err) {
        console.error(`Erro ao monitorar download de ${modelName}:`, err);
        clearInterval(interval);
      }
    }, 1000);
    
    // Limpar intervalo após 5 minutos para evitar loops infinitos
    setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
  }, [fetchModels]);

  // Remover modelo
  const deleteModel = useCallback(async (modelName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o modelo "${modelName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/models/${modelName}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Modelo ${modelName} removido:`, result);
      
      // Atualizar lista de modelos
      fetchModels();
      
      // Remover status de download
      setDownloadStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[modelName];
        return newStatuses;
      });
      
    } catch (err) {
      console.error(`Erro ao remover modelo ${modelName}:`, err);
      setError(err instanceof Error ? err.message : 'Erro ao remover modelo');
    }
  }, [fetchModels]);

  // Formatar bytes
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Efeitos
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchModels(), fetchDownloadStatuses()]);
      setLoading(false);
    };
    
    initializeData();
  }, [fetchModels, fetchDownloadStatuses]);

  // Monitorar downloads ativos
  useEffect(() => {
    const activeDownloads = Object.entries(downloadStatuses).filter(
      ([_, status]) => status.status === 'downloading'
    );
    
    activeDownloads.forEach(([modelName]) => {
      monitorDownloadProgress(modelName);
    });
  }, [downloadStatuses, monitorDownloadProgress]);

  if (loading) {
    return (
      <div className={cn("p-6 bg-card border border-border rounded-lg shadow-lg", className)}>
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 bg-card border border-border rounded-lg shadow-lg max-w-4xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HardDrive className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Gerenciador de Modelos de IA</h2>
            <p className="text-sm text-muted-foreground">
              Baixe e gerencie modelos Whisper para transcrição
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-destructive text-sm">{error}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2 text-xs"
          >
            Dispensar
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Disponíveis</span>
          </div>
          <span className="text-2xl font-bold">
            {models.filter(m => m.available).length}
          </span>
          <span className="text-sm text-muted-foreground">
            /{models.length} modelos
          </span>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Downloads</span>
          </div>
          <span className="text-2xl font-bold">
            {Object.values(downloadStatuses).filter(s => s.status === 'downloading').length}
          </span>
          <span className="text-sm text-muted-foreground">ativos</span>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Espaço</span>
          </div>
          <span className="text-2xl font-bold">
            {formatBytes(
              models
                .filter(m => m.available && m.file_size)
                .reduce((total, m) => total + (m.file_size || 0), 0)
            )}
          </span>
          <span className="text-sm text-muted-foreground">usados</span>
        </div>
      </div>

      {/* Models list */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Modelos Disponíveis</h3>
        
        <div className="grid gap-4">
          {models.map((model) => {
            const downloadStatus = downloadStatuses[model.name];
            const isDownloading = downloadStatus?.status === 'downloading';
            const hasError = downloadStatus?.status === 'error';
            
            return (
              <div
                key={model.name}
                className={cn(
                  "p-4 border rounded-lg transition-all",
                  model.available && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
                  isDownloading && "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
                  hasError && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
                  !model.available && !isDownloading && !hasError && "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Model info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium capitalize">{model.name}</h4>
                      <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
                        {model.size}
                      </span>
                      
                      {model.available && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Instalado
                          </span>
                        </div>
                      )}
                      
                      {isDownloading && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Baixando...
                          </span>
                        </div>
                      )}
                      
                      {hasError && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Erro
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {model.description}
                    </p>
                    
                    {/* Progress bar for downloading */}
                    {isDownloading && downloadStatus && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Progresso: {downloadStatus.progress.toFixed(1)}%</span>
                          {downloadStatus.download_speed && (
                            <span>Velocidade: {downloadStatus.download_speed}</span>
                          )}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${downloadStatus.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Error message */}
                    {hasError && downloadStatus?.error_message && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded text-xs text-red-800 dark:text-red-200">
                        {downloadStatus.error_message}
                      </div>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!model.available && !isDownloading && (
                      <Button
                        size="sm"
                        onClick={() => downloadModel(model.name)}
                        className="flex items-center gap-2"
                        disabled={isDownloading}
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </Button>
                    )}
                    
                    {model.available && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteModel(model.name)}
                        className="flex items-center gap-2"
                        disabled={isDownloading}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </Button>
                    )}
                    
                    {hasError && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadModel(model.name)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Info footer */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Dicas importantes:</p>
            <ul className="space-y-1 text-xs">
              <li>• Modelos .en são otimizados apenas para inglês</li>
              <li>• Modelos grandes (large, large-v2, large-v3) oferecem melhor qualidade</li>
              <li>• Downloads são salvos em ~/.echo-transcribe/models</li>
              <li>• Você pode usar os modelos offline após o download</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
