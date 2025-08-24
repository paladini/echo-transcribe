import { Language } from './i18n';

export type Theme = 'light' | 'dark';

export interface AppSettings {
  theme: Theme;
  language: Language;
}

export const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'en',
};

const SETTINGS_KEY = 'echo-transcribe-settings';

export class SettingsManager {
  private settings: AppSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate settings structure
        return {
          theme: this.isValidTheme(parsed.theme) ? parsed.theme : defaultSettings.theme,
          language: this.isValidLanguage(parsed.language) ? parsed.language : defaultSettings.language,
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    
    return { ...defaultSettings };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  private isValidTheme(theme: any): theme is Theme {
    return theme === 'light' || theme === 'dark';
  }

  private isValidLanguage(language: any): language is Language {
    return language === 'en' || language === 'pt' || language === 'es';
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  setTheme(theme: Theme): void {
    this.settings.theme = theme;
    this.saveSettings();
    this.applyTheme(theme);
  }

  setLanguage(language: Language): void {
    this.settings.language = language;
    this.saveSettings();
  }

  updateSettings(newSettings: Partial<AppSettings>): void {
    if (newSettings.theme && this.isValidTheme(newSettings.theme)) {
      this.settings.theme = newSettings.theme;
      this.applyTheme(newSettings.theme);
    }
    
    if (newSettings.language && this.isValidLanguage(newSettings.language)) {
      this.settings.language = newSettings.language;
    }
    
    this.saveSettings();
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  initializeTheme(): void {
    this.applyTheme(this.settings.theme);
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();
