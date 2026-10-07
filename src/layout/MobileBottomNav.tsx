import React from 'react';
import './MobileBottomNav.css';
import { Home, MessageSquare, Landmark, BarChart2, Menu } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export interface MobileBottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: <Home size={22} /> },
    { id: 'inbox', label: t('navInbox'), icon: <MessageSquare size={22} /> },
    { id: 'workspaces', label: t('navWorkspaces'), icon: <Landmark size={22} /> },
    { id: 'reports', label: t('navReports'), icon: <BarChart2 size={22} /> },
    { id: 'more', label: t('navMore'), icon: <Menu size={22} /> },
  ];

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
