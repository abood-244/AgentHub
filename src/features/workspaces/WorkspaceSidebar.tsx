import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  BarChart3,
  MessageSquare,
  Ticket,
  Users,
  Bot,
  Database,
  Radio,
  FlaskConical,
  Settings,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut,
  Check,
  Landmark,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAgentHubAuth } from '../../context/AuthContext';
import { Workspace } from '../../types';
import type { WorkspaceSection } from './WorkspaceLayout';
import './WorkspaceSidebar.css';

export interface SidebarNavItem {
  key: WorkspaceSection;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelAr: string;
  labelEn: string;
  badge?: number | string;
  iconBg: string;
  iconColor: string;
  group: 'main' | 'capabilities' | 'settings';
}

export const WORKSPACE_NAV_ITEMS: SidebarNavItem[] = [
  // Group 1 — Main Navigation
  {
    key: 'overview',
    icon: Home,
    labelAr: 'النظرة العامة',
    labelEn: 'Overview',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    group: 'main',
  },
  {
    key: 'insights',
    icon: BarChart3,
    labelAr: 'التقارير والتحليلات',
    labelEn: 'Reports & Analytics',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    group: 'main',
  },
  {
    key: 'conversations',
    icon: MessageSquare,
    labelAr: 'المحادثات',
    labelEn: 'Conversations',
    badge: 12,
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    group: 'main',
  },
  {
    key: 'support-cases',
    icon: Ticket,
    labelAr: 'حالات الدعم',
    labelEn: 'Support Cases',
    badge: 8,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    group: 'main',
  },
  {
    key: 'customers',
    icon: Users,
    labelAr: 'العملاء',
    labelEn: 'Customers',
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
    group: 'main',
  },

  // Group 2 — Agent and Workspace Capabilities
  {
    key: 'agent-profile',
    icon: Bot,
    labelAr: 'إعدادات الوكيل',
    labelEn: 'Agent Profile',
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
    group: 'capabilities',
  },
  {
    key: 'database',
    icon: Database,
    labelAr: 'قاعدة المعرفة',
    labelEn: 'Knowledge Base',
    iconBg: '#E0E7FF',
    iconColor: '#4F46E5',
    group: 'capabilities',
  },
  {
    key: 'channels',
    icon: Radio,
    labelAr: 'القنوات',
    labelEn: 'Channels',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    group: 'capabilities',
  },
  {
    key: 'test',
    icon: FlaskConical,
    labelAr: 'اختبار الوكيل',
    labelEn: 'Test Agent',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    group: 'capabilities',
  },

  // Group 3 — Workspace Settings
  {
    key: 'settings',
    icon: Settings,
    labelAr: 'إعدادات مساحة العمل',
    labelEn: 'Workspace Settings',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
    group: 'settings',
  },
];

interface WorkspaceSidebarProps {
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  workspaceId: string;
  workspaceName?: string;
  workspaceStatus?: string;
  universityName?: string;
  workspacesList?: Workspace[];
  onSelectWorkspace?: (wsId: string) => void;
  onBack: () => void;
  onGlobalNavigate?: (screen: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeSection,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  workspaceId,
  workspaceName,
  workspaceStatus = 'active',
  universityName,
  workspacesList = [],
  onSelectWorkspace,
  onBack,
  onGlobalNavigate,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { language } = useTranslation();
  const { internalUser, role, signOut } = useAgentHubAuth();
  const isEn = language === 'en';

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close workspace selector dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close user profile popup on click outside
  useEffect(() => {
    const handleClickOutsideUser = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideUser);
    return () => document.removeEventListener('mousedown', handleClickOutsideUser);
  }, []);

  const userName = internalUser?.name || 'Alazki Azaki';
  const userEmail = internalUser?.email || 'azakialazki@gmail.com';
  const userInitial = userName.trim().charAt(0).toUpperCase() || 'U';
  const roleTitle =
    role === 'Platform Administrator'
      ? (isEn ? 'Platform Administrator' : 'مسؤول المنصة المركزية')
      : role === 'Staff'
      ? (isEn ? 'Staff Member' : 'مرشد أكاديمي / كادر')
      : (isEn ? 'System Administrator' : 'مسؤول النظام الجامعي');

  const mainGroup = WORKSPACE_NAV_ITEMS.filter((i) => i.group === 'main');
  const capabilitiesGroup = WORKSPACE_NAV_ITEMS.filter((i) => i.group === 'capabilities');
  const settingsGroup = WORKSPACE_NAV_ITEMS.filter((i) => i.group === 'settings');

  const displayName = workspaceName || (isEn ? 'Workspace Assistant' : 'مساعد الجامعة');
  const displayUni = universityName || (isEn ? 'AgentHub University' : 'جامعة المثال');

  const handleItemClick = (key: WorkspaceSection) => {
    onNavigate(key);
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleWorkspaceChange = (targetWsId: string) => {
    setIsDropdownOpen(false);
    if (onSelectWorkspace && targetWsId !== workspaceId) {
      onSelectWorkspace(targetWsId);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div className="ws-sidebar-backdrop" onClick={onCloseMobile} />
      )}

      <aside
        className={`ws-sidebar ${isCollapsed ? 'ws-sidebar--collapsed' : ''} ${
          isMobileOpen ? 'ws-sidebar--mobile-open' : ''
        }`}
        dir="rtl"
      >
        {/* ── 1. Sidebar Header (Dark Navy) ── */}
        <div className="ws-sidebar__header">
          <div className="ws-sidebar__brand">
            <div className="ws-sidebar__logo-badge">
              <MessageSquare size={18} className="ws-sidebar__logo-icon" />
            </div>
            {!isCollapsed && (
              <div className="ws-sidebar__brand-text">
                <span className="ws-sidebar__brand-title">AgentHub</span>
                <span className="ws-sidebar__brand-sub">
                  {isEn ? 'Workspace' : 'مساحة العمل'}
                </span>
              </div>
            )}
          </div>

          {/* Action button: Close on mobile only */}
          {isMobileOpen && (
            <button
              type="button"
              className="ws-sidebar__btn-toggle"
              onClick={onCloseMobile}
              title={isEn ? 'Close' : 'إغلاق'}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── 2. Workspace Selector Card ── */}
        {!isCollapsed && (
          <div className="ws-sidebar__selector-wrap" ref={dropdownRef}>
            <button
              type="button"
              className={`ws-sidebar__selector ${isDropdownOpen ? 'ws-sidebar__selector--open' : ''}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title={isEn ? 'Select Workspace' : 'اختيار مساحة العمل'}
            >
              <div className="ws-sidebar__selector-icon">
                <GraduationCap size={20} />
              </div>
              <div className="ws-sidebar__selector-info">
                <div className="ws-sidebar__selector-name">{displayName}</div>
                <div className="ws-sidebar__selector-uni">{displayUni}</div>
              </div>
              <div className="ws-sidebar__selector-badges">
                {workspaceStatus === 'active' && (
                  <span className="ws-sidebar__status-dot" title={isEn ? 'Active' : 'نشط'} />
                )}
                <ChevronDown
                  size={16}
                  className={`ws-sidebar__chevron ${isDropdownOpen ? 'ws-sidebar__chevron--up' : ''}`}
                />
              </div>
            </button>

            {/* Dropdown Menu for Switching Workspaces */}
            {isDropdownOpen && (
              <div className="ws-sidebar__dropdown">
                <div className="ws-sidebar__dropdown-header">
                  {isEn ? 'Switch Workspace' : 'الانتقال إلى مساحة عمل'}
                </div>
                <div className="ws-sidebar__dropdown-list">
                  {workspacesList.length > 0 ? (
                    workspacesList.map((ws) => {
                      const isCurrent = String(ws.id) === String(workspaceId);
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          className={`ws-sidebar__dropdown-item ${
                            isCurrent ? 'ws-sidebar__dropdown-item--active' : ''
                          }`}
                          onClick={() => handleWorkspaceChange(String(ws.id))}
                        >
                          <div className="ws-sidebar__dropdown-item-info">
                            <span className="ws-sidebar__dropdown-item-name">
                              {isEn ? ws.nameEn || ws.name : ws.name}
                            </span>
                            <span className="ws-sidebar__dropdown-item-status">
                              {ws.status === 'active' ? (isEn ? 'Active' : 'نشط') : (isEn ? 'Paused' : 'متوقف')}
                            </span>
                          </div>
                          {isCurrent && <Check size={16} className="ws-sidebar__dropdown-check" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="ws-sidebar__dropdown-empty">
                      {displayName}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. Navigation Groups ── */}
        <div className="ws-sidebar__nav-container">
          {/* Group 1: Main Navigation */}
          <div className="ws-sidebar__group">
            {mainGroup.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSection === item.key;
              const label = isEn ? item.labelEn : item.labelAr;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`ws-sidebar__item ${isActive ? 'ws-sidebar__item--active' : ''}`}
                  onClick={() => handleItemClick(item.key)}
                  title={isCollapsed ? label : undefined}
                >
                  <div
                    className="ws-sidebar__item-icon-box"
                    style={{
                      backgroundColor: isActive ? '#EBF5FF' : item.iconBg,
                      color: isActive ? '#0878F9' : item.iconColor,
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  {!isCollapsed && (
                    <span className="ws-sidebar__item-label">{label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ws-sidebar__item-badge">{item.badge}</span>
                  )}
                  {isActive && <span className="ws-sidebar__item-indicator" />}
                </button>
              );
            })}
          </div>

          <div className="ws-sidebar__divider" />

          {/* Group 2: Agent & Workspace Capabilities */}
          <div className="ws-sidebar__group">
            {capabilitiesGroup.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSection === item.key;
              const label = isEn ? item.labelEn : item.labelAr;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`ws-sidebar__item ${isActive ? 'ws-sidebar__item--active' : ''}`}
                  onClick={() => handleItemClick(item.key)}
                  title={isCollapsed ? label : undefined}
                >
                  <div
                    className="ws-sidebar__item-icon-box"
                    style={{
                      backgroundColor: isActive ? '#EBF5FF' : item.iconBg,
                      color: isActive ? '#0878F9' : item.iconColor,
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  {!isCollapsed && (
                    <span className="ws-sidebar__item-label">{label}</span>
                  )}
                  {isActive && <span className="ws-sidebar__item-indicator" />}
                </button>
              );
            })}
          </div>

          <div className="ws-sidebar__divider" />

          {/* Group 3: Workspace Settings */}
          <div className="ws-sidebar__group">
            {settingsGroup.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSection === item.key;
              const label = isEn ? item.labelEn : item.labelAr;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`ws-sidebar__item ${isActive ? 'ws-sidebar__item--active' : ''}`}
                  onClick={() => handleItemClick(item.key)}
                  title={isCollapsed ? label : undefined}
                >
                  <div
                    className="ws-sidebar__item-icon-box"
                    style={{
                      backgroundColor: isActive ? '#EBF5FF' : item.iconBg,
                      color: isActive ? '#0878F9' : item.iconColor,
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  {!isCollapsed && (
                    <span className="ws-sidebar__item-label">{label}</span>
                  )}
                  {isActive && <span className="ws-sidebar__item-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. Bottom User Profile Footer (Matching Reference Screenshots) ── */}
        <div className="ws-sidebar__footer">
          {/* User Profile Card & Floating Popover Menu */}
          <div className="ws-sidebar__user-section" ref={userMenuRef}>
            {isUserMenuOpen && (
              <div className="ws-sidebar__user-popover" role="dialog" aria-label="قائمة المستخدم">
                <div className="ws-sidebar__popover-header">
                  <div className="ws-sidebar__popover-avatar">
                    {userInitial}
                  </div>
                  <div className="ws-sidebar__popover-details">
                    <span className="ws-sidebar__popover-name">{userName}</span>
                    <span className="ws-sidebar__popover-email">{userEmail}</span>
                  </div>
                </div>

                <div className="ws-sidebar__popover-divider" />

                <div className="ws-sidebar__popover-actions">
                  {/* 1. Workspace Settings */}
                  <button
                    type="button"
                    className="ws-sidebar__popover-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onNavigate('settings');
                    }}
                  >
                    <Settings size={16} />
                    <span>{isEn ? 'Workspace Settings' : 'إعدادات مساحة العمل'}</span>
                  </button>

                  {/* 2. Return to Workspaces */}
                  <button
                    type="button"
                    className="ws-sidebar__popover-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onBack();
                    }}
                  >
                    <Landmark size={16} />
                    <span>{isEn ? 'Back to Workspaces' : 'العودة إلى مساحات العمل'}</span>
                  </button>

                  {/* 3. Sign Out */}
                  <button
                    type="button"
                    className="ws-sidebar__popover-item ws-sidebar__popover-item--danger"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut size={16} />
                    <span>{isEn ? 'Sign Out' : 'تسجيل الخروج'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className={`ws-sidebar__user-card ${isUserMenuOpen ? 'ws-sidebar__user-card--active' : ''}`}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              title={isCollapsed ? `${userName} (${roleTitle})` : undefined}
              aria-expanded={isUserMenuOpen}
            >
              <div className="ws-sidebar__user-avatar">
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="ws-sidebar__user-meta">
                  <span className="ws-sidebar__user-name">{userName}</span>
                  <span className="ws-sidebar__user-role">{roleTitle}</span>
                </div>
              )}
              {!isCollapsed && (
                <ChevronDown
                  size={14}
                  className={`ws-sidebar__user-chevron ${isUserMenuOpen ? 'ws-sidebar__user-chevron--up' : ''}`}
                />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
