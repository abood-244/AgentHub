import React from 'react';
import { useAgentHubAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Server,
  Activity,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import './DashboardScreen.css';

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, direction: isEn ? 'ltr' : 'rtl' }}>
      {/* Platform Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#ffffff',
          borderRadius: 20,
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
            }}
          >
            <Shield size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>AgentHub Core Platform</h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              Multi-Tenant Architecture • <span style={{ color: '#38BDF8' }}>Platform Administrator</span>
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 9999,
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38BDF8',
          }}
        >
          v2.4 Core
        </span>
      </div>

      {/* Greeting */}
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
          {isEn ? `Welcome, ${adminName}` : `مرحباً، ${adminName}`}
        </h1>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
          {isEn ? 'Global platform supervision and infrastructure monitoring.' : 'الإشراف العام على المنصة ومراقبة صحة الأنظمة والتراخيص.'}
        </p>
      </div>

      {/* System Health Status Grid */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 18, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="#0284C7" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {isEn ? 'System Health & Infrastructure' : 'صحة النظام والبنية التحتية'}
            </h3>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>
            <CheckCircle2 size={14} />
            <span>{isEn ? 'All Systems Operational' : 'كافة الخدمات متصلة'}</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Database Engine</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>PostgreSQL 18.3</span>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Identity Provider</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Clerk (JWKS)</span>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Backend Framework</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Laravel 13 API</span>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '10px 12px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>Frontend Client</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>React 19 + Vite</span>
          </div>
        </div>
      </div>

      {/* Platform Administrator Menu & Scope */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 18, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
          {isEn ? 'Platform Modules (Sprint 1 Scope)' : 'أقسام المنصة وصلاحيات Sprint 1'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            onClick={() => onNavigate('universities')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={18} color="#0284C7" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                {isEn ? 'Universities & Tenant Directory' : 'سجل الجامعات والمؤسسات'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Coming Soon</span>
          </div>

          <div
            onClick={() => onNavigate('subscriptions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock size={18} color="#64748B" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                {isEn ? 'Subscriptions & Billing' : 'الاشتراكات والفوترة'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Coming Soon</span>
          </div>

          <div
            onClick={() => onNavigate('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 14,
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={18} color="#0284C7" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                {isEn ? 'Platform Settings & LLM Credentials' : 'إعدادات المنصة ومفاتيح الذكاء الاصطناعي'}
              </span>
            </div>
            <ArrowRight size={16} color="#94A3B8" style={{ transform: isEn ? 'none' : 'rotate(180deg)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
