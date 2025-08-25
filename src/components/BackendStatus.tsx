import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/tauri';

interface BackendStatusProps {
  onStatusChange?: (isAvailable: boolean) => void;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ onStatusChange }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');

  const checkBackendStatus = async () => {
    setIsChecking(true);
    try {
      const isAvailable = await invoke<boolean>('check_backend_status');
      setBackendStatus(isAvailable ? 'available' : 'unavailable');
      onStatusChange?.(isAvailable);
    } catch (error) {
      console.error('Error checking backend status:', error);
      setBackendStatus('unavailable');
      onStatusChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    // Check status periodically
    const interval = setInterval(checkBackendStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    switch (backendStatus) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking backend...';
    
    switch (backendStatus) {
      case 'available':
        return 'Backend available';
      case 'unavailable':
        return 'Backend unavailable';
      default:
        return 'Backend status unknown';
    }
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'available':
        return 'text-green-600 dark:text-green-400';
      case 'unavailable':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  if (backendStatus === 'available') {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
            Backend Service Required
          </h3>
          <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
            The AI transcription service is not running. You need to start the backend service to transcribe audio files.
          </p>
          
          <div className="flex items-center gap-2 mb-3">
            {getStatusIcon()}
            <span className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={checkBackendStatus}
                disabled={isChecking}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
            
            <details className="text-xs text-orange-700 dark:text-orange-300">
              <summary className="cursor-pointer hover:underline">Manual Setup Instructions</summary>
              <div className="mt-2 space-y-1 pl-4 border-l-2 border-orange-200 dark:border-orange-700">
                <p><strong>Option 1:</strong> Run <code>./start-backend.sh</code> (Linux/macOS) or <code>./start-backend.bat</code> (Windows)</p>
                <p><strong>Option 2:</strong> Run <code>npm run backend</code> in the project directory</p>
                <p><strong>Option 3:</strong> Manually start: <code>cd src-tauri/backend && python main.py</code></p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendStatus;
