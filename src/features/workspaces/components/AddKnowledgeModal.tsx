import React, { useState } from 'react';
import { Modal } from '../../../design-system/components/Modal';
import { Input } from '../../../design-system/components/Input';
import { Button } from '../../../design-system/components/Button';
import { KnowledgeType, KnowledgeSource } from '../../../types';
import { knowledgeService } from '../../../services/apiServices';
import { useTranslation } from '../../../i18n/LanguageContext';
import { UploadCloud, FileText, Globe, HelpCircle, CheckCircle2 } from 'lucide-react';

export interface AddKnowledgeModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onAdded: (source: KnowledgeSource) => void;
}

export const AddKnowledgeModal: React.FC<AddKnowledgeModalProps> = ({
  isOpen,
  workspaceId,
  onClose,
  onAdded,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [title, setTitle] = useState('');
  const [type, setType] = useState<KnowledgeType>('document');
  const [fileName, setFileName] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsProcessing(true);
    const newSource = await knowledgeService.add({
      workspaceId,
      title,
      titleEn: title,
      type,
      status: 'ready',
      documentCount: type === 'document' ? 18 : type === 'faq' ? 45 : 32,
      totalTokens: type === 'document' ? 95000 : 48000,
      sizeFormatted: type === 'document' ? '2.4 MB' : '650 KB',
    });

    setIsProcessing(false);
    onAdded(newSource);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEn ? 'Add Knowledge Source' : 'إضافة مصدر معرفة جديد (RAG)'}
      subtitle={isEn
        ? 'Provide university handbooks, policies, or websites for the agent to reference'
        : 'أرفق اللوائح الأكاديمية أو الأسئلة الشائعة أو موقع الكلية ليستند إليها الوكيل'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button">
            {isEn ? 'Cancel' : 'إلغاء'}
          </Button>
          <Button
            variant="primary"
            isLoading={isProcessing}
            onClick={handleSubmit}
            type="button"
          >
            {isEn ? 'Index & Save' : 'فهرسة وحفظ المصدر'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Source Type Selector */}
        <div className="ah-input-group">
          <label className="ah-input-label">{isEn ? 'Knowledge Type' : 'نوع مصدر المعرفة'}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              className={`ah-btn ${type === 'document' ? 'ah-btn--primary' : 'ah-btn--secondary'} ah-btn--sm`}
              onClick={() => setType('document')}
            >
              <FileText size={16} />
              <span>{isEn ? 'PDF / Word' : 'وثيقة (PDF)'}</span>
            </button>
            <button
              type="button"
              className={`ah-btn ${type === 'faq' ? 'ah-btn--primary' : 'ah-btn--secondary'} ah-btn--sm`}
              onClick={() => setType('faq')}
            >
              <HelpCircle size={16} />
              <span>{isEn ? 'FAQ Base' : 'أسئلة شائعة'}</span>
            </button>
            <button
              type="button"
              className={`ah-btn ${type === 'website' ? 'ah-btn--primary' : 'ah-btn--secondary'} ah-btn--sm`}
              onClick={() => setType('website')}
            >
              <Globe size={16} />
              <span>{isEn ? 'Web Sync' : 'موقع إنترنت'}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <Input
          label={isEn ? 'Source Name' : 'اسم أو عنوان المصدر'}
          placeholder={isEn ? 'e.g. Admission Requirements 2026/2027' : 'مثال: شروط القبول والتسجيل للعام 2026/2027'}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        {/* File upload or website URL */}
        {type === 'document' && (
          <div style={{
            border: '2px dashed var(--ah-border-strong)',
            borderRadius: '12px',
            padding: '24px 16px',
            textAlign: 'center',
            backgroundColor: 'var(--ah-bg-subtle)',
            cursor: 'pointer'
          }}>
            <UploadCloud size={32} color="#0066FF" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600 }}>
              {isEn ? 'Click to select PDF or Word handbook' : 'انقر لاختيار ملف اللائحة (PDF أو Word)'}
            </p>
            <span style={{ fontSize: '11px', color: 'var(--ah-text-tertiary)' }}>
              {fileName || (isEn ? 'admission-regulations-2026.pdf (Max 25MB)' : 'admission-rules-2026.pdf (بحد أقصى 25 ميجابايت)')}
            </span>
          </div>
        )}

        {type === 'website' && (
          <Input
            label={isEn ? 'Website Portal URL' : 'رابط صفحة الكلية للمزامنة'}
            placeholder="https://ust.edu.ye/admissions"
            value={webUrl}
            onChange={e => setWebUrl(e.target.value)}
          />
        )}
      </form>
    </Modal>
  );
};
