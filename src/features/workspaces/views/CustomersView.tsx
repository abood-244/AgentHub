import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import { Users, Search, ShieldAlert, PauseCircle, PlayCircle, UserCheck, MessageSquare, AlertCircle } from 'lucide-react';
import './CustomersView.css';

interface ConversationBrief {
  id: number;
  handler: string;
  status: string;
  last_message_at: string;
  messages_count?: number;
}

interface SupportCaseBrief {
  id: number;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface EndUserItem {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  is_blocked: boolean;
  ai_responses_paused: boolean;
  conversations_count: number;
  support_cases_count: number;
  last_seen_at: string | null;
  created_at?: string;
  conversations?: ConversationBrief[];
  support_cases?: SupportCaseBrief[];
}

interface CustomersViewProps {
  workspaceId: string;
  onNavigate?: (section: any) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ workspaceId, onNavigate }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [users, setUsers] = useState<EndUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'blocked' | 'paused' | 'verified'>('all');

  // Modal detail
  const [selectedUser, setSelectedUser] = useState<EndUserItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'conversations' | 'cases'>('conversations');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [workspaceId, search, filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let url = `/workspaces/${workspaceId}/end-users?per_page=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filter === 'blocked') url += '&is_blocked=true';
      const res = await apiClient.get<{ data: EndUserItem[] }>(url);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (user: EndUserItem) => {
    setSelectedUser(user);
    try {
      setLoadingDetail(true);
      const res = await apiClient.get<{ data: EndUserItem }>(`/workspaces/${workspaceId}/end-users/${user.id}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error('Failed to load user detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleBlock = async (user: EndUserItem) => {
    try {
      setActionLoading(true);
      const action = user.is_blocked ? 'unblock' : 'block';
      const res = await apiClient.post<{ data: EndUserItem }>(`/workspaces/${workspaceId}/end-users/${user.id}/${action}`);
      setUsers(prev => prev.map(u => (u.id === user.id ? res.data : u)));
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAi = async (user: EndUserItem) => {
    try {
      setActionLoading(true);
      const action = user.ai_responses_paused ? 'resume-ai' : 'pause-ai';
      const res = await apiClient.post<{ data: EndUserItem }>(`/workspaces/${workspaceId}/end-users/${user.id}/${action}`);
      setUsers(prev => prev.map(u => (u.id === user.id ? res.data : u)));
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const isVerifiedUser = (user: EndUserItem) => {
    return Boolean(user.name || user.email || user.phone);
  };

  const filteredUsers = users.filter(u => {
    if (filter === 'paused') return u.ai_responses_paused;
    if (filter === 'verified') return isVerifiedUser(u);
    return true;
  });

  const totalCount = users.length;
  const blockedCount = users.filter(u => u.is_blocked).length;
  const pausedCount = users.filter(u => u.ai_responses_paused).length;
  const verifiedCount = users.filter(u => isVerifiedUser(u)).length;

  return (
    <div className="ws-cust-container" dir="rtl">
      {/* Header */}
      <div className="ws-cust-header">
        <div>
          <h1 className="ws-cust-title">{isEn ? 'Customer Management' : 'إدارة العملاء والمستعلمين'}</h1>
          <p className="ws-cust-subtitle">
            {isEn
              ? 'View customer identity, conversation history, support cases, and enforce security policies'
              : 'استعراض بيانات العملاء التشغيلية، ومتابعة سجل المحادثات وحالات الدعم المرتبطة، وضبط الحظر وردود الذكاء'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ws-cust-kpi-grid">
        <div className="ws-cust-kpi-card">
          <span className="ws-cust-kpi-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>👥</span>
          <div>
            <span className="ws-cust-kpi-label">{isEn ? 'Total Customers' : 'إجمالي العملاء'}</span>
            <strong className="ws-cust-kpi-val">{totalCount}</strong>
          </div>
        </div>
        <div className="ws-cust-kpi-card">
          <span className="ws-cust-kpi-icon" style={{ background: '#F0FDF4', color: '#15803D' }}>🛡️</span>
          <div>
            <span className="ws-cust-kpi-label">{isEn ? 'Identified / Verified' : 'هوية معروفة وموثقة'}</span>
            <strong className="ws-cust-kpi-val">{verifiedCount}</strong>
          </div>
        </div>
        <div className="ws-cust-kpi-card">
          <span className="ws-cust-kpi-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>⏸️</span>
          <div>
            <span className="ws-cust-kpi-label">{isEn ? 'AI Responses Paused' : 'الذكاء الاصطناعي متوقف'}</span>
            <strong className="ws-cust-kpi-val">{pausedCount}</strong>
          </div>
        </div>
        <div className="ws-cust-kpi-card">
          <span className="ws-cust-kpi-icon" style={{ background: '#FEE2E2', color: '#B91C1C' }}>🚫</span>
          <div>
            <span className="ws-cust-kpi-label">{isEn ? 'Blocked Users' : 'مستعلمون محظورون'}</span>
            <strong className="ws-cust-kpi-val" style={{ color: '#B91C1C' }}>{blockedCount}</strong>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="ws-cust-filters-bar">
        <div className="ws-cust-search-box">
          <Search size={18} color="#64748B" />
          <input
            className="ws-cust-search-input"
            placeholder={isEn ? 'Search by name, email, phone...' : 'بحث بالاسم، البريد أو الهاتف...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ws-cust-filter-chips">
          <button
            className={`ws-cust-filter-chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {isEn ? 'All' : 'الكل'}
          </button>
          <button
            className={`ws-cust-filter-chip ${filter === 'verified' ? 'active' : ''}`}
            onClick={() => setFilter('verified')}
          >
            {isEn ? 'Identified' : 'هوية معروفة'}
          </button>
          <button
            className={`ws-cust-filter-chip ${filter === 'paused' ? 'active' : ''}`}
            onClick={() => setFilter('paused')}
          >
            ⏸️ {isEn ? 'AI Paused' : 'الذكاء متوقف'}
          </button>
          <button
            className={`ws-cust-filter-chip ${filter === 'blocked' ? 'active' : ''}`}
            onClick={() => setFilter('blocked')}
          >
            🚫 {isEn ? 'Blocked' : 'محظور'}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="ws-view-loading">
          <div className="ws-view-spinner" />
          <p>{isEn ? 'Loading customers...' : 'جاري تحميل سجلات العملاء...'}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="ws-cust-empty">
          <Users size={48} style={{ color: '#94A3B8', marginBottom: 12 }} />
          <h3>{isEn ? 'No customers found' : 'لم يتم العثور على عملاء'}</h3>
          <p>{isEn ? 'Customer records will appear here as visitors interact with the web widget.' : 'ستظهر سجلات العملاء هنا تلقائياً عند تفاعل الزوار مع الودجت.'}</p>
        </div>
      ) : (
        <div className="ws-cust-card-list">
          {filteredUsers.map((user) => {
            const verified = isVerifiedUser(user);
            return (
              <div key={user.id} className="ws-cust-card" onClick={() => handleOpenDetail(user)}>
                <div className="ws-cust-card-header">
                  <div className="ws-cust-avatar">
                    <Users size={22} />
                  </div>

                  <div className="ws-cust-info">
                    <div className="ws-cust-title-row">
                      <span className="ws-cust-name">
                        {user.name || user.phone || user.email || `${isEn ? 'Anonymous Visitor' : 'زائر بدون هوية'} #${user.id}`}
                      </span>
                      {verified ? (
                        <span className="ws-cust-pill ws-cust-pill--verified">✓ {isEn ? 'Identified' : 'معروف'}</span>
                      ) : (
                        <span className="ws-cust-pill ws-cust-pill--anon">ℹ️ {isEn ? 'Anonymous' : 'مجهول'}</span>
                      )}
                      {user.is_blocked && (
                        <span className="ws-cust-pill ws-cust-pill--blocked">🚫 {isEn ? 'Blocked' : 'محظور'}</span>
                      )}
                      {user.ai_responses_paused && !user.is_blocked && (
                        <span className="ws-cust-pill ws-cust-pill--paused">⏸️ {isEn ? 'AI Paused' : 'الذكاء متوقف'}</span>
                      )}
                    </div>

                    <div className="ws-cust-meta">
                      {user.email && <span>📧 {user.email}</span>}
                      {user.phone && <span>📱 {user.phone}</span>}
                      <span>💬 {user.conversations_count} {isEn ? 'conversations' : 'محادثات'}</span>
                      <span>🎫 {user.support_cases_count} {isEn ? 'cases' : 'حالات دعم'}</span>
                      {user.last_seen_at && (
                        <span>🕒 {new Date(user.last_seen_at).toLocaleDateString(isEn ? 'en-US' : 'ar-SA')}</span>
                      )}
                    </div>
                  </div>

                  <div className="ws-cust-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`ws-cust-btn ${user.ai_responses_paused ? 'ws-cust-btn--active' : ''}`}
                      onClick={() => toggleAi(user)}
                      disabled={actionLoading || user.is_blocked}
                      title={user.ai_responses_paused ? (isEn ? 'Resume AI' : 'استئناف الذكاء') : (isEn ? 'Pause AI' : 'إيقاف الذكاء')}
                    >
                      {user.ai_responses_paused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                      {user.ai_responses_paused ? (isEn ? 'Resume AI' : 'استئناف الذكاء') : (isEn ? 'Pause AI' : 'إيقاف الذكاء')}
                    </button>

                    <button
                      className={`ws-cust-btn ${user.is_blocked ? 'ws-cust-btn--unblock' : 'ws-cust-btn--danger'}`}
                      onClick={() => toggleBlock(user)}
                      disabled={actionLoading}
                      title={user.is_blocked ? (isEn ? 'Unblock User' : 'إلغاء الحظر') : (isEn ? 'Block User' : 'حظر العميل')}
                    >
                      {user.is_blocked ? <UserCheck size={15} /> : <ShieldAlert size={15} />}
                      {user.is_blocked ? (isEn ? 'Unblock' : 'إلغاء الحظر') : (isEn ? 'Block' : 'حظر')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL */}
      {selectedUser && (
        <div className="ws-cust-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="ws-cust-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ws-cust-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="ws-cust-avatar" style={{ width: 44, height: 44 }}>
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="ws-cust-modal-title">
                    {selectedUser.name || selectedUser.phone || selectedUser.email || `العميل #${selectedUser.id}`}
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    {isVerifiedUser(selectedUser) ? 'هوية معتمدة' : 'زائر عبر الودجت - هوية غير مؤكدة'}
                  </span>
                </div>
              </div>
              <button className="ws-cust-modal-close" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            <div className="ws-cust-modal-body">
              {/* Notice */}
              <div className="ws-cust-verification-notice">
                ℹ️ {isEn
                  ? 'Customer identification is strictly derived when the channel provides verified data. Unauthenticated widget sessions remain isolated.'
                  : 'لا يفترض النظام وجود هوية موثقة للمستعلم إلا إذا وفرت القناة بيانات كافية (الاسم، البريد، أو الهاتف).'}
              </div>

              {/* Status Controls in Modal */}
              <div className="ws-cust-detail-actions">
                <button
                  className={`ws-cust-btn ${selectedUser.ai_responses_paused ? 'ws-cust-btn--active' : ''}`}
                  onClick={() => toggleAi(selectedUser)}
                  disabled={actionLoading || selectedUser.is_blocked}
                >
                  {selectedUser.ai_responses_paused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                  {selectedUser.ai_responses_paused ? (isEn ? 'Resume AI' : 'استئناف ردود الذكاء') : (isEn ? 'Pause AI' : 'إيقاف ردود الذكاء')}
                </button>

                <button
                  className={`ws-cust-btn ${selectedUser.is_blocked ? 'ws-cust-btn--unblock' : 'ws-cust-btn--danger'}`}
                  onClick={() => toggleBlock(selectedUser)}
                  disabled={actionLoading}
                >
                  {selectedUser.is_blocked ? <UserCheck size={15} /> : <ShieldAlert size={15} />}
                  {selectedUser.is_blocked ? (isEn ? 'Unblock User' : 'إلغاء حظر العميل') : (isEn ? 'Block User' : 'حظر العميل بالكامل')}
                </button>
              </div>

              {/* Tabs for Conversations & Support Cases */}
              <div className="ws-cust-tabs">
                <button
                  className={`ws-cust-tab ${activeModalTab === 'conversations' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('conversations')}
                >
                  <MessageSquare size={16} />
                  {isEn ? 'Associated Conversations' : 'المحادثات المرتبطة'} ({selectedUser.conversations?.length ?? selectedUser.conversations_count})
                </button>
                <button
                  className={`ws-cust-tab ${activeModalTab === 'cases' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('cases')}
                >
                  <AlertCircle size={16} />
                  {isEn ? 'Support Cases' : 'حالات الدعم'} ({selectedUser.support_cases?.length ?? selectedUser.support_cases_count})
                </button>
              </div>

              {/* Tab 1: Conversations */}
              {activeModalTab === 'conversations' && (
                <div className="ws-cust-tab-content">
                  {!selectedUser.conversations?.length ? (
                    <p className="ws-cust-no-items">{isEn ? 'No conversations found for this user.' : 'لا توجد محادثات مسجلة لهذا العميل.'}</p>
                  ) : (
                    <div className="ws-cust-items-list">
                      {selectedUser.conversations.map((conv) => (
                        <div key={conv.id} className="ws-cust-item-row">
                          <div>
                            <strong>{isEn ? 'Conversation' : 'محادثة'} #{conv.id}</strong>
                            <small>{conv.handler === 'ai' ? '🤖 ذكاء اصطناعي' : conv.handler === 'human' ? '👤 موظف بشري' : '👥 مشتركة'} · {new Date(conv.last_message_at).toLocaleDateString(isEn ? 'en-US' : 'ar-SA')}</small>
                          </div>
                          {onNavigate && (
                            <button
                              className="ws-cust-link-btn"
                              onClick={() => {
                                setSelectedUser(null);
                                onNavigate('conversations');
                              }}
                            >
                              {isEn ? 'Open Chat ➔' : 'فتح المحادثة ➔'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Support Cases */}
              {activeModalTab === 'cases' && (
                <div className="ws-cust-tab-content">
                  {!selectedUser.support_cases?.length ? (
                    <p className="ws-cust-no-items">{isEn ? 'No support cases opened for this user.' : 'لا توجد حالات دعم مفتوحة لهذا العميل.'}</p>
                  ) : (
                    <div className="ws-cust-items-list">
                      {selectedUser.support_cases.map((c) => (
                        <div key={c.id} className="ws-cust-item-row">
                          <div>
                            <span style={{ color: '#0878F9', fontWeight: 800, fontSize: 13 }}>{c.case_number}</span>
                            <strong>{c.title}</strong>
                            <small>{c.status === 'new' ? 'جديدة' : c.status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة'} · {new Date(c.created_at).toLocaleDateString(isEn ? 'en-US' : 'ar-SA')}</small>
                          </div>
                          {onNavigate && (
                            <button
                              className="ws-cust-link-btn"
                              onClick={() => {
                                setSelectedUser(null);
                                onNavigate('support-cases');
                              }}
                            >
                              {isEn ? 'View Case ➔' : 'عرض الحالة ➔'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
