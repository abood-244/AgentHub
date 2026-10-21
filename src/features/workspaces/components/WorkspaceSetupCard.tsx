import React from 'react';
import './WorkspaceSetupCard.css';
import { Workspace, SetupStepStatus } from '../../../types';
import { Button } from '../../../design-system/components/Button';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Settings,
  Database,
  Bot,
  Cpu,
  Users,
  Radio,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface WorkspaceSetupCardProps {
  workspace: Workspace;
  onNavigateTab: (tabId: string) => void;
  onOpenTestChat?: () => void;
}

export const WorkspaceSetupCard: React.FC<WorkspaceSetupCardProps> = ({
  workspace,
  onNavigateTab,
  onOpenTestChat,
}) => {
  const { language, t, isRTL } = useTranslation();
  const isEn = language === 'en';

  const progress = workspace.setupProgress;

  const renderStatusBadge = (status: SetupStepStatus) => {
    switch (status) {
      case 'ready':
      case 'configured':
        return (
          <span className="ah-step-status ah-step-status--ready">
            <CheckCircle2 size={14} />
            <span>{isEn ? 'Configured' : 'مكتمل'}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="ah-step-status ah-step-status--progress">
            <Clock size={14} />
            <span>{isEn ? 'In Progress' : 'قيد الإعداد'}</span>
          </span>
        );
      case 'not_configured':
      default:
        return (
          <span className="ah-step-status ah-step-status--pending">
            <AlertCircle size={14} />
            <span>{isEn ? 'Not Configured' : 'غير مكتمل'}</span>
          </span>
        );
    }
  };

  const steps = [
    {
      id: 'settings',
      title: isEn ? 'Workspace Settings' : 'إعدادات القسم واللغة',
      desc: isEn ? 'Basic department metadata and default language' : 'اسم القسم والوصف واللغة المعتمدة',
      status: progress.workspaceSettings,
      icon: <Settings size={18} />,
      tab: 'settings',
    },
    {
      id: 'knowledge',
      title: isEn ? 'Knowledge Sources' : 'مصادر المعرفة الجامعية (RAG)',
      desc: isEn
        ? `${workspace.knowledgeSourcesCount} documents and handbooks uploaded`
        : `تم رفع ${workspace.knowledgeSourcesCount} مصادر ولوائح معتمدة`,
      status: progress.knowledge,
      icon: <Database size={18} />,
      tab: 'knowledge',
    },
    {
      id: 'agent',
      title: isEn ? 'Agent Profile & Persona' : 'تخصيص وكيل مساحة العمل',
      desc: isEn ? 'Instructions, tone, and escalation triggers' : 'تعليمات النظام والنبرة وقواعد التحويل',
      status: progress.agentProfile,
      icon: <Bot size={18} />,
      tab: 'agent',
    },
    {
      id: 'model',
      title: isEn ? 'Selected Global LLM' : 'نموذج الذكاء الاصطناعي (Global LLM)',
      desc: isEn ? 'Model selected from globally managed AI cluster' : 'اختيار النموذج العالمي المعتمد للقسم',
      status: progress.llmModel,
      icon: <Cpu size={18} />,
      tab: 'agent',
    },
    {
      id: 'staff',
      title: isEn ? 'Staff Assignments (Optional)' : 'الكوادر البشرية (اختياري)',
      desc: isEn
        ? `${workspace.staffCount} counselors assigned (AI-only supported)`
        : `${workspace.staffCount} موظفين معينين (يدعم وضع AI المستقل)`,
      status: progress.staff,
      icon: <Users size={18} />,
      tab: 'staff',
    },
    {
      id: 'channels',
      title: isEn ? 'Communication Channels' : 'قنوات التواصل (الودجت والواتساب)',
      desc: isEn ? 'Web widget and WhatsApp access configuration' : 'تهيئة ظهور الودجت في الموقع والواتساب',
      status: progress.channels,
      icon: <Radio size={18} />,
      tab: 'channels',
    },
    {
      id: 'test',
      title: isEn ? 'Agent Verification Test' : 'جلسة اختبار التحقق من الوكيل',
      desc: isEn ? 'Verify knowledge answers and case escalation' : 'التحقق من الإجابات وسيناريو حالات الدعم',
      status: progress.testAgent,
      icon: <Sparkles size={18} />,
      isTestAction: true,
    },
  ];

  const completedCount = steps.filter(
    s => s.status === 'ready' || s.status === 'configured'
  ).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="ah-setup-card">
      <div className="ah-setup-card__header">
        <div className="ah-setup-card__title-col">
          <div className="ah-setup-card__title-row">
            <h3 className="ah-setup-card__title">
              {isEn ? 'Workspace Setup & Readiness' : 'جاهزية وإعداد مساحة العمل'}
            </h3>
            <span className="ah-setup-percent-badge">{percentage}% {isEn ? 'Ready' : 'مكتمل'}</span>
          </div>
          <p className="ah-setup-card__subtitle">
            {isEn
              ? 'Complete the core modules below to verify and deploy the workspace agent for student interactions.'
              : 'أكمل إعداد الخطوات الأساسية لتجهيز واختبار وكيل القسم قبل تفعيله رسمياً للطلاب.'}
          </p>
        </div>

        {onOpenTestChat && (
          <div className="ah-setup-card__action-col">
            <Button
              variant="primary"
              icon={<Play size={16} />}
              onClick={onOpenTestChat}
            >
              {isEn ? 'Open Test Chat' : 'فتح بيئة الاختبار التجريبي'}
            </Button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="ah-setup-progress-track">
        <div
          className="ah-setup-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Steps List Grid */}
      <div className="ah-setup-steps-grid">
        {steps.map(step => (
          <div
            key={step.id}
            className="ah-setup-step-item"
            onClick={() => {
              if (step.isTestAction) {
                onOpenTestChat?.();
              } else if (step.tab) {
                onNavigateTab(step.tab);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="ah-step-item__icon-box">
              {step.icon}
            </div>

            <div className="ah-step-item__info">
              <div className="ah-step-item__top-row">
                <span className="ah-step-item__title">{step.title}</span>
                {renderStatusBadge(step.status)}
              </div>
              <span className="ah-step-item__desc">{step.desc}</span>
            </div>

            <span className="ah-step-item__arrow">
              {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
