import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './InsightsHub.css';

interface UserAnalyticsData {
  total_users: number;
  active_users_30d: number;
  users_over_time: Array<{ date: string; count: number }>;
}

interface AIPerformanceData {
  total_answered: number;
  high_confidence: number;
  low_confidence: number;
  unanswered: number;
  success_rate: number;
}

interface HumanInterventionData {
  human_interventions: number;
  total_conversations: number;
  intervention_rate: number;
}

interface SupportCasesStatsData {
  total: number;
  by_status: Record<string, number>;
  avg_resolution_hours: number | null;
  overdue_count: number;
  by_staff: Array<{ assigned_staff_id: number; count: number; assigned_staff?: { name: string } | null }>;
}

interface StaffPerformanceItem {
  assigned_staff_id: number;
  total_cases: number;
  closed_cases: number;
  open_cases: number;
  overdue_cases: number;
  assigned_staff?: { id: number; name: string; email: string } | null;
}

interface QuestionItem {
  id: number;
  content: string;
  conversation_id: number;
  created_at: string;
  conversation?: {
    end_user?: { name: string | null } | null;
  };
}

interface QuestionsData {
  total_questions: number;
  recent_questions: QuestionItem[];
}

type TabKey = 'summary' | 'users' | 'ai' | 'support' | 'questions' | 'staff';

interface InsightsHubProps {
  workspaceId: string;
  onNavigate?: (section: any) => void;
}

const COLORS = ['#0878F9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const InsightsHub: React.FC<InsightsHubProps> = ({ workspaceId, onNavigate }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'custom'>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);

  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData | null>(null);
  const [aiPerformance, setAiPerformance] = useState<AIPerformanceData | null>(null);
  const [humanIntervention, setHumanIntervention] = useState<HumanInterventionData | null>(null);
  const [supportStats, setSupportStats] = useState<SupportCasesStatsData | null>(null);
  const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
  const [staffData, setStaffData] = useState<StaffPerformanceItem[]>([]);

  useEffect(() => {
    loadAllInsights();
  }, [workspaceId, period, customFrom, customTo]);

  const buildQuery = () => {
    let q = `?period=${period}`;
    if (period === 'custom' && customFrom && customTo) {
      q = `?from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`;
    }
    return q;
  };

  const loadAllInsights = async () => {
    try {
      setLoading(true);
      const query = buildQuery();

      const [uRes, aRes, hRes, sRes, qRes, staffRes] = await Promise.allSettled([
        apiClient.get<{ data: UserAnalyticsData }>(`/workspaces/${workspaceId}/insights/user-analytics${query}`),
        apiClient.get<{ data: AIPerformanceData }>(`/workspaces/${workspaceId}/insights/ai-performance${query}`),
        apiClient.get<{ data: HumanInterventionData }>(`/workspaces/${workspaceId}/insights/human-intervention${query}`),
        apiClient.get<{ data: SupportCasesStatsData }>(`/workspaces/${workspaceId}/insights/support-cases${query}`),
        apiClient.get<{ data: QuestionsData }>(`/workspaces/${workspaceId}/insights/questions${query}`),
        apiClient.get<{ data: StaffPerformanceItem[] }>(`/workspaces/${workspaceId}/insights/staff-performance${query}`),
      ]);

      if (uRes.status === 'fulfilled') setUserAnalytics(uRes.value.data);
      if (aRes.status === 'fulfilled') setAiPerformance(aRes.value.data);
      if (hRes.status === 'fulfilled') setHumanIntervention(hRes.value.data);
      if (sRes.status === 'fulfilled') setSupportStats(sRes.value.data);
      if (qRes.status === 'fulfilled') setQuestionsData(qRes.value.data);
      if (staffRes.status === 'fulfilled') setStaffData(staffRes.value.data);
    } catch (err) {
      console.error('Failed to load insights', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Interacted Users', userAnalytics?.total_users ?? 0],
      ['Active Users in Period', userAnalytics?.active_users_30d ?? 0],
      ['Total User Questions', questionsData?.total_questions ?? 0],
      ['AI Total Answered', aiPerformance?.total_answered ?? 0],
      ['AI High Confidence Answers', aiPerformance?.high_confidence ?? 0],
      ['AI Low Confidence Answers', aiPerformance?.low_confidence ?? 0],
      ['AI Unanswered Questions', aiPerformance?.unanswered ?? 0],
      ['AI Success Rate', `${aiPerformance?.success_rate ?? 0}%`],
      ['Human Interventions', humanIntervention?.human_interventions ?? 0],
      ['Human Intervention Rate', `${humanIntervention?.intervention_rate ?? 0}%`],
      ['Total Support Cases', supportStats?.total ?? 0],
      ['Open Cases (>12h)', supportStats?.overdue_count ?? 0],
      ['Avg Resolution (Hours)', supportStats?.avg_resolution_hours ?? 0],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => `"${e[0]}","${e[1]}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `insights_workspace_${workspaceId}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const userGrowthData = userAnalytics?.users_over_time?.length
    ? userAnalytics.users_over_time
    : [{ date: isEn ? 'No records' : 'لا توجد بيانات', count: 0 }];

  const caseStatusData = supportStats?.by_status
    ? Object.entries(supportStats.by_status).map(([name, value]) => ({
        name: name === 'new' ? (isEn ? 'New' : 'جديدة') : name === 'in_progress' ? (isEn ? 'In Progress' : 'قيد المعالجة') : (isEn ? 'Closed' : 'مغلقة'),
        value: Number(value),
      }))
    : [{ name: isEn ? 'None' : 'لا يوجد', value: 0 }];

  const aiPieData = [
    { name: isEn ? 'High Confidence (>=70%)' : 'ثقة مرتفعة (>= 70%)', value: aiPerformance?.high_confidence || 0 },
    { name: isEn ? 'Low Confidence (<50%)' : 'ثقة منخفضة (< 50%)', value: aiPerformance?.low_confidence || 0 },
  ];

  return (
    <div className="ws-insights-container">
      {/* Top Header & Export Controls */}
      <div className="ws-insights-header">
        <div>
          <h1 className="ws-insights-title">{isEn ? 'Insights Hub' : 'مركز التحليلات والتقارير (Insights Hub)'}</h1>
          <p className="ws-insights-subtitle">
            {isEn
              ? 'Operational analytics, AI accuracy, questions, human interventions, and staff performance'
              : 'مؤشرات الأداء التشغيلية، دقة الذكاء الاصطناعي، سجل الأسئلة، التدخل البشري، وأداء الموظفين'}
          </p>
        </div>

        <div className="ws-insights-actions">
          <button className="ws-insights-btn" onClick={handleExportCSV}>
            📥 {isEn ? 'Export CSV' : 'تصدير CSV'}
          </button>
          <button className="ws-insights-btn ws-insights-btn--primary" onClick={handlePrintPDF}>
            🖨️ {isEn ? 'Print / Export PDF' : 'طباعة / تصدير PDF'}
          </button>
        </div>
      </div>

      {/* Filter Bar (Period & Custom Dates) */}
      <div className="ws-insights-filters-bar">
        <div className="ws-insights-periods">
          <button
            className={`ws-insights-period-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            {isEn ? 'Today' : 'اليوم'}
          </button>
          <button
            className={`ws-insights-period-btn ${period === '7d' ? 'active' : ''}`}
            onClick={() => setPeriod('7d')}
          >
            {isEn ? 'Last 7 Days' : 'آخر 7 أيام'}
          </button>
          <button
            className={`ws-insights-period-btn ${period === '30d' ? 'active' : ''}`}
            onClick={() => setPeriod('30d')}
          >
            {isEn ? 'Last 30 Days' : 'آخر 30 يوماً'}
          </button>
          <button
            className={`ws-insights-period-btn ${period === 'custom' ? 'active' : ''}`}
            onClick={() => setPeriod('custom')}
          >
            📅 {isEn ? 'Custom Range' : 'فترة مخصصة'}
          </button>
        </div>

        {period === 'custom' && (
          <div className="ws-insights-custom-dates">
            <input
              type="date"
              className="ws-insights-date-input"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
            />
            <span>{isEn ? 'to' : 'إلى'}</span>
            <input
              type="date"
              className="ws-insights-date-input"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Sub Tabs Navigation */}
      <div className="ws-insights-tabs">
        <button className={`ws-insights-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
          📊 {isEn ? 'Summary Overview' : 'نظرة شاملة'}
        </button>
        <button className={`ws-insights-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 {isEn ? 'User Analytics' : 'تحليلات المستخدمين'}
        </button>
        <button className={`ws-insights-tab ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
          ❓ {isEn ? 'Questions & Topics' : 'الأسئلة والموضوعات'}
        </button>
        <button className={`ws-insights-tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          🤖 {isEn ? 'AI Performance' : 'أداء الذكاء الاصطناعي'}
        </button>
        <button className={`ws-insights-tab ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
          🎫 {isEn ? 'Support Cases' : 'حالات الدعم'}
        </button>
        <button className={`ws-insights-tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
          👔 {isEn ? 'Staff Performance' : 'أداء الموظفين'}
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="ws-insights-loading">
          <div className="ws-insights-spinner" />
          <p>{isEn ? 'Compiling real system analytics...' : 'جاري جمع وتحليل السجلات الفعلية للنظام...'}</p>
        </div>
      ) : (
        <div className="ws-insights-body">
          
          {/* TAB 1: SUMMARY OVERVIEW */}
          {activeTab === 'summary' && (
            <div className="ws-insights-summary-view">
              <div className="ws-insights-cards-grid">
                <div className="ws-insights-metric-card">
                  <span className="ws-insights-card-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>👥</span>
                  <div className="ws-insights-card-info">
                    <span className="ws-insights-card-label">{isEn ? 'Total Interacted Users' : 'إجمالي المستعلمين'}</span>
                    <span className="ws-insights-card-val">{userAnalytics?.total_users ?? 0}</span>
                    <small>{isEn ? 'Active in period:' : 'نشط خلال الفترة:'} {userAnalytics?.active_users_30d ?? 0}</small>
                  </div>
                </div>

                <div className="ws-insights-metric-card">
                  <span className="ws-insights-card-icon" style={{ background: '#F0FDF4', color: '#15803D' }}>🎯</span>
                  <div className="ws-insights-card-info">
                    <span className="ws-insights-card-label">{isEn ? 'AI Success Rate' : 'معدل الإجابة الناجحة'}</span>
                    <span className="ws-insights-card-val">{aiPerformance?.success_rate ?? 0}%</span>
                    <small>{aiPerformance?.high_confidence ?? 0} {isEn ? 'high confidence' : 'إجابة مؤكدة'}</small>
                  </div>
                </div>

                <div className="ws-insights-metric-card">
                  <span className="ws-insights-card-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>👤</span>
                  <div className="ws-insights-card-info">
                    <span className="ws-insights-card-label">{isEn ? 'Human Intervention Rate' : 'معدل التدخل البشري'}</span>
                    <span className="ws-insights-card-val">{humanIntervention?.intervention_rate ?? 0}%</span>
                    <small>{humanIntervention?.human_interventions ?? 0} {isEn ? 'conversations escalated' : 'محادثة تم تحويلها'}</small>
                  </div>
                </div>

                <div className="ws-insights-metric-card">
                  <span className="ws-insights-card-icon" style={{ background: '#FEE2E2', color: '#B91C1C' }}>⚠️</span>
                  <div className="ws-insights-card-info">
                    <span className="ws-insights-card-label">{isEn ? 'Support Cases Overdue' : 'حالات متأخرة (>12 ساعة)'}</span>
                    <span className="ws-insights-card-val" style={{ color: '#B91C1C' }}>{supportStats?.overdue_count ?? 0}</span>
                    <small>{isEn ? 'Total cases:' : 'إجمالي الحالات:'} {supportStats?.total ?? 0}</small>
                  </div>
                </div>
              </div>

              {/* Two Chart Columns */}
              <div className="ws-insights-charts-row">
                <div className="ws-insights-chart-panel">
                  <h3 className="ws-insights-panel-title">📈 {isEn ? 'User Interaction Growth' : 'نمو تفاعل المستعلمين'}</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <AreaChart data={userGrowthData}>
                        <defs>
                          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0878F9" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#0878F9" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                        <YAxis stroke="#94A3B8" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#0878F9" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="ws-insights-chart-panel">
                  <h3 className="ws-insights-panel-title">🎫 {isEn ? 'Support Cases Distribution' : 'توزيع حالات الدعم حسب الحالة'}</h3>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={caseStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {caseStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER ANALYTICS */}
          {activeTab === 'users' && (
            <div className="ws-insights-panel">
              <h3 className="ws-insights-panel-title">👥 {isEn ? 'Detailed User Engagement' : 'تحليلات وتفاعل المستخدمين'}</h3>
              <div className="ws-insights-kpis-row">
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Total End Users Ever Interacted' : 'إجمالي المستعلمين المتفاعلين مع الوكيل'}</span>
                  <strong>{userAnalytics?.total_users ?? 0}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Active Users in Selected Period' : 'المستخدمون النشطون خلال الفترة المحددة'}</span>
                  <strong>{userAnalytics?.active_users_30d ?? 0}</strong>
                </div>
              </div>

              <div style={{ width: '100%', height: 320, marginTop: 24 }}>
                <ResponsiveContainer>
                  <BarChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0878F9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: QUESTIONS & TOPICS */}
          {activeTab === 'questions' && (
            <div className="ws-insights-panel">
              <div className="ws-insights-panel-header">
                <div>
                  <h3 className="ws-insights-panel-title">❓ {isEn ? 'Questions History & Topics' : 'سجل الأسئلة والموضوعات المطروحة'}</h3>
                  <p className="ws-insights-panel-desc">
                    {isEn ? 'Click any question to open its original customer conversation.' : 'انقر على أي سؤال للانتقال ومراجعة المحادثة الأصلية للتحقق من السياق.'}
                  </p>
                </div>
                <span className="ws-insights-badge">{questionsData?.total_questions ?? 0} {isEn ? 'total questions' : 'سؤال مسجل'}</span>
              </div>

              <div className="ws-insights-questions-list">
                {!questionsData?.recent_questions?.length ? (
                  <p className="ws-insights-no-data">{isEn ? 'No questions recorded in this period.' : 'لا توجد أسئلة مسجلة في هذه الفترة.'}</p>
                ) : (
                  questionsData.recent_questions.map(q => (
                    <div
                      key={q.id}
                      className="ws-insights-question-row"
                      onClick={() => onNavigate && onNavigate('conversations')}
                    >
                      <div className="ws-insights-q-info">
                        <p className="ws-insights-q-text">"{q.content}"</p>
                        <div className="ws-insights-q-meta">
                          <span>👤 {q.conversation?.end_user?.name || (isEn ? 'Visitor' : 'مستعلم')}</span>
                          <span>📅 {new Date(q.created_at).toLocaleString(isEn ? 'en-US' : 'ar-SA')}</span>
                          <span>💬 المحادثة #{q.conversation_id}</span>
                        </div>
                      </div>
                      <button className="ws-insights-q-btn" title={isEn ? 'Open Conversation' : 'مراجعة المحادثة الأصلية'}>
                        {isEn ? 'View Chat ➔' : 'عرض المحادثة ➔'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AI PERFORMANCE */}
          {activeTab === 'ai' && (
            <div className="ws-insights-panel">
              <h3 className="ws-insights-panel-title">🤖 {isEn ? 'AI Resolution Accuracy' : 'أداء ودقة استجابات الذكاء الاصطناعي'}</h3>
              
              <div className="ws-insights-kpis-row">
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Total Answered' : 'الأسئلة المجاب عنها'}</span>
                  <strong>{aiPerformance?.total_answered ?? 0}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'High Confidence (>=70%)' : 'إجابات عالية الدقة والثقة'}</span>
                  <strong style={{ color: '#16A34A' }}>{aiPerformance?.high_confidence ?? 0}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Low Confidence (<50%)' : 'إجابات منخفضة الثقة'}</span>
                  <strong style={{ color: '#D97706' }}>{aiPerformance?.low_confidence ?? 0}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Unanswered / Incomplete' : 'أسئلة لم يُجب عنها بدقة'}</span>
                  <strong style={{ color: '#DC2626' }}>{aiPerformance?.unanswered ?? 0}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Success Rate' : 'معدل النجاح الإجمالي'}</span>
                  <strong style={{ color: '#0878F9' }}>{aiPerformance?.success_rate ?? 0}%</strong>
                </div>
              </div>

              <div style={{ width: '100%', height: 300, marginTop: 24 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={aiPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 5: SUPPORT CASES */}
          {activeTab === 'support' && (
            <div className="ws-insights-panel">
              <h3 className="ws-insights-panel-title">🎫 {isEn ? 'Support Cases Metrics' : 'مؤشرات حالات الدعم والتذاكر'}</h3>
              
              <div className="ws-insights-kpis-row">
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Total Cases' : 'إجمالي الحالات'}</span>
                  <strong>{supportStats?.total ?? 0}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Average Resolution Time' : 'متوسط زمن الحل'}</span>
                  <strong>{supportStats?.avg_resolution_hours ? `${supportStats.avg_resolution_hours} ${isEn ? 'hours' : 'ساعة'}` : '-'}</strong>
                </div>
                <div className="ws-insights-kpi-box">
                  <span>{isEn ? 'Overdue Cases (>12 Hours)' : 'حالات متأخرة لأكثر من ١٢ ساعة'}</span>
                  <strong style={{ color: '#B91C1C' }}>{supportStats?.overdue_count ?? 0}</strong>
                </div>
              </div>

              <div style={{ width: '100%', height: 300, marginTop: 24 }}>
                <ResponsiveContainer>
                  <BarChart data={caseStatusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0878F9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 6: STAFF PERFORMANCE */}
          {activeTab === 'staff' && (
            <div className="ws-insights-panel">
              <h3 className="ws-insights-panel-title">👔 {isEn ? 'Staff Performance & Workload' : 'أداء وإنتاجية الموظفين'}</h3>
              
              {staffData.length === 0 ? (
                <p className="ws-insights-no-data">{isEn ? 'No assigned support cases recorded for staff in this workspace.' : 'لا توجد حالات دعم مسندة للموظفين في هذه المساحة حالياً.'}</p>
              ) : (
                <div className="ws-insights-table-wrap">
                  <table className="ws-insights-table">
                    <thead>
                      <tr>
                        <th>{isEn ? 'Staff Member' : 'الموظف المسؤول'}</th>
                        <th>{isEn ? 'Assigned Cases' : 'الحالات المسندة'}</th>
                        <th>{isEn ? 'Closed Cases' : 'الحالات المغلقة'}</th>
                        <th>{isEn ? 'Open / In Progress' : 'قيد المعالجة'}</th>
                        <th>{isEn ? 'Overdue (>12h)' : 'حالات متأخرة'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.map(s => (
                        <tr key={s.assigned_staff_id}>
                          <td>
                            <strong>{s.assigned_staff?.name || `${isEn ? 'Staff' : 'موظف'} #${s.assigned_staff_id}`}</strong>
                            {s.assigned_staff?.email && <small style={{ display: 'block', color: '#64748B' }}>{s.assigned_staff.email}</small>}
                          </td>
                          <td><strong>{s.total_cases}</strong></td>
                          <td><span style={{ color: '#16A34A', fontWeight: 700 }}>{s.closed_cases}</span></td>
                          <td><span style={{ color: '#D97706', fontWeight: 700 }}>{s.open_cases}</span></td>
                          <td><span style={{ color: s.overdue_cases > 0 ? '#DC2626' : '#64748B', fontWeight: 700 }}>{s.overdue_cases}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
