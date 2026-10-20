import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface ComingSoonScreenProps {
  title: string;
  titleEn?: string;
  moduleName?: string;
  onBackToDashboard?: () => void;
}

export const ComingSoonScreen: React.FC<ComingSoonScreenProps> = ({
  title,
  titleEn,
  moduleName,
  onBackToDashboard,
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '32px 16px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '20px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0878F9', marginBottom: 16 }}>
        <Clock size={32} />
      </div>

      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 9999, backgroundColor: '#E0F2FE', color: '#0369A1', fontSize: '12px', fontWeight: 700, marginBottom: 12 }}>
        {isEn ? 'SPRINT 1 DEFERRED MODULE' : 'ميزة مؤجلة — Sprint 2'}
      </span>

      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
        {isEn ? (titleEn || title) : title}
      </h2>

      <p style={{ fontSize: '14px', color: '#64748B', maxWidth: 440, lineHeight: '1.6', margin: '0 0 24px 0' }}>
        {isEn
          ? `The ${moduleName || 'module'} is slated for implementation in Sprint 2 according to the approved AgentHub specifications.`
          : `قسم ${moduleName || title} مدرج للتنفيذ الفعلي في دورة العمل القادمة (Sprint 2) وفق وثيقة المتطلبات المعتمدة.`}
      </p>

      {onBackToDashboard && (
        <button
          type="button"
          onClick={onBackToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            backgroundColor: '#0878F9',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            border: 0,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(8, 120, 249, 0.25)',
          }}
        >
          <span>{isEn ? 'Back to Dashboard' : 'العودة للرئيسية'}</span>
          <ArrowRight size={16} style={{ transform: isEn ? 'none' : 'rotate(180deg)' }} />
        </button>
      )}
    </div>
  );
};
