import React, { useState } from 'react';
import { WordTimestamps } from './WordTimestamps';
import { Button } from './ui/button';

interface DetailedAnalysisProps {
  timestamps: Array<{
    word: string;
    start: number;
    end: number;
    probability?: number;
  }>;
}

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ timestamps }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-2">
      <Button variant="outline" size="sm" onClick={() => setShow(v => !v)}>
        {show ? 'Ocultar Análise Detalhada' : 'Ver Análise Detalhada'}
      </Button>
      {show && (
        <div className="mt-3">
          <WordTimestamps timestamps={timestamps} />
        </div>
      )}
    </div>
  );
};