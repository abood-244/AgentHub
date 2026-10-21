import React, { useState, useEffect } from 'react';
import './StaffDashboardScreen.css';
import { useAgentHubAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Workspace } from '../../types';
import { workspaceService } from '../../services/apiServices';
import {
  User,
  MessageSquare,
  Landmark,
  Headphones,
  Wifi,
  BarChart3,
  BookOpen,
  Bot,
  Globe,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';

interface StaffDashboardScreenProps {
  onNavigate: (screen: string) => void;
  onSelectWorkspace?: (id: string) => void;
}

export const StaffDashboardScreen: React.FC<StaffDashboardScreenProps> = ({
  onNavigate,
  onSelectWorkspace,
}) => {
  const { internalUser } = useAgentHubAuth();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const staffName = internalUser?.name || (isEn ? 'Ahmed Al-Mutairi' : 'أحمد المطيري');

  const [authorizedWorkspaces, setAuthorizedWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        const data = await workspaceService.getAll();
        setAuthorizedWorkspaces(data);
      } catch {
        setAuthorizedWorkspaces([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspaces();
  }, [internalUser]);

  return (
    <div className="ah-staff-dashboard" dir={isEn ? 'ltr' : 'rtl'}>
      {/* BEGIN: User Greeting */}
      <section className="ah-staff-greeting" data-purpose="greeting-section">
        <h1 className="ah-staff-greeting-title">
          <span>{isEn ? `Welcome, ${staffName}` : `مرحباً ${staffName}`}</span>
          <span>👋</span>
        </h1>
        <p className="ah-staff-greeting-sub">
          {isEn
            ? 'Here is an operational overview of your authorized workspace.'
            : 'هذه نظرة عامة على مساحة عملك.'}
        </p>
      </section>
      {/* END: User Greeting */}

      {/* BEGIN: 2x2 Metric Cards Grid */}
      <section className="ah-staff-metrics-grid" data-purpose="metrics-grid">
        {/* Metric 1: Clients */}
        <div className="ah-staff-metric-card">
          <div className="ah-staff-metric-top">
            <div className="ah-staff-metric-info">
              <span className="ah-staff-metric-label">{isEn ? 'Clients' : 'العملاء'}</span>
              <span className="ah-staff-metric-val">48</span>
            </div>
            <div className="ah-staff-metric-icon ah-staff-metric-icon--blue">
              <User size={22} />
            </div>
          </div>
          <div style={{ height: 16 }} />
        </div>

        {/* Metric 2: Conversations */}
        <div className="ah-staff-metric-card">
          <div className="ah-staff-metric-top">
            <div className="ah-staff-metric-info">
              <span className="ah-staff-metric-label">{isEn ? 'Conversations' : 'المحادثات'}</span>
              <span className="ah-staff-metric-val">124</span>
            </div>
            <div className="ah-staff-metric-icon ah-staff-metric-icon--blue">
              <MessageSquare size={22} />
            </div>
          </div>
          <div className="ah-staff-metric-badge">
            <span>↑</span>
            <span>12%</span>
          </div>
        </div>

        {/* Metric 3: Workspaces */}
        <div
          className="ah-staff-metric-card"
          onClick={() => onNavigate('workspaces')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="ah-staff-metric-top">
            <div className="ah-staff-metric-info">
              <span className="ah-staff-metric-label">{isEn ? 'Workspaces' : 'مساحات العمل'}</span>
              <span className="ah-staff-metric-val">
                {isLoading ? '...' : authorizedWorkspaces.length || 6}
              </span>
            </div>
            <div className="ah-staff-metric-icon ah-staff-metric-icon--blue">
              <Landmark size={22} />
            </div>
          </div>
          <div style={{ height: 16 }} />
        </div>

        {/* Metric 4: Support Cases */}
        <div
          className="ah-staff-metric-card"
          onClick={() => onNavigate('support-cases')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <div className="ah-staff-metric-top">
            <div className="ah-staff-metric-info">
              <span className="ah-staff-metric-label">{isEn ? 'Support Cases' : 'حالات الدعم'}</span>
              <span className="ah-staff-metric-val">28</span>
            </div>
            <div className="ah-staff-metric-icon ah-staff-metric-icon--red">
              <Headphones size={22} />
            </div>
          </div>
          <div className="ah-staff-metric-badge">
            <span>↑</span>
            <span>8%</span>
          </div>
        </div>
      </section>
      {/* END: 2x2 Metric Cards Grid */}

      {/* BEGIN: Main Services Section */}
      <section className="ah-staff-services-section" data-purpose="services-grid-section">
        <div className="ah-staff-section-header">
          <h3 className="ah-staff-section-title">{isEn ? 'Main Services' : 'الخدمات الرئيسية'}</h3>
          <button
            type="button"
            className="ah-staff-section-link"
            onClick={() => onNavigate('workspaces')}
          >
            {isEn ? 'View all' : 'عرض الكل'}
          </button>
        </div>

        {/* 3x2 Services Grid */}
        <div className="ah-staff-services-grid">
          {/* Item 1: Channels */}
          <div
            className="ah-staff-service-tile"
            onClick={() => onNavigate('channels')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-staff-service-icon ah-staff-service-icon--green">
              <Wifi size={22} strokeWidth={2.2} />
            </div>
            <span className="ah-staff-service-label">{isEn ? 'Channels' : 'القنوات'}</span>
          </div>

          {/* Item 2: Workspaces */}
          <div
            className="ah-staff-service-tile"
            onClick={() => onNavigate('workspaces')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-staff-service-icon ah-staff-service-icon--teal">
              <Landmark size={22} strokeWidth={2} />
            </div>
            <span className="ah-staff-service-label">{isEn ? 'Workspaces' : 'مساحات العمل'}</span>
          </div>

          {/* Item 3: Conversations */}
          <div
            className="ah-staff-service-tile"
            onClick={() => onNavigate('inbox')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-staff-service-icon ah-staff-service-icon--blue">
              <MessageSquare size={22} />
            </div>
            <span className="ah-staff-service-label">{isEn ? 'Conversations' : 'المحادثات'}</span>
          </div>

          {/* Item 4: Reports */}
          <div
            className="ah-staff-service-tile"
            onClick={() => onNavigate('reports')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-staff-service-icon ah-staff-service-icon--purple">
              <BarChart3 size={22} />
            </div>
            <span className="ah-staff-service-label">{isEn ? 'Reports' : 'التقارير'}</span>
          </div>

          {/* Item 5: Knowledge Base */}
          <div
            className="ah-staff-service-tile"
            onClick={() => onNavigate('knowledge')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-staff-service-icon ah-staff-service-icon--indigo">
              <BookOpen size={22} />
            </div>
            <span className="ah-staff-service-label">{isEn ? 'Knowledge Base' : 'قاعدة المعرفة'}</span>
          </div>

          {/* Item 6: Agent Profile */}
          <div
            className="ah-staff-service-tile"
            onClick={() => {
              if (authorizedWorkspaces.length > 0 && onSelectWorkspace) {
                onSelectWorkspace(authorizedWorkspaces[0].id);
              } else {
                onNavigate('workspaces');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="ah-staff-service-icon ah-staff-service-icon--violet">
              <Bot size={22} />
            </div>
            <span className="ah-staff-service-label">Agent Profile</span>
          </div>
        </div>
      </section>
      {/* END: Main Services Section */}

      {/* BEGIN: Support Cases Section */}
      <section className="ah-staff-cases-section" data-purpose="support-cases-section">
        <div className="ah-staff-section-header">
          <h3 className="ah-staff-section-title">{isEn ? 'Support Cases' : 'حالات الدعم'}</h3>
          <button
            type="button"
            className="ah-staff-section-link"
            onClick={() => onNavigate('support-cases')}
          >
            {isEn ? 'View all' : 'عرض الكل'}
          </button>
        </div>

        <div className="ah-staff-cases-list">
          {/* Case 1 */}
          <div className="ah-staff-case-card">
            <div className="ah-staff-case-info-wrap">
              <div className="ah-staff-case-avatar">
                <User size={20} />
              </div>
              <div className="ah-staff-case-details">
                <h4 className="ah-staff-case-title">مشكلة في التسجيل للفصل القادم</h4>
                <div className="ah-staff-case-meta">
                  <span className="ah-staff-case-channel">
                    <Globe size={13} />
                    <span>القناة: موقع الجامعة</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="ah-staff-case-status-col">
              <span className="ah-staff-case-pill ah-staff-case-pill--open">مفتوحة</span>
              <span className="ah-staff-case-time">منذ 10 دقائق</span>
            </div>
          </div>

          {/* Case 2 */}
          <div className="ah-staff-case-card">
            <div className="ah-staff-case-info-wrap">
              <div className="ah-staff-case-avatar">
                <User size={20} />
              </div>
              <div className="ah-staff-case-details">
                <h4 className="ah-staff-case-title">كيف يمكنني دفع الرسوم الدراسية؟</h4>
                <div className="ah-staff-case-meta">
                  <span className="ah-staff-case-channel ah-staff-case-channel--whatsapp">
                    <MessageSquare size={13} />
                    <span>القناة: واتساب</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="ah-staff-case-status-col">
              <span className="ah-staff-case-pill ah-staff-case-pill--pending">قيد المراجعة</span>
              <span className="ah-staff-case-time">منذ 25 دقيقة</span>
            </div>
          </div>
        </div>
      </section>
      {/* END: Support Cases Section */}

      {/* BEGIN: Authorized Workspaces List Section */}
      <section className="ah-staff-ws-section" data-purpose="authorized-workspaces-section">
        <div className="ah-staff-ws-header">
          <div>
            <h3 className="ah-staff-ws-title">
              {isEn ? 'My Authorized Workspaces' : 'مساحات العمل المصرح بها'}
            </h3>
            <p className="ah-staff-ws-sub">
              {isEn
                ? 'Workspaces you are authorized to view as Staff (Read-Only)'
                : 'المساحات التي تملك عضوية Staff فيها (وضع القراءة فقط)'}
            </p>
          </div>
          <span className="ah-staff-ws-badge">
            <Shield size={12} style={{ display: 'inline', marginLeft: 4 }} />
            {isEn ? 'Read-only access' : 'صلاحية استعراض'}
          </span>
        </div>

        {authorizedWorkspaces.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            {isLoading
              ? (isEn ? 'Loading authorized workspaces...' : 'جاري تحميل مساحات العمل المصرح بها...')
              : (isEn ? 'No authorized workspaces assigned to your account yet.' : 'لم يتم تعيين مساحات عمل لحسابك بعد. يرجى التواصل مع مسؤول النظام.')}
          </div>
        ) : (
          <div className="ah-staff-ws-list">
            {authorizedWorkspaces.map(ws => (
              <div
                key={ws.id}
                className="ah-staff-ws-item"
                onClick={() => onSelectWorkspace && onSelectWorkspace(ws.id)}
                role="button"
                tabIndex={0}
              >
                <div className="ah-staff-ws-item-info">
                  <div className="ah-staff-ws-icon-box">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="ah-staff-ws-item-title">{isEn ? ws.nameEn : ws.name}</h4>
                    <p className="ah-staff-ws-item-desc">
                      {isEn ? ws.descriptionEn : ws.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: ws.status === 'active' ? '#059669' : '#64748B',
                    backgroundColor: ws.status === 'active' ? '#ECFDF5' : '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: 9999
                  }}>
                    {isEn ? (ws.status === 'active' ? 'Active' : 'Paused') : (ws.status === 'active' ? 'نشط' : 'متوقف')}
                  </span>
                  <ArrowRight size={16} color="#94A3B8" style={{ transform: 'rotate(180deg)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {/* END: Authorized Workspaces List Section */}
    </div>
  );
};
