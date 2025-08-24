import { ArrowLeft, Monitor, Moon, Sun, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { useSettings } from '../contexts/SettingsContext';
import { Theme } from '../lib/settings';
import { Language } from '../lib/i18n';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { settings, setTheme, setLanguage, t } = useSettings();

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
  };

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('settings')}</h1>
        </div>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{t('theme')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={settings.theme === 'light' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('light')}
                className="flex items-center gap-2 justify-start p-4 h-auto"
              >
                <Sun className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">{t('themeLight')}</div>
                  <div className={`text-sm ${settings.theme === 'light' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {t('themeDefaultLight')}
                  </div>
                </div>
              </Button>
              
              <Button
                variant={settings.theme === 'dark' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('dark')}
                className="flex items-center gap-2 justify-start p-4 h-auto"
              >
                <Moon className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">{t('themeDark')}</div>
                  <div className={`text-sm ${settings.theme === 'dark' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {t('themeDefaultDark')}
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Language Settings */}
          <div className="bg-card rounded-lg p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{t('language')}</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant={settings.language === 'en' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('en')}
                className="flex items-center gap-2 justify-start p-4 h-auto"
              >
                <div className="w-6 h-4 bg-gradient-to-r from-blue-500 via-white to-red-500 rounded-sm flex-shrink-0"></div>
                <div className="text-left">
                  <div className="font-medium">{t('languageEn')}</div>
                  <div className={`text-sm ${settings.language === 'en' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    English
                  </div>
                </div>
              </Button>
              
              <Button
                variant={settings.language === 'pt' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('pt')}
                className="flex items-center gap-2 justify-start p-4 h-auto"
              >
                <div className="w-6 h-4 bg-gradient-to-r from-green-500 via-yellow-400 to-blue-500 rounded-sm flex-shrink-0"></div>
                <div className="text-left">
                  <div className="font-medium">{t('languagePt')}</div>
                  <div className={`text-sm ${settings.language === 'pt' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    Português
                  </div>
                </div>
              </Button>
              
              <Button
                variant={settings.language === 'es' ? 'default' : 'outline'}
                onClick={() => handleLanguageChange('es')}
                className="flex items-center gap-2 justify-start p-4 h-auto"
              >
                <div className="w-6 h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-red-600 rounded-sm flex-shrink-0"></div>
                <div className="text-left">
                  <div className="font-medium">{t('languageEs')}</div>
                  <div className={`text-sm ${settings.language === 'es' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    Español
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-medium mb-2">ℹ️ Informações</h3>
            <p className="text-sm text-muted-foreground">
              {t('settingsInfo')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
