import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAgentHubAuth } from '../../context/AuthContext';
import { universityService } from '../../services/apiServices';
import { UniversityDetails } from '../../types';
import {
  Globe,
  Moon,
  Key,
  Landmark,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { role } = useAgentHubAuth();
  const isEn = language === 'en';

  const isSystemAdmin =
    role === 'System Administrator' ||
    role === 'system_administrator' ||
    role === 'system_admin';

  // University Settings State (System Administrator only)
  const [university, setUniversity] = useState<UniversityDetails | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');

  const [isLoadingUniversity, setIsLoadingUniversity] = useState(false);
  const [isSavingUniversity, setIsSavingUniversity] = useState(false);
  const [universityError, setUniversityError] = useState<string | null>(null);
  const [universitySuccess, setUniversitySuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const loadUniversity = async () => {
    if (!isSystemAdmin) return;
    setIsLoadingUniversity(true);
    setUniversityError(null);
    try {
      const data = await universityService.get();
      setUniversity(data);
      setName(data.name || '');
      setCode(data.code || '');
      setContactEmail(data.contact_email || '');
      setContactPhone(data.contact_phone || '');
      setWebsite(data.website || '');
    } catch (err: any) {
      setUniversityError(
        err?.data?.message ||
        err?.message ||
        (isEn ? 'Failed to load university information.' : 'فشل في تحميل بيانات الجامعة من الخادم.')
      );
    } finally {
      setIsLoadingUniversity(false);
    }
  };

  useEffect(() => {
    loadUniversity();
  }, [isSystemAdmin]);

  const handleSaveUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSystemAdmin) return;

    setUniversityError(null);
    setUniversitySuccess(null);
    setValidationErrors({});

    if (!name.trim()) {
      setUniversityError(isEn ? 'University name is required.' : 'اسم الجامعة حقل إلزامي.');
      return;
    }

    try {
      setIsSavingUniversity(true);
      const updated = await universityService.update({
        name: name.trim(),
        code: code.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
      });

      setUniversity(updated);
      setName(updated.name || '');
      setCode(updated.code || '');
      setContactEmail(updated.contact_email || '');
      setContactPhone(updated.contact_phone || '');
      setWebsite(updated.website || '');

      setUniversitySuccess(
        isEn ? 'University settings updated successfully.' : 'تم تحديث بيانات الجامعة بنجاح وحفظها في الخادم.'
      );
      setTimeout(() => setUniversitySuccess(null), 4000);
    } catch (err: any) {
      if (err?.data?.errors) {
        setValidationErrors(err.data.errors);
      }
      setUniversityError(
        err?.data?.message ||
        err?.message ||
        (isEn ? 'Failed to update university settings.' : 'فشل في تحديث بيانات الجامعة.')
      );
    } finally {
      setIsSavingUniversity(false);
    }
  };

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

      {/* SYSTEM ADMINISTRATOR ONLY: University Profile & Identity Card */}
      {isSystemAdmin && (
        <Card>
          <CardHeader
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Landmark size={20} color="#0066FF" />
                <span style={{ fontSize: '16px', fontWeight: 800 }}>
                  {isEn ? 'University Profile & Identity' : 'بيانات وهوية الجامعة المعتمدة'}
                </span>
              </div>
            }
            subtitle={
              isEn
                ? 'Authorized institution profile loaded directly from the server. Changes affect all workspaces in this university.'
                : 'الملف التعريفي الرسمي للجامعة مسترجع مباشرة من الخادم. التعديلات تنطبق على كافة مساحات عمل الجامعة.'
            }
          />
          <CardContent>
            {universitySuccess && (
              <div style={{
                backgroundColor: '#DCFCE7',
                border: '1px solid #86EFAC',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#166534',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <CheckCircle size={18} />
                <span>{universitySuccess}</span>
              </div>
            )}

            {universityError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                padding: '12px 16px',
                color: '#991B1B',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={18} />
                  <span>{universityError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={loadUniversity}>
                  {isEn ? 'Retry' : 'إعادة المحاولة'}
                </Button>
              </div>
            )}

            {isLoadingUniversity ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ah-text-secondary)', fontSize: '13.5px' }}>
                {isEn ? 'Loading authorized university details...' : 'جاري تحميل بيانات الجامعة المعتمدة من الخادم...'}
              </div>
            ) : (
              <form onSubmit={handleSaveUniversity} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <Input
                      label={isEn ? 'University Name (Arabic / Official)' : 'اسم الجامعة (الرسمي)'}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="مثال: جامعة العلوم والتكنولوجيا"
                      required
                    />
                    {validationErrors.name && (
                      <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
                        {validationErrors.name.join(', ')}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input
                      label={isEn ? 'University Code / Identifier' : 'رمز الجامعة (University Code)'}
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="مثال: UST-YE"
                    />
                    {validationErrors.code && (
                      <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
                        {validationErrors.code.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <Input
                      label={isEn ? 'Contact Email' : 'البريد الإلكتروني الرسمي للتواصل'}
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="info@university.edu"
                    />
                    {validationErrors.contact_email && (
                      <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
                        {validationErrors.contact_email.join(', ')}
                      </span>
                    )}
                  </div>

                  <div>
                    <Input
                      label={isEn ? 'Contact Phone' : 'رقم هاتف التواصل'}
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="+967-1-123456"
                    />
                    {validationErrors.contact_phone && (
                      <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
                        {validationErrors.contact_phone.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    label={isEn ? 'Official Website' : 'الموقع الإلكتروني الرسمي'}
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://www.ust.edu"
                  />
                  {validationErrors.website && (
                    <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
                      {validationErrors.website.join(', ')}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button
                    variant="primary"
                    icon={<Save size={16} />}
                    isLoading={isSavingUniversity}
                    type="submit"
                  >
                    {isEn ? 'Save University Changes' : 'حفظ تعديلات الجامعة'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* General Settings Grid */}
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

        {/* Global LLM API Keys & Provider Integrations (System Admin only) */}
        {isSystemAdmin && (
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
                  disabled
                />
                <Input
                  label="Anthropic Claude API Key"
                  type="password"
                  defaultValue="sk-ant-xxxxxxxxxxxxxxxxxxxx"
                  disabled
                />
              </div>
            </CardContent>
            <CardFooter>
              <span style={{ fontSize: '12px', color: 'var(--ah-text-tertiary)' }}>
                {isEn ? 'Environment-configured credentials' : 'المفاتيح مهيأة مسبقاً عبر متغيرات البيئة'}
              </span>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};
