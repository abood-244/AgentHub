import React, { useState, useEffect } from 'react';
import { Modal } from '../../../design-system/components/Modal';
import { Button } from '../../../design-system/components/Button';
import { User } from '../../../types';
import { workspaceService } from '../../../services/apiServices';
import { useTranslation } from '../../../i18n/LanguageContext';
import { Users, UserPlus, Check, Info } from 'lucide-react';

export interface AssignStaffModalProps {
  isOpen: boolean;
  workspaceId: string;
  assignedStaffIds: string[];
  onClose: () => void;
  onStaffUpdated: () => void;
}

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  workspaceId,
  assignedStaffIds,
  onClose,
  onStaffUpdated,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [globalStaff, setGlobalStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      workspaceService.getAllGlobalStaff().then(setGlobalStaff);
    }
  }, [isOpen]);

  const handleToggleStaff = async (staffId: string) => {
    setLoading(true);
    if (assignedStaffIds.includes(staffId)) {
      await workspaceService.removeStaff(workspaceId, staffId);
    } else {
      await workspaceService.assignStaff(workspaceId, staffId);
    }
    setLoading(false);
    onStaffUpdated();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEn ? 'Assign Staff Members' : 'تعيين الكوادر البشرية للقسم'}
      subtitle={isEn
        ? 'Select from globally managed university counselors. Staff assignment is optional.'
        : 'اختر من الكوادر الجامعية المسجلة مركزياً. تعيين الموظفين اختياري، ويمكن للقسم العمل بالذكاء الاصطناعي الكامل.'}
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>
          {isEn ? 'Done' : 'إتمام التعيين'}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'var(--ah-bg-subtle)',
          padding: '10px 12px',
          borderRadius: '10px',
          fontSize: '12px',
          color: 'var(--ah-text-secondary)'
        }}>
          <Info size={18} color="#0066FF" style={{ flexShrink: 0 }} />
          <span>
            {isEn
              ? 'Notice: When no staff is assigned, escalated student requests will remain unassigned in the queue.'
              : 'ملاحظة: إذا لم تقم بتعيين موظفين، ستظل حالات الدعم المحولة في قائمة الانتظار العامة (وضع AI المستقل).'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {globalStaff.map(staff => {
            const isAssigned = assignedStaffIds.includes(staff.id);
            return (
              <div
                key={staff.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--ah-bg-surface)',
                  border: isAssigned ? '1.5px solid var(--ah-primary-500)' : '1px solid var(--ah-border-subtle)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={staff.avatarUrl}
                    alt={staff.name}
                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 700 }}>
                      {isEn ? staff.nameEn : staff.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ah-text-secondary)' }}>
                      {isEn ? staff.roleLabelEn : staff.roleLabel} • {isEn ? staff.departmentEn : staff.department}
                    </span>
                  </div>
                </div>

                <Button
                  variant={isAssigned ? 'outline' : 'secondary'}
                  size="sm"
                  disabled={loading}
                  onClick={() => handleToggleStaff(staff.id)}
                >
                  {isAssigned ? (
                    <>
                      <Check size={14} />
                      <span>{isEn ? 'Assigned' : 'معيّن بالقسم'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>{isEn ? 'Assign' : 'إضافة للقسم'}</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
