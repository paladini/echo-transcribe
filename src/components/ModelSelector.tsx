import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Download, Cpu, HardDrive, Info, CheckCircle, Clock, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { ModelManager } from './ModelManager';

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

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onDownloadModel?: (model: string) => void;
  isLoading?: boolean;
  className?: string;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models: propModels,
  selectedModel,
  onModelSelect,
  onDownloadModel,
  isLoading = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>(propModels);
  const [downloadStatuses, setDownloadStatuses] = useState<Record<string, DownloadStatus>>({});
  const { t } = useSettings();

  // Fetch modelos disponíveis
  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`);
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      }
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
      // Usar modelos padrão em caso de erro
      setModels(propModels);
    }
  }, [propModels]);

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
  const handleDownloadModel = useCallback(async (modelName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${modelName}/download`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      // Começar a monitorar o progresso
      monitorDownloadProgress(modelName);
      
      // Chamar callback se fornecido
      if (onDownloadModel) {
        onDownloadModel(modelName);
      }
      
    } catch (err) {
      console.error(`Erro ao iniciar download de ${modelName}:`, err);
      alert(`Erro ao baixar modelo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [onDownloadModel]);

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

  // Efeitos
  useEffect(() => {
    fetchModels();
    fetchDownloadStatuses();
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

  const selectedModelInfo = models.find(m => m.name === selectedModel);

  if (showModelManager) {
    return (
      <ModelManager
        onClose={() => setShowModelManager(false)}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('aiModel')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModelManager(true)}
            className="flex items-center gap-2"
          >
            <MoreHorizontal className="w-4 h-4" />
            Gerenciar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isExpanded ? t('hide') : t('configure')}
          </Button>
        </div>
      </div>

      {/* Modelo atual */}
      {selectedModelInfo && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{selectedModelInfo.name}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {selectedModelInfo.size}
                </span>
                {selectedModelInfo.available ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {t('available')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {t('notDownloaded')}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedModelInfo.description}
              </p>
              
              {/* Progress bar se estiver baixando */}
              {downloadStatuses[selectedModelInfo.name]?.status === 'downloading' && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>Baixando...</span>
                    </div>
                    <span>{downloadStatuses[selectedModelInfo.name].progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadStatuses[selectedModelInfo.name].progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {!selectedModelInfo.available && !downloadStatuses[selectedModelInfo.name]?.status && (
              <Button
                size="sm"
                onClick={() => handleDownloadModel(selectedModelInfo.name)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('download')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Lista expandida de modelos */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid gap-3">
            {models.map((model) => {
              const downloadStatus = downloadStatuses[model.name];
              const isDownloading = downloadStatus?.status === 'downloading';
              const hasError = downloadStatus?.status === 'error';
              
              return (
                <div
                  key={model.name}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all duration-200",
                    selectedModel === model.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    isDownloading && "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                  )}
                  onClick={() => model.available && onModelSelect(model.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{model.name}</span>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                          {model.size}
                        </span>
                        {model.available ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600 dark:text-green-400">
                              {t('available')}
                            </span>
                          </div>
                        ) : isDownloading ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              Baixando...
                            </span>
                          </div>
                        ) : hasError ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs text-red-600 dark:text-red-400">
                              Erro
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              {t('downloadRequired')}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.description}
                      </p>
                      
                      {/* Progress bar para downloads */}
                      {isDownloading && downloadStatus && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progresso: {downloadStatus.progress.toFixed(1)}%</span>
                            {downloadStatus.download_speed && (
                              <span>{downloadStatus.download_speed}</span>
                            )}
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${downloadStatus.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Error message */}
                      {hasError && downloadStatus?.error_message && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {downloadStatus.error_message}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!model.available && !isDownloading && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadModel(model.name);
                          }}
                          disabled={isLoading}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {t('download')}
                        </Button>
                      )}
                      
                      {hasError && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadModel(model.name);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Tentar Novamente
                        </Button>
                      )}
                      
                      {selectedModel === model.name && model.available && (
                        <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Informações adicionais */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t('performanceTips')}
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• <strong>Tiny/Base:</strong> {t('modelStatusTiny')}</li>
                  <li>• <strong>Small:</strong> {t('modelStatusSmall')}</li>
                  <li>• <strong>Medium/Large:</strong> {t('modelStatusMedium')}</li>
                  <li>• <strong>.en:</strong> Modelos otimizados apenas para inglês</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status do sistema */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>{t('localModels')}: {models.filter(m => m.available).length}/{models.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>{t('status')}: {isLoading ? t('processing') : t('ready')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Downloads: {Object.values(downloadStatuses).filter(s => s.status === 'downloading').length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
