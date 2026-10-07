import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { Globe, Moon, Shield, Database, Key } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isEn = language === 'en';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.45rem', fontWeight: 800 }}>
          {t('navSettings')}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--ah-text-secondary)' }}>
          {isEn
            ? 'Global system-wide configuration governing the AgentHub platform across all university workspaces.'
            : 'الإعدادات العامة للمنصة على مستوى الجامعة (تطبق على كافة الكليات ومساحات العمل).'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Language & Direction Setting */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="#0066FF" />
                <span>{isEn ? 'Language & Direction (RTL / LTR)' : 'اللغة والاتجاه (RTL / LTR)'}</span>
              </div>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="app_lang"
                  checked={language === 'ar'}
                  onChange={() => setLanguage('ar')}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>العربية (Arabic - RTL)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="app_lang"
                  checked={language === 'en'}
                  onChange={() => setLanguage('en')}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>English (LTR)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Theme Setting */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Moon size={18} color="#0066FF" />
                <span>{isEn ? 'Theme Preference' : 'مظهر الواجهة (Theme)'}</span>
              </div>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="app_theme"
                  checked={theme === 'light'}
                  onChange={() => setTheme('light')}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('themeLight')} (Default)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="app_theme"
                  checked={theme === 'dark'}
                  onChange={() => setTheme('dark')}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t('themeDark')}</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Global LLM API Keys & Provider Integrations */}
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={18} color="#0066FF" />
                <span>{isEn ? 'LLM Provider Credentials' : 'مفاتيح الربط بنماذج الذكاء الاصطناعي'}</span>
              </div>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                label="OpenAI API Key"
                type="password"
                defaultValue="sk-proj-xxxxxxxxxxxxxxxxxxxx"
              />
              <Input
                label="Anthropic Claude API Key"
                type="password"
                defaultValue="sk-ant-xxxxxxxxxxxxxxxxxxxx"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="primary" size="sm">{t('saveChanges')}</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
