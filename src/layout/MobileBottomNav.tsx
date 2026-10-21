import React from 'react';
import './MobileBottomNav.css';
import { Home, MessageSquare, Landmark, BarChart2, Settings, LifeBuoy, Activity, CreditCard } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useAgentHubAuth } from '../context/AuthContext';

export interface MobileBottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onOpenDrawer?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const { language } = useTranslation();
  const { role } = useAgentHubAuth();
  const isEn = language === 'en';

  const isStaff = role === 'Staff' || role === 'staff';
  const isPlatformAdmin =
    role === 'Platform Administrator' ||
    role === 'platform_admin' ||
    role === 'platform_administrator';

  let navItems: Array<{ id: string; label: string; icon: React.ReactNode }> = [];

  if (isPlatformAdmin) {
    navItems = [
      { id: 'dashboard', label: isEn ? 'Overview' : 'الرئيسية', icon: <Home size={22} /> },
      { id: 'universities', label: isEn ? 'Universities' : 'الجامعات', icon: <Landmark size={22} /> },
      { id: 'billing', label: isEn ? 'Billing' : 'الاشتراكات', icon: <CreditCard size={22} /> },
      { id: 'system-health', label: isEn ? 'Health' : 'صحة النظام', icon: <Activity size={22} /> },
      { id: 'settings', label: isEn ? 'Settings' : 'الإعدادات', icon: <Settings size={22} /> },
    ];
  } else if (isStaff) {
    navItems = [
      { id: 'dashboard', label: isEn ? 'Home' : 'الرئيسية', icon: <Home size={22} /> },
      { id: 'workspaces', label: isEn ? 'Workspaces' : 'مساحات العمل', icon: <Landmark size={22} /> },
      { id: 'inbox', label: isEn ? 'Conversations' : 'المحادثات', icon: <MessageSquare size={22} /> },
      { id: 'support-cases', label: isEn ? 'Cases' : 'حالات الدعم', icon: <LifeBuoy size={22} /> },
      { id: 'settings', label: isEn ? 'Settings' : 'الإعدادات', icon: <Settings size={22} /> },
    ];
  } else {
    // System Administrator
    navItems = [
      { id: 'dashboard', label: isEn ? 'Home' : 'الرئيسية', icon: <Home size={22} /> },
      { id: 'workspaces', label: isEn ? 'Workspaces' : 'مساحات العمل', icon: <Landmark size={22} /> },
      { id: 'inbox', label: isEn ? 'Conversations' : 'المحادثات', icon: <MessageSquare size={22} /> },
      { id: 'reports', label: isEn ? 'Reports' : 'التقارير', icon: <BarChart2 size={22} /> },
      { id: 'settings', label: isEn ? 'Settings' : 'الإعدادات', icon: <Settings size={22} /> },
    ];
  }

  return (
    <nav className="ah-mobile-bottom-nav">
      {navItems.map(item => {
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`ah-mobile-nav-item ${isActive ? 'ah-mobile-nav-item--active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="ah-mobile-nav-item__icon">{item.icon}</span>
            <span className="ah-mobile-nav-item__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

