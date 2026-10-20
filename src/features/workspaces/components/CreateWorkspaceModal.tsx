import React, { useState } from 'react';
import { Modal } from '../../../design-system/components/Modal';
import { Input } from '../../../design-system/components/Input';
import { Button } from '../../../design-system/components/Button';
import { workspaceService } from '../../../services/apiServices';
import { mockLLMModels } from '../../../services/mockData';
import { Workspace } from '../../../types';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newWorkspace: Workspace) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [category, setCategory] = useState<Workspace['category']>('admissions');
  const [selectedModelId, setSelectedModelId] = useState(mockLLMModels[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!nameAr.trim()) {
      setError(isEn ? 'Workspace name is required.' : 'اسم مساحة العمل مطلوب.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newWs = await workspaceService.create({
        name: nameAr.trim(),
        nameEn: (nameEn || nameAr).trim(),
        description: descriptionAr.trim(),
        descriptionEn: descriptionAr.trim(),
        category,
        selectedLLMModelId: selectedModelId,
      });

      setIsSubmitting(false);
      setNameAr('');
      setNameEn('');
      setDescriptionAr('');
      onCreated(newWs);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.data?.errors) {
        setValidationErrors(err.data.errors);
      }
      setError(err.data?.message || err.message || (isEn ? 'Failed to create workspace.' : 'فشل في إنشاء مساحة العمل.'));
    }
  };

  const handleClose = () => {
    setError(null);
    setValidationErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('createWorkspace')}
      subtitle={isEn ? 'Add a new university department or faculty service domain' : 'إضافة قسم جامعي أو عمادة مساندة جديدة للمنصة'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} type="button">
            {isEn ? 'Cancel' : 'إلغاء'}
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            type="button"
          >
            {isEn ? 'Create Workspace' : 'إنشاء مساحة العمل'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#991B1B',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div>
          <Input
            label={isEn ? 'Workspace Name (Arabic)' : 'اسم مساحة العمل (بالعربية)'}
            placeholder="مثال: عمادة الدراسات العليا"
            value={nameAr}
            onChange={e => setNameAr(e.target.value)}
            required
          />
          {validationErrors.name && (
            <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
              {validationErrors.name.join(', ')}
            </span>
          )}
        </div>

        <Input
          label={isEn ? 'Workspace Name (English)' : 'اسم مساحة العمل (بالإنجليزية)'}
          placeholder="e.g. Deanship of Graduate Studies"
          value={nameEn}
          onChange={e => setNameEn(e.target.value)}
        />

        <div className="ah-input-group">
          <label className="ah-input-label">{isEn ? 'Description' : 'وصف خدمات القسم'}</label>
          <textarea
            className="ah-prompt-textarea"
            rows={3}
            placeholder="أدخل ملخصاً عن المهام والاستفسارات التي سيجيب عليها هذا القسم..."
            value={descriptionAr}
            onChange={e => setDescriptionAr(e.target.value)}
          />
          {validationErrors.description && (
            <span style={{ color: '#EF4444', fontSize: '12px', marginTop: 4, display: 'block' }}>
              {validationErrors.description.join(', ')}
            </span>
          )}
        </div>

        <div className="ah-input-group">
          <label className="ah-input-label">{t('selectedLLMModel')}</label>
          <select
            className="ah-input"
            value={selectedModelId}
            onChange={e => setSelectedModelId(e.target.value)}
          >
            {mockLLMModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
};
