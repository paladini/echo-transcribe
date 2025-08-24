import React, { useState } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

interface WordTimestampsProps {
  timestamps: WordTimestamp[];
  className?: string;
}

export const WordTimestamps: React.FC<WordTimestampsProps> = ({
  timestamps,
  className
}) => {
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
  };

  const handleWordClick = (index: number) => {
    setSelectedWord(index);
    // Aqui seria implementada a funcionalidade de reproduzir o áudio no timestamp específico
    console.log(`Reproduzir áudio a partir de ${timestamps[index].start}s`);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Implementar controle de reprodução
  };

  if (!timestamps || timestamps.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timestamps por Palavra
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayback}
          disabled // Desabilitado por enquanto até implementar reprodução
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
        <div className="flex flex-wrap gap-1">
          {timestamps.map((timestamp, index) => (
            <button
              key={index}
              onClick={() => handleWordClick(index)}
              className={cn(
                "inline-block px-2 py-1 text-sm rounded transition-all duration-200",
                "hover:bg-primary/20 hover:scale-105",
                selectedWord === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border"
              )}
              title={`${timestamp.word} (${formatTime(timestamp.start)} - ${formatTime(timestamp.end)})`}
            >
              <span className="font-medium">{timestamp.word}</span>
              <span className="text-xs opacity-70 ml-1">
                {formatTime(timestamp.start)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedWord !== null && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Palavra selecionada:</strong> "{timestamps[selectedWord].word}" 
          <br />
          <strong>Intervalo:</strong> {formatTime(timestamps[selectedWord].start)} - {formatTime(timestamps[selectedWord].end)}
          {timestamps[selectedWord].probability && (
            <>
              <br />
              <strong>Confiança:</strong> {(timestamps[selectedWord].probability! * 100).toFixed(1)}%
            </>
          )}
        </div>
      )}
    </div>
  );
};
