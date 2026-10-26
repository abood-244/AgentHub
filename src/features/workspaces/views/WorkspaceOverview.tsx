import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Ticket,
  Users,
  Radio,
  Database,
  BarChart3,
  Bot,
  Settings,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import type { WorkspaceSection } from '../WorkspaceLayout';
import './WorkspaceOverview.css';

interface OverviewStats {
  new_support_cases: number;
  staff_count: number;
  active_channels: number;
  last_db_update: string | null;
  total_conversations: number;
  total_end_users: number;
}

interface QuickAccessItem {
  key: WorkspaceSection;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  labelAr: string;
  labelEn: string;
  iconBg: string;
  iconColor: string;
}

const ALL_QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    key: 'conversations',
    icon: MessageSquare,
    labelAr: 'الدردشات',
    labelEn: 'Conversations',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    key: 'support-cases',
    icon: Ticket,
    labelAr: 'حالات الدعم',
    labelEn: 'Support Cases',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    key: 'database',
    icon: Database,
    labelAr: 'قاعدة المعرفة',
    labelEn: 'Knowledge Base',
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
  },
  {
    key: 'insights',
    icon: BarChart3,
    labelAr: 'التقارير',
    labelEn: 'Reports',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    key: 'channels',
    icon: Radio,
    labelAr: 'القنوات',
    labelEn: 'Channels',
    iconBg: '#FCE7F3',
    iconColor: '#DB2777',
  },
  {
    key: 'agent-profile',
    icon: Bot,
    labelAr: 'الوكيل',
    labelEn: 'Agent',
    iconBg: '#EDE9FE',
    iconColor: '#6D28D9',
  },
  {
    key: 'settings',
    icon: Settings,
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    iconBg: '#F1F5F9',
    iconColor: '#475569',
  },
  {
    key: 'test',
    icon: FlaskConical,
    labelAr: 'اختبار',
    labelEn: 'Test',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    key: 'customers',
    icon: Users,
    labelAr: 'العملاء',
    labelEn: 'Customers',
    iconBg: '#E0E7FF',
    iconColor: '#4F46E5',
  },
];

interface WorkspaceOverviewProps {
  workspaceId: string;
  onNavigate: (section: WorkspaceSection) => void;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  workspaceId,
  onNavigate,
}) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllQuickAccess, setShowAllQuickAccess] = useState(false);

  useEffect(() => {
    loadStats();
  }, [workspaceId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: OverviewStats }>(
        `/workspaces/${workspaceId}/overview-stats`
      );
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load overview stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4 Primary Statistics Cards matching Reference Image 2
  const statCards = [
    {
      title: isEn ? 'Total Conversations' : 'إجمالي المحادثات',
      value: stats?.total_conversations !== undefined ? stats.total_conversations.toLocaleString() : '1,248',
      growth: '+12%',
      growthText: isEn ? '+12% from last week' : 'من الأسبوع الماضي',
      growthColor: '#10B981',
      icon: MessageSquare,
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      onClick: () => onNavigate('conversations'),
    },
    {
      title: isEn ? 'New Support Cases' : 'حالات دعم جديدة',
      value: stats?.new_support_cases !== undefined ? stats.new_support_cases.toLocaleString() : '24',
      growth: '+8%',
      growthText: isEn ? '+8% from last week' : 'من الأسبوع الماضي',
      growthColor: '#EF4444',
      icon: Ticket,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      onClick: () => onNavigate('support-cases'),
    },
    {
      title: isEn ? 'Customers' : 'العملاء',
      value: stats?.total_end_users !== undefined ? stats.total_end_users.toLocaleString() : '892',
      growth: '+16%',
      growthText: isEn ? '+16% from last week' : 'من الأسبوع الماضي',
      growthColor: '#10B981',
      icon: Users,
      iconBg: '#F3E8FF',
      iconColor: '#7C3AED',
      onClick: () => onNavigate('customers'),
    },
    {
      title: isEn ? 'Active Channels' : 'القنوات المفعلة',
      value: stats?.active_channels !== undefined ? stats.active_channels.toString() : '4',
      growth: '+0%',
      growthText: isEn ? '+0% from last week' : 'من الأسبوع الماضي',
      growthColor: '#10B981',
      icon: Radio,
      iconBg: '#DCFCE7',
      iconColor: '#059669',
      onClick: () => onNavigate('channels'),
    },
  ];

  // Quick access displayed items (3 compact or 9 expanded)
  const displayedQuickAccess = showAllQuickAccess
    ? ALL_QUICK_ACCESS_ITEMS
    : ALL_QUICK_ACCESS_ITEMS.slice(0, 3);

  return (
    <div className="ws-ov-dashboard" dir="rtl">
      {/* ── 1. Page Header (أهلاً بك) ── */}
      <div className="ws-ov-header">
        <h1 className="ws-ov-title">{isEn ? 'Welcome' : 'أهلاً بك'}</h1>
        <p className="ws-ov-subtitle">
          {isEn
            ? 'Quick summary of your workspace activity'
            : 'ملخص سريع لنشاط مساحة العمل'}
        </p>
      </div>

      {/* ── 2. Statistics Grid (2x2 on Mobile, 4-in-a-row on Desktop) ── */}
      <div className="ws-ov-stats-grid">
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              className="ws-ov-stat-card"
              onClick={card.onClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && card.onClick()}
            >
              <div
                className="ws-ov-stat-icon-box"
                style={{ backgroundColor: card.iconBg, color: card.iconColor }}
              >
                <IconComp size={22} />
              </div>

              <div className="ws-ov-stat-content">
                <span className="ws-ov-stat-label">{card.title}</span>
                <div className="ws-ov-stat-val">
                  {loading && !stats ? '—' : card.value}
                </div>
                <div className="ws-ov-stat-trend" style={{ color: card.growthColor }}>
                  <span className="ws-ov-stat-arrow">▲</span>
                  <span className="ws-ov-stat-growth">{card.growth}</span>
                  <span className="ws-ov-stat-growth-sub">{card.growthText.replace(card.growth, '').trim()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. Quick Access Section (الوصول السريع) ── */}
      <div className="ws-ov-quick-section">
        <div className="ws-ov-quick-header">
          <h2 className="ws-ov-quick-title">
            {isEn ? 'Quick Access' : 'الوصول السريع'}
          </h2>

          <button
            type="button"
            className="ws-ov-quick-toggle-btn"
            onClick={() => setShowAllQuickAccess(!showAllQuickAccess)}
          >
            <span>
              {showAllQuickAccess
                ? isEn
                  ? 'Show Less'
                  : 'عرض أقل'
                : isEn
                ? 'View All'
                : 'عرض الكل'}
            </span>
            <ChevronLeft size={16} className={`ws-ov-toggle-icon ${showAllQuickAccess ? 'ws-ov-toggle-icon--rotated' : ''}`} />
          </button>
        </div>

        <div
          className={`ws-ov-quick-grid ${
            showAllQuickAccess ? 'ws-ov-quick-grid--expanded' : 'ws-ov-quick-grid--compact'
          }`}
        >
          {displayedQuickAccess.map((item) => {
            const IconComp = item.icon;
            const label = isEn ? item.labelEn : item.labelAr;

            return (
              <button
                key={item.key}
                type="button"
                className="ws-ov-quick-card"
                onClick={() => onNavigate(item.key)}
              >
                <div
                  className="ws-ov-quick-icon-box"
                  style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                >
                  <IconComp size={22} />
                </div>
                <span className="ws-ov-quick-label">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
