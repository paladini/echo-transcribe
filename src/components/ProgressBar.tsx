import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'idle' | 'processing' | 'completed' | 'error' | string;
  message?: string;
  showStats?: boolean;
  currentFile?: string;
  totalFiles?: number;
  completedFiles?: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'processing',
  message,
  showStats = true,
  currentFile,
  totalFiles,
  completedFiles,
  className
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Processando...';
      case 'completed':
        return 'Concluído!';
      case 'error':
        return 'Erro no processamento';
      default:
        return 'Aguardando';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-primary';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header com status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={cn("font-medium", getStatusColor())}>
            {message || getStatusText()}
          </span>
        </div>
        
        {showStats && status === 'processing' && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {totalFiles && completedFiles !== undefined && (
              <div className="flex items-center gap-1">
                <span>{completedFiles + 1} de {totalFiles}</span>
              </div>
            )}
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
        )}
        
        {status === 'completed' && (
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            100%
          </span>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="relative">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-full",
              getProgressBarColor()
            )}
            style={{ 
              width: `${Math.min(100, Math.max(0, progress))}%`,
              transition: status === 'processing' ? 'width 0.3s ease-out' : 'width 0.1s ease-out'
            }}
          />
        </div>
        
        {/* Efeito de shimmer durante processamento */}
        {status === 'processing' && (
          <div className="absolute inset-0 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        )}
      </div>

      {/* Mensagem adicional ou arquivo atual */}
      {currentFile && status === 'processing' && (
        <div className="p-2 bg-muted/50 rounded text-sm text-muted-foreground">
          <span className="font-medium">Processando:</span> {currentFile}
        </div>
      )}

      {/* Mensagem adicional ou detalhes */}
      {status === 'error' && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">
            {message || 'Ocorreu um erro durante o processamento. Tente novamente.'}
          </p>
        </div>
      )}

      {status === 'completed' && showStats && (
        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            Transcrição concluída com sucesso!
          </p>
        </div>
      )}
    </div>
  );
};
