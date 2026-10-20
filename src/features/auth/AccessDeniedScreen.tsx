import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAgentHubAuth } from '../../context/AuthContext';
import './SignInScreen.css';

interface AccessDeniedScreenProps {
  message?: string | null;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ message }) => {
  const { signOut } = useAgentHubAuth();

  return (
    <div className="ah-signin-wrapper" dir="rtl">
      <div className="ah-signin-container" style={{ justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ margin: '0 auto 20px auto', width: 72, height: 72, borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
          <ShieldAlert size={40} />
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
          غير مصرح بالدخول
        </h2>

        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
          {message || 'تم التحقق من هويتك عبر Clerk، ولكن هذا الحساب غير مربوط بأي دور أو جامعة معتمدة في قاعدة بيانات AgentHub.'}
        </p>

        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', fontSize: '13px', color: '#475569', textAlign: 'right', marginBottom: '28px' }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: '#1E293B' }}>ماذا يعني هذا؟</div>
          <ul style={{ margin: 0, paddingRight: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>الحسابات التجريبية المعتمدة لـ Sprint 1 هي فقط المصرح لها بالدخول.</li>
            <li>يرجى تسجيل الدخول بأحد الحسابات المعتمدة (System Administrator أو Staff أو Platform Administrator).</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="ah-signin-submit-btn"
          style={{ backgroundColor: '#DC2626', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)' }}
        >
          <LogOut size={18} />
          <span>تسجيل الخروج والعودة</span>
        </button>
      </div>
    </div>
  );
};
