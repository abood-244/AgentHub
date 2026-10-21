import React from 'react';
import { useAgentHubAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Activity,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import './PlatformAdminDashboardScreen.css';

interface PlatformAdminDashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export const PlatformAdminDashboardScreen: React.FC<PlatformAdminDashboardScreenProps> = ({
  onNavigate,
}) => {
  const { internalUser } = useAgentHubAuth();
  const { language } = useTranslation();
  const isEn = language === 'en';

  const adminName = internalUser?.name || 'Platform Administrator';
  const ArrowIcon = isEn ? ArrowRight : ArrowLeft;

  return (
    <div className="ah-platform-admin-dashboard" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Platform Banner */}
      <div className="ah-platform-admin-banner">
        <div className="ah-platform-admin-banner-left">
          <div className="ah-platform-admin-banner-icon">
            <Shield size={26} />
          </div>
          <div>
            <h2 className="ah-platform-admin-banner-title">AgentHub Core Platform</h2>
            <p className="ah-platform-admin-banner-sub">
              Multi-Tenant Architecture • <strong>Platform Administrator</strong>
            </p>
          </div>
        </div>

        <span className="ah-platform-admin-banner-pill">
          v2.4 Core
        </span>
      </div>

      {/* Greeting */}
      <div className="ah-platform-admin-greeting">
        <h1 className="ah-platform-admin-greeting-title">
          {isEn ? `Welcome, ${adminName}` : `مرحباً، ${adminName}`}
        </h1>
        <p className="ah-platform-admin-greeting-sub">
          {isEn
            ? 'Global platform supervision and infrastructure monitoring.'
            : 'الإشراف العام على المنصة ومراقبة صحة الأنظمة والتراخيص.'}
        </p>
      </div>

      {/* System Health Status Grid */}
      <div className="ah-platform-admin-card">
        <div className="ah-platform-admin-card-header">
          <div className="ah-platform-admin-card-title-wrap">
            <Activity size={18} color="#0284C7" />
            <h3 className="ah-platform-admin-card-title">
              {isEn ? 'System Health & Infrastructure' : 'صحة النظام والبنية التحتية'}
            </h3>
          </div>
          <span className="ah-platform-admin-badge-operational">
            <CheckCircle2 size={14} />
            <span>{isEn ? 'All Systems Operational' : 'كافة الخدمات متصلة'}</span>
          </span>
        </div>

        <div className="ah-platform-admin-grid">
          <div className="ah-platform-admin-stat-item">
            <span className="ah-platform-admin-stat-label">Database Engine</span>
            <span className="ah-platform-admin-stat-value">PostgreSQL 18.3</span>
          </div>

          <div className="ah-platform-admin-stat-item">
            <span className="ah-platform-admin-stat-label">Identity Provider</span>
            <span className="ah-platform-admin-stat-value">Clerk (JWKS)</span>
          </div>

          <div className="ah-platform-admin-stat-item">
            <span className="ah-platform-admin-stat-label">Backend Framework</span>
            <span className="ah-platform-admin-stat-value">Laravel 13 API</span>
          </div>

          <div className="ah-platform-admin-stat-item">
            <span className="ah-platform-admin-stat-label">Frontend Client</span>
            <span className="ah-platform-admin-stat-value">React 19 + Vite</span>
          </div>
        </div>
      </div>

      {/* Platform Administrator Menu & Scope */}
      <div className="ah-platform-admin-card">
        <h3 className="ah-platform-admin-card-title" style={{ marginBottom: 14 }}>
          {isEn ? 'Platform Modules (Sprint 1 Scope)' : 'أقسام المنصة وصلاحيات Sprint 1'}
        </h3>

        <div className="ah-platform-admin-modules-list">
          <div
            className="ah-platform-admin-module-row"
            onClick={() => onNavigate('universities')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-platform-admin-module-lead">
              <Layers size={18} color="#0284C7" />
              <span className="ah-platform-admin-module-text">
                {isEn ? 'Universities & Tenant Directory' : 'سجل الجامعات والمؤسسات'}
              </span>
            </div>
            <span className="ah-platform-admin-tag-soon">Coming Soon</span>
          </div>

          <div
            className="ah-platform-admin-module-row"
            onClick={() => onNavigate('subscriptions')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-platform-admin-module-lead">
              <Lock size={18} color="#94A3B8" />
              <span className="ah-platform-admin-module-text">
                {isEn ? 'Subscriptions & Billing' : 'الاشتراكات والفوترة'}
              </span>
            </div>
            <span className="ah-platform-admin-tag-soon">Coming Soon</span>
          </div>

          <div
            className="ah-platform-admin-module-row"
            onClick={() => onNavigate('settings')}
            role="button"
            tabIndex={0}
          >
            <div className="ah-platform-admin-module-lead">
              <Database size={18} color="#0284C7" />
              <span className="ah-platform-admin-module-text">
                {isEn ? 'Platform Settings & LLM Credentials' : 'إعدادات المنصة ومفاتيح الذكاء الاصطناعي'}
              </span>
            </div>
            <ArrowIcon size={16} color="#94A3B8" />
          </div>
        </div>
      </div>
    </div>
  );
};
