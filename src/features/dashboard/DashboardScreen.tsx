import React from 'react';
import './DashboardScreen.css';
import {
  StatWidget,
  ServiceTile
} from '../../design-system/components/Card';
import { SupportCaseItem } from './components/SupportCaseItem';
import {
  MessageSquare,
  Users,
  Landmark,
  Radio,
  BarChart3,
  Bot
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockSupportCases, mockCurrentUser } from '../../services/mockData';

export interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
  onOpenCaseDetail?: (caseId: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onOpenCaseDetail,
}) => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  return (
    <div className="ah-dashboard">
      {/* Greeting Banner */}
      <section className="ah-dashboard__greeting">
        <h2 className="ah-dashboard__greeting-title">
          {isEn ? `Welcome, ${mockCurrentUser.nameEn} 👋` : `مرحباً ${mockCurrentUser.name.split(' ')[0]} 👋`}
        </h2>
        <p className="ah-dashboard__greeting-sub">
          {t('greetingSubtitle')}
        </p>
      </section>

      {/* KPI 4 Metric Cards matching screenshot */}
      <section className="ah-dashboard__kpis">
        <StatWidget
          label={t('metricConversations')}
          value="1,240"
          trend="12%"
          isPositiveTrend={true}
          icon={<MessageSquare size={22} />}
          iconBgColor="#EBF3FE"
          onClick={() => onNavigate('inbox')}
        />

        <StatWidget
          label={t('metricUsers')}
          value="48"
          icon={<Users size={22} />}
          iconBgColor="#EBF3FE"
          onClick={() => onNavigate('staff')}
        />

        <StatWidget
          label={t('metricWorkspaces')}
          value="6"
          icon={<Landmark size={22} />}
          iconBgColor="#EBF3FE"
          onClick={() => onNavigate('workspaces')}
        />

        <StatWidget
          label={t('metricChannels')}
          value="24"
          icon={<Radio size={22} />}
          iconBgColor="#EBF3FE"
          onClick={() => onNavigate('channels')}
        />
      </section>

      {/* Main Services (الخدمات الرئيسية) matching screenshot 6-grid */}
      <section className="ah-dashboard__section">
        <div className="ah-dashboard__section-header">
          <h3 className="ah-dashboard__section-title">{t('mainServices')}</h3>
          <button
            type="button"
            className="ah-dashboard__view-all"
            onClick={() => onNavigate('workspaces')}
          >
            {t('viewAll')}
          </button>
        </div>

        <div className="ah-dashboard__services-grid">
          <ServiceTile
            label={t('serviceChannels')}
            icon={<Radio size={22} />}
            iconBgColor="#DCFCE7"
            iconColor="#16A34A"
            onClick={() => onNavigate('channels')}
          />

          <ServiceTile
            label={t('serviceWorkspaces')}
            icon={<Landmark size={22} />}
            iconBgColor="#CCFBF1"
            iconColor="#0D9488"
            onClick={() => onNavigate('workspaces')}
          />

          <ServiceTile
            label={t('serviceConversations')}
            icon={<MessageSquare size={22} />}
            iconBgColor="#E0F2FE"
            iconColor="#0284C7"
            onClick={() => onNavigate('inbox')}
          />

          <ServiceTile
            label={t('serviceReports')}
            icon={<BarChart3 size={22} />}
            iconBgColor="#F3E8FF"
            iconColor="#9333EA"
            onClick={() => onNavigate('reports')}
          />

          <ServiceTile
            label={t('serviceUsers')}
            icon={<Users size={22} />}
            iconBgColor="#DBEAFE"
            iconColor="#2563EB"
            onClick={() => onNavigate('staff')}
          />

          <ServiceTile
            label={t('serviceAgents')}
            icon={<Bot size={22} />}
            iconBgColor="#E0E7FF"
            iconColor="#4F46E5"
            onClick={() => onNavigate('llm-models')}
          />
        </div>
      </section>

      {/* Support Status / Cases (حالة دعم) matching screenshot */}
      <section className="ah-dashboard__section">
        <div className="ah-dashboard__section-header">
          <h3 className="ah-dashboard__section-title">{t('supportStatus')}</h3>
          <button
            type="button"
            className="ah-dashboard__view-all"
            onClick={() => onNavigate('support-cases')}
          >
            {t('viewAll')}
          </button>
        </div>

        <div className="ah-dashboard__cases-list">
          {mockSupportCases.map(item => (
            <SupportCaseItem
              key={item.id}
              item={item}
              onClick={() => onOpenCaseDetail?.(item.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
