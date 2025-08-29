import React, { useState, useRef, useEffect } from 'react';
import { Save, Copy, Download, Edit3, FileText, Code, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface TranscriptionEditorProps {
  transcription: string;
  isLoading?: boolean;
  processingTime?: number;
  onSave?: (text: string) => void;
  className?: string;
}

export const TranscriptionEditor: React.FC<TranscriptionEditorProps> = ({
  transcription,
  isLoading = false,
  processingTime,
  onSave,
  className
}) => {
  const [text, setText] = useState(transcription);
  const [isEditing, setIsEditing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useSettings();

  useEffect(() => {
    setText(transcription);
  }, [transcription]);

  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
  }, [text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Ajustar altura automaticamente
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onSave?.(text);
  };

  const handleCancel = () => {
    setText(transcription);
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      // Aqui você poderia adicionar uma notificação de sucesso
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
    }
  };

  const handleExport = (format: 'txt' | 'json' | 'srt') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'txt':
        content = text;
        filename = 'transcricao.txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          transcription: text,
          timestamp: new Date().toISOString(),
          wordCount,
          charCount,
          processingTime
        }, null, 2);
        filename = 'transcricao.json';
        mimeType = 'application/json';
        break;
      case 'srt':
        // Simples implementação SRT - na realidade você precisaria de timestamps por segmento
        content = `1\n00:00:00,000 --> 00:00:30,000\n${text}\n\n`;
        filename = 'transcricao.srt';
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-64 border rounded-lg flex items-center justify-center bg-muted/50">
          <div className="text-center space-y-2">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Processando transcrição...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transcription && !text) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-64 border border-dashed rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">A transcrição aparecerá aqui</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{wordCount} palavras</span>
          </div>
          <div className="flex items-center gap-1">
            <Code className="w-4 h-4" />
            <span>{charCount} caracteres</span>
          </div>
          {processingTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{processingTime.toFixed(1)}s</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
          
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="p-1 space-y-1 min-w-32">
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-sm"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-sm"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExport('srt')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-sm"
                >
                  SRT
                </button>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editor de texto */}
      <div className="relative">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-64 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 font-mono text-sm leading-relaxed"
            placeholder="Digite sua transcrição aqui..."
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        ) : (
          <div className="w-full min-h-64 p-4 border rounded-lg bg-muted/30 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {text || (
              <span className="text-muted-foreground italic">
                {t('noTranscriptionAvailable')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
