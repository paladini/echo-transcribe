import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, settingsManager, Theme } from '../lib/settings';
import { Language, useTranslation } from '../lib/i18n';

interface SettingsContextType {
  settings: AppSettings;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      return settingsManager.getSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      return { theme: 'light', language: 'en' };
    }
  });
  
  const { t } = useTranslation(settings.language);

  useEffect(() => {
    // Initialize theme on app startup
    try {
      settingsManager.initializeTheme();
    } catch (error) {
      console.error('Error initializing theme:', error);
    }
  }, []);

  const handleSetTheme = (theme: Theme) => {
    settingsManager.setTheme(theme);
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSetLanguage = (language: Language) => {
    settingsManager.setLanguage(language);
    setSettings(prev => ({ ...prev, language }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    settingsManager.updateSettings(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const contextValue: SettingsContextType = {
    settings,
    setTheme: handleSetTheme,
    setLanguage: handleSetLanguage,
    updateSettings: handleUpdateSettings,
    t,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
