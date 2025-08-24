import React, { useState } from 'react';
import { Settings, Download, Cpu, HardDrive, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface ModelInfo {
  name: string;
  size: string;
  description: string;
  available: boolean;
}

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onDownloadModel?: (model: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelSelect,
  onDownloadModel,
  isLoading = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useSettings();

  const selectedModelInfo = models.find(m => m.name === selectedModel);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('aiModel')}</h3>
        </div>
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

      {/* Modelo atual */}
      {selectedModelInfo && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{selectedModelInfo.name}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {selectedModelInfo.size}
                </span>
                {selectedModelInfo.available ? (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
                    {t('available')}
                  </span>
                ) : (
                  <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">
                    {t('notDownloaded')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedModelInfo.description}
              </p>
            </div>
            
            {!selectedModelInfo.available && onDownloadModel && (
                <Button
                size="sm"
                onClick={() => onDownloadModel(selectedModelInfo.name)}
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
            {models.map((model) => (
              <div
                key={model.name}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all duration-200",
                  selectedModel === model.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => onModelSelect(model.name)}
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
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {t('available')}
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
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!model.available && onDownloadModel && (
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadModel(model.name);
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('download')}
                      </Button>
                    )}
                    
                    {selectedModel === model.name && (
                      <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  <li>• <strong>Medium:</strong> {t('modelStatusMedium')}</li>
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
          </div>
        </div>
      )}
    </div>
  );
};
