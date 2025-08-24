import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileAudio, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface FileDropZoneProps {
  onFilesSelect: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // em bytes
  className?: string;
}

const ACCEPTED_FORMATS = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/flac': ['.flac'],
  'audio/x-flac': ['.flac'],
  'audio/mp4': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/webm': ['.webm'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_FILES = 10;

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelect,
  accept = Object.keys(ACCEPTED_FORMATS).join(','),
  maxSize = MAX_FILE_SIZE,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useSettings();

  const validateFile = useCallback((file: File): string | null => {
    // Verificar tipo de arquivo
    const isValidType = Object.keys(ACCEPTED_FORMATS).includes(file.type) ||
      Object.values(ACCEPTED_FORMATS).flat().some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
    
    if (!isValidType) {
      return `Formato de arquivo não suportado. Formatos aceitos: ${Object.values(ACCEPTED_FORMATS).flat().join(', ')}`;
    }

    // Verificar tamanho
    if (file.size > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${(maxSize / (1024 * 1024)).toFixed(0)}MB`;
    }

    return null;
  }, [maxSize]);

  const handleFiles = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) {
      setSelectedFiles([]);
      return;
    }
    setError(null);
    setSelectedFiles(validFiles.slice(0, MAX_FILES));
    onFilesSelect(validFiles.slice(0, MAX_FILES));
  }, [validateFile, onFilesSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    handleFiles(files);
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isDragOver 
            ? "border-primary bg-primary/5 scale-105" 
            : selectedFiles.length > 0
              ? "border-green-500 bg-green-50 dark:bg-green-950" 
              : error 
                ? "border-destructive bg-destructive/5" 
                : "border-muted-foreground/25"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="Selecionar arquivos de áudio"
        />

        <div className="flex flex-col items-center gap-4 w-full">
          {selectedFiles.length > 0 ? (
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto">
                <FileAudio className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <ul className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <li key={file.name + idx} className="flex items-center justify-between px-3 py-2 rounded bg-green-50 dark:bg-green-950 min-h-[40px]">
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground break-words leading-tight">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="ml-3 p-1 hover:bg-destructive/10 rounded-full transition-colors flex-shrink-0"
                      aria-label="Remover arquivo"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground text-center mt-3 font-medium">{selectedFiles.length} arquivo(s) selecionado(s)</p>
            </div>
          ) : (
            <>
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full transition-colors",
                isDragOver 
                  ? "bg-primary/20" 
                  : error 
                    ? "bg-destructive/20" 
                    : "bg-muted"
              )}>
                {error ? (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                ) : (
                  <Upload className={cn(
                    "w-8 h-8 transition-colors",
                    isDragOver ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragOver 
                    ? "Solte os arquivos aqui" 
                    : t('dragDropFiles')
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('supportedFormats')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('fileSize')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('maxFiles')}
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
