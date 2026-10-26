import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import './SupportCasesView.css';

interface EndUser {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface StaffMember {
  id: number;
  name: string;
  email?: string;
}

interface CaseItem {
  id: number;
  case_number: string;
  title: string;
  description: string | null;
  category: string | null;
  summary: string | null;
  required_action: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'closed';
  source: 'manual' | 'automatic';
  assigned_staff_id?: number | null;
  assigned_staff?: StaffMember | null;
  end_user_id?: number | null;
  end_user?: EndUser | null;
  conversation_id?: number | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

interface CaseLog {
  id: number;
  action: string;
  details?: any;
  created_at: string;
  performed_by?: { id: number; name: string } | null;
}

interface CaseStats {
  total: number;
  new: number;
  in_progress: number;
  closed: number;
  overdue_12h?: number;
}

interface SupportCasesViewProps {
  workspaceId: string;
  onNavigate?: (section: any) => void;
}

export const SupportCasesView: React.FC<SupportCasesViewProps> = ({ workspaceId, onNavigate }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [stats, setStats] = useState<CaseStats>({ total: 0, new: 0, in_progress: 0, closed: 0 });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [endUsersList, setEndUsersList] = useState<EndUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Layout
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [caseLogs, setCaseLogs] = useState<CaseLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    category: '',
    summary: '',
    required_action: '',
    priority: 'medium',
    end_user_id: '',
    assigned_staff_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
    loadStaffMembers();
    loadEndUsers();
  }, [workspaceId]);

  const showBanner = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        apiClient.get<{ data: CaseItem[] }>(`/workspaces/${workspaceId}/support-cases?per_page=100`),
        apiClient.get<{ data: CaseStats }>(`/workspaces/${workspaceId}/support-cases/stats`),
      ]);
      setCases(casesRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error('Failed to load support cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffMembers = async () => {
    try {
      const res = await apiClient.get<{ members: { user: StaffMember }[] }>(`/workspaces/${workspaceId}/members`);
      if (res.members) {
        setStaffList(res.members.map(m => m.user));
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const loadEndUsers = async () => {
    try {
      const res = await apiClient.get<{ data: EndUser[] }>(`/workspaces/${workspaceId}/end-users?per_page=50`);
      setEndUsersList(res.data);
    } catch (err) {
      console.error('Failed to load end users:', err);
    }
  };

  const loadCaseLogs = async (caseId: number) => {
    try {
      setLoadingLogs(true);
      const res = await apiClient.get<{ data: CaseLog[] }>(`/workspaces/${workspaceId}/support-cases/${caseId}/logs`);
      setCaseLogs(res.data);
    } catch (err) {
      console.error('Failed to load case logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleOpenCaseDetail = (c: CaseItem) => {
    setSelectedCase(c);
    loadCaseLogs(c.id);
  };

  const handleStatusChange = async (caseId: number, newStatus: 'new' | 'in_progress' | 'closed') => {
    try {
      const res = await apiClient.post<{ data: CaseItem }>(
        `/workspaces/${workspaceId}/support-cases/${caseId}/status`,
        { status: newStatus }
      );
      showBanner('success', isEn ? `Status updated to ${newStatus}` : `تم تحديث حالة المشكلة بنجاح`);
      
      // Update state
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase(res.data);
        loadCaseLogs(caseId);
      }
      setCases(prev => prev.map(c => (c.id === caseId ? res.data : c)));
      
      // Refresh stats
      const statsRes = await apiClient.get<{ data: CaseStats }>(`/workspaces/${workspaceId}/support-cases/stats`);
      setStats(statsRes.data);
    } catch (err: any) {
      showBanner('error', err.message || (isEn ? 'Invalid transition' : 'لا يمكن تغيير الحالة بهذا الشكل'));
    }
  };

  const handleAssignStaff = async (caseId: number, staffId: number) => {
    try {
      const res = await apiClient.post<{ data: CaseItem }>(
        `/workspaces/${workspaceId}/support-cases/${caseId}/assign`,
        { assigned_staff_id: staffId }
      );
      showBanner('success', isEn ? 'Staff member assigned & notified' : 'تم إسناد الحالة وإشعار الموظف بنجاح');
      
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase(res.data);
        loadCaseLogs(caseId);
      }
      setCases(prev => prev.map(c => (c.id === caseId ? res.data : c)));
    } catch (err: any) {
      showBanner('error', err.message || (isEn ? 'Assignment failed' : 'فشل إسناد الموظف'));
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.title.trim()) {
      showBanner('error', isEn ? 'Case title is required' : 'عنوان الحالة مطلوب');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        title: newCase.title.trim(),
        description: newCase.description.trim() || null,
        category: newCase.category.trim() || null,
        summary: newCase.summary.trim() || null,
        required_action: newCase.required_action.trim() || null,
        priority: newCase.priority,
      };
      if (newCase.end_user_id) payload.end_user_id = Number(newCase.end_user_id);
      if (newCase.assigned_staff_id) payload.assigned_staff_id = Number(newCase.assigned_staff_id);

      await apiClient.post(`/workspaces/${workspaceId}/support-cases`, payload);
      showBanner('success', isEn ? 'Support case created successfully' : 'تم إنشاء حالة الدعم بنجاح');
      
      setShowCreate(false);
      setNewCase({
        title: '',
        description: '',
        category: '',
        summary: '',
        required_action: '',
        priority: 'medium',
        end_user_id: '',
        assigned_staff_id: '',
      });
      loadData();
    } catch (err: any) {
      showBanner('error', err.message || (isEn ? 'Failed to create case' : 'فشل إنشاء حالة الدعم'));
    } finally {
      setSaving(false);
    }
  };

  // Helper calculations
  const calculateOverdue12h = () => {
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    return cases.filter(c => c.status !== 'closed' && new Date(c.created_at).getTime() < twelveHoursAgo).length;
  };

  const priorityMeta: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: isEn ? 'Low' : 'منخفضة', color: '#475569', bg: '#F1F5F9' },
    medium: { label: isEn ? 'Medium' : 'متوسطة', color: '#B45309', bg: '#FEF3C7' },
    high: { label: isEn ? 'High' : 'عالية', color: '#C2410C', bg: '#FFEDD5' },
    urgent: { label: isEn ? 'Urgent' : 'حرجة / عاجلة', color: '#B91C1C', bg: '#FEE2E2' },
  };

  const statusCols = [
    { key: 'new', label: isEn ? 'New Cases' : 'حالات جديدة', color: '#0878F9', bg: '#EFF6FF' },
    { key: 'in_progress', label: isEn ? 'In Progress' : 'قيد المعالجة', color: '#D97706', bg: '#FFFBEB' },
    { key: 'closed', label: isEn ? 'Closed / Resolved' : 'مغلقة ومحلولة', color: '#16A34A', bg: '#F0FDF4' },
  ];

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.case_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesStaff = staffFilter === 'all' || (staffFilter === 'unassigned' ? !c.assigned_staff_id : String(c.assigned_staff_id) === staffFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesStaff;
  });

  return (
    <div className="ws-cases-container">
      {/* Top Header */}
      <div className="ws-cases-header">
        <div>
          <h1 className="ws-cases-title">{isEn ? 'Support Cases' : 'إدارة حالات الدعم والتذاكر'}</h1>
          <p className="ws-cases-subtitle">
            {isEn
              ? 'Structured incident management, automatic/manual triage, staff routing, and resolution tracking'
              : 'إدارة وتتبع حالات الدعم المحالة، والفرز الآلي/اليدوي، وتكليف الموظفين، وسجلات المتابعة'}
          </p>
        </div>
        <div className="ws-cases-top-actions">
          <div className="ws-cases-view-toggle">
            <button
              className={`ws-cases-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title={isEn ? 'Kanban Board' : 'لوحة كانبان'}
            >
              📋 {isEn ? 'Kanban' : 'كانبان'}
            </button>
            <button
              className={`ws-cases-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title={isEn ? 'List View' : 'قائمة جدولية'}
            >
              📄 {isEn ? 'List' : 'قائمة'}
            </button>
          </div>
          <button className="ws-cases-btn ws-cases-btn--primary" onClick={() => setShowCreate(true)}>
            + {isEn ? 'New Support Case' : 'إنشاء حالة جديدة'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`ws-cases-alert ws-cases-alert--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="ws-cases-kpi-grid">
        <div className="ws-cases-kpi-card">
          <div className="ws-cases-kpi-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>🎫</div>
          <div className="ws-cases-kpi-info">
            <span className="ws-cases-kpi-label">{isEn ? 'Total Cases' : 'إجمالي الحالات'}</span>
            <span className="ws-cases-kpi-val">{stats.total}</span>
          </div>
        </div>

        <div className="ws-cases-kpi-card">
          <div className="ws-cases-kpi-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>🆕</div>
          <div className="ws-cases-kpi-info">
            <span className="ws-cases-kpi-label">{isEn ? 'New Cases' : 'حالات جديدة'}</span>
            <span className="ws-cases-kpi-val">{stats.new}</span>
          </div>
        </div>

        <div className="ws-cases-kpi-card">
          <div className="ws-cases-kpi-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>⏳</div>
          <div className="ws-cases-kpi-info">
            <span className="ws-cases-kpi-label">{isEn ? 'In Progress' : 'قيد المعالجة'}</span>
            <span className="ws-cases-kpi-val">{stats.in_progress}</span>
          </div>
        </div>

        <div className="ws-cases-kpi-card">
          <div className="ws-cases-kpi-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>✅</div>
          <div className="ws-cases-kpi-info">
            <span className="ws-cases-kpi-label">{isEn ? 'Closed / Resolved' : 'مغلقة ومحلولة'}</span>
            <span className="ws-cases-kpi-val">{stats.closed}</span>
          </div>
        </div>

        <div className="ws-cases-kpi-card">
          <div className="ws-cases-kpi-icon" style={{ background: '#FEE2E2', color: '#B91C1C' }}>⚠️</div>
          <div className="ws-cases-kpi-info">
            <span className="ws-cases-kpi-label">{isEn ? 'Open > 12 Hours' : 'مفتوحة لأكثر من ١٢ ساعة'}</span>
            <span className="ws-cases-kpi-val" style={{ color: '#B91C1C' }}>{calculateOverdue12h()}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ws-cases-filters-bar">
        <div className="ws-cases-search-box">
          <span className="ws-cases-search-icon">🔍</span>
          <input
            type="text"
            className="ws-cases-search-input"
            placeholder={isEn ? 'Search by case title or number (SC-xxx)...' : 'بحث برقم الحالة أو العنوان...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="ws-cases-filter-selects">
          <select
            className="ws-cases-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">{isEn ? 'All Statuses' : 'كافة الحالات'}</option>
            <option value="new">{isEn ? 'New' : 'جديدة'}</option>
            <option value="in_progress">{isEn ? 'In Progress' : 'قيد المعالجة'}</option>
            <option value="closed">{isEn ? 'Closed' : 'مغلقة'}</option>
          </select>

          <select
            className="ws-cases-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="all">{isEn ? 'All Priorities' : 'كافة الأولويات'}</option>
            <option value="low">{isEn ? 'Low' : 'منخفضة'}</option>
            <option value="medium">{isEn ? 'Medium' : 'متوسطة'}</option>
            <option value="high">{isEn ? 'High' : 'عالية'}</option>
            <option value="urgent">{isEn ? 'Urgent' : 'حرجة'}</option>
          </select>

          <select
            className="ws-cases-select"
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
          >
            <option value="all">{isEn ? 'All Staff' : 'كافة الموظفين'}</option>
            <option value="unassigned">{isEn ? 'Unassigned' : 'غير مسندة'}</option>
            {staffList.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="ws-cases-loading">
          <div className="ws-cases-spinner" />
          <p>{isEn ? 'Loading support cases...' : 'جاري تحميل حالات الدعم...'}</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="ws-cases-empty">
          <span style={{ fontSize: 48 }}>📂</span>
          <h3>{isEn ? 'No support cases found' : 'لا توجد حالات مطابقة'}</h3>
          <p>{isEn ? 'Create a support case or adjust your filters.' : 'أنشئ حالة دعم جديدة أو عدل خيارات البحث.'}</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="ws-cases-kanban-board">
          {statusCols.map(col => {
            const colCases = filteredCases.filter(c => c.status === col.key);
            return (
              <div key={col.key} className="ws-cases-kanban-col">
                <div className="ws-cases-kanban-col-header" style={{ borderTopColor: col.color }}>
                  <div className="ws-cases-col-title-wrap">
                    <span className="ws-cases-col-dot" style={{ background: col.color }} />
                    <span className="ws-cases-col-title">{col.label}</span>
                  </div>
                  <span className="ws-cases-col-count">{colCases.length}</span>
                </div>

                <div className="ws-cases-kanban-cards-wrap">
                  {colCases.map(c => (
                    <div
                      key={c.id}
                      className="ws-cases-card"
                      onClick={() => handleOpenCaseDetail(c)}
                    >
                      <div className="ws-cases-card-header">
                        <span className="ws-cases-number">{c.case_number}</span>
                        <span
                          className="ws-cases-priority-pill"
                          style={{
                            color: priorityMeta[c.priority]?.color,
                            background: priorityMeta[c.priority]?.bg,
                          }}
                        >
                          {priorityMeta[c.priority]?.label}
                        </span>
                      </div>

                      <h4 className="ws-cases-card-title">{c.title}</h4>

                      {c.summary && <p className="ws-cases-card-summary">{c.summary}</p>}

                      <div className="ws-cases-card-footer">
                        <div className="ws-cases-card-staff">
                          <span className="ws-cases-staff-icon">👤</span>
                          <span>{c.assigned_staff?.name || (isEn ? 'Unassigned' : 'غير مسند')}</span>
                        </div>
                        <span className="ws-cases-source-badge">
                          {c.source === 'automatic' ? '🤖 تلقائي' : '✍️ يدوي'}
                        </span>
                      </div>

                      {/* Quick Status Action Buttons */}
                      <div className="ws-cases-card-quick-actions" onClick={e => e.stopPropagation()}>
                        {col.key === 'new' && (
                          <button
                            className="ws-cases-stage-btn"
                            onClick={() => handleStatusChange(c.id, 'in_progress')}
                          >
                            ▶ {isEn ? 'Start' : 'بدء المعالجة'}
                          </button>
                        )}
                        {col.key === 'in_progress' && (
                          <button
                            className="ws-cases-stage-btn ws-cases-stage-btn--success"
                            onClick={() => handleStatusChange(c.id, 'closed')}
                          >
                            ✓ {isEn ? 'Close' : 'إغلاق وحل'}
                          </button>
                        )}
                        {col.key === 'closed' && (
                          <button
                            className="ws-cases-stage-btn ws-cases-stage-btn--reopen"
                            onClick={() => handleStatusChange(c.id, 'new')}
                          >
                            ↺ {isEn ? 'Reopen' : 'إعادة فتح'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="ws-cases-table-wrap">
          <table className="ws-cases-table">
            <thead>
              <tr>
                <th>{isEn ? 'Case Number' : 'رقم الحالة'}</th>
                <th>{isEn ? 'Title' : 'العنوان'}</th>
                <th>{isEn ? 'Customer' : 'العميل المستعلم'}</th>
                <th>{isEn ? 'Priority' : 'الأولوية'}</th>
                <th>{isEn ? 'Status' : 'الحالة'}</th>
                <th>{isEn ? 'Assigned Staff' : 'الموظف المسؤول'}</th>
                <th>{isEn ? 'Source' : 'المصدر'}</th>
                <th>{isEn ? 'Date' : 'تاريخ الإنشاء'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => (
                <tr key={c.id} onClick={() => handleOpenCaseDetail(c)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="ws-cases-number">{c.case_number}</span>
                  </td>
                  <td>
                    <strong>{c.title}</strong>
                    {c.category && <small className="ws-cases-tbl-cat">{c.category}</small>}
                  </td>
                  <td>{c.end_user?.name || c.end_user?.phone || '-'}</td>
                  <td>
                    <span
                      className="ws-cases-priority-pill"
                      style={{
                        color: priorityMeta[c.priority]?.color,
                        background: priorityMeta[c.priority]?.bg,
                      }}
                    >
                      {priorityMeta[c.priority]?.label}
                    </span>
                  </td>
                  <td>
                    <span className={`ws-cases-status-badge ${c.status}`}>
                      {c.status === 'new' ? (isEn ? 'New' : 'جديدة') : c.status === 'in_progress' ? (isEn ? 'In Progress' : 'قيد المعالجة') : (isEn ? 'Closed' : 'مغلقة')}
                    </span>
                  </td>
                  <td>{c.assigned_staff?.name || (isEn ? 'Unassigned' : 'غير مسند')}</td>
                  <td>{c.source === 'automatic' ? '🤖 تلقائي' : '✍️ يدوي'}</td>
                  <td>{new Date(c.created_at).toLocaleDateString(isEn ? 'en-US' : 'ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL & FOLLOW-UP LOGS MODAL */}
      {selectedCase && (
        <div className="ws-cases-modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="ws-cases-modal ws-cases-modal--lg" onClick={e => e.stopPropagation()}>
            <div className="ws-cases-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="ws-cases-number" style={{ fontSize: 16 }}>{selectedCase.case_number}</span>
                  <span className={`ws-cases-status-badge ${selectedCase.status}`}>
                    {selectedCase.status === 'new' ? 'جديدة' : selectedCase.status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة ومحلولة'}
                  </span>
                </div>
                <h3 className="ws-cases-modal-title" style={{ marginTop: 4 }}>{selectedCase.title}</h3>
              </div>
              <button className="ws-cases-modal-close" onClick={() => setSelectedCase(null)}>✕</button>
            </div>

            <div className="ws-cases-modal-body">
              {/* Top Details Card */}
              <div className="ws-cases-detail-grid">
                <div className="ws-cases-detail-item">
                  <span>{isEn ? 'Customer:' : 'العميل المرتبط:'}</span>
                  <strong>{selectedCase.end_user?.name || selectedCase.end_user?.phone || (isEn ? 'General Inquiry' : 'استفسار عام')}</strong>
                </div>
                <div className="ws-cases-detail-item">
                  <span>{isEn ? 'Category:' : 'تصنيف المشكلة:'}</span>
                  <strong>{selectedCase.category || (isEn ? 'Not specified' : 'غير محدد')}</strong>
                </div>
                <div className="ws-cases-detail-item">
                  <span>{isEn ? 'Source:' : 'مصدر الحالة:'}</span>
                  <strong>{selectedCase.source === 'automatic' ? (isEn ? 'AI Automatic Extraction' : 'إنشاء تلقائي عبر الوكيل') : (isEn ? 'Manual Staff Entry' : 'إنشاء يدوي')}</strong>
                </div>
                <div className="ws-cases-detail-item">
                  <span>{isEn ? 'Created At:' : 'تاريخ الإنشاء:'}</span>
                  <strong>{new Date(selectedCase.created_at).toLocaleString(isEn ? 'en-US' : 'ar-SA')}</strong>
                </div>
              </div>

              {/* Description & Summary */}
              {selectedCase.description && (
                <div className="ws-cases-section-block">
                  <h4>{isEn ? 'Problem Description' : 'وصف المشكلة الكامل'}</h4>
                  <p>{selectedCase.description}</p>
                </div>
              )}

              {selectedCase.summary && (
                <div className="ws-cases-section-block">
                  <h4>{isEn ? 'Problem Summary' : 'ملخص المشكلة'}</h4>
                  <p>{selectedCase.summary}</p>
                </div>
              )}

              {selectedCase.required_action && (
                <div className="ws-cases-section-block" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <h4 style={{ color: '#92400E' }}>{isEn ? 'Required Action' : 'الإجراء المطلوب اتخاذه'}</h4>
                  <p>{selectedCase.required_action}</p>
                </div>
              )}

              {/* Navigate to original conversation if linked */}
              {selectedCase.conversation_id && onNavigate && (
                <div className="ws-cases-conv-link">
                  <span>💬 {isEn ? 'This case was triggered from a live conversation.' : 'هذه الحالة مرتبطة بمحادثة عميل مباشرة.'}</span>
                  <button
                    className="ws-cases-btn ws-cases-btn--outline"
                    onClick={() => {
                      setSelectedCase(null);
                      onNavigate('conversations');
                    }}
                  >
                    {isEn ? 'Open Original Conversation ➔' : 'الانتقال إلى المحادثة الأصلية ➔'}
                  </button>
                </div>
              )}

              {/* Staff Assignment & Lifecycle Management Controls */}
              <div className="ws-cases-management-row">
                <div className="ws-cases-mgmt-box">
                  <label>{isEn ? 'Responsible Staff Member:' : 'الموظف المسؤول:'}</label>
                  <select
                    className="ws-cases-select"
                    value={selectedCase.assigned_staff_id ? String(selectedCase.assigned_staff_id) : ''}
                    onChange={e => handleAssignStaff(selectedCase.id, Number(e.target.value))}
                  >
                    <option value="">{isEn ? 'Select Staff Member...' : 'اختر موظفاً للإسناد...'}</option>
                    {staffList.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>

                <div className="ws-cases-mgmt-box">
                  <label>{isEn ? 'Lifecycle State Transition:' : 'تغيير حالة المعالجة:'}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`ws-cases-stage-btn ${selectedCase.status === 'new' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedCase.id, 'new')}
                      disabled={selectedCase.status === 'new'}
                    >
                      {isEn ? 'New' : 'جديدة'}
                    </button>
                    <button
                      className={`ws-cases-stage-btn ${selectedCase.status === 'in_progress' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedCase.id, 'in_progress')}
                      disabled={selectedCase.status === 'in_progress'}
                    >
                      {isEn ? 'In Progress' : 'قيد المعالجة'}
                    </button>
                    <button
                      className={`ws-cases-stage-btn ws-cases-stage-btn--success ${selectedCase.status === 'closed' ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedCase.id, 'closed')}
                      disabled={selectedCase.status === 'closed'}
                    >
                      {isEn ? 'Closed' : 'مغلقة ومحلولة'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Follow-up Timeline History (سجل المتابعة) */}
              <div className="ws-cases-logs-section">
                <h4>📜 {isEn ? 'Case Follow-up History' : 'سجل المتابعة والإجراءات'}</h4>
                {loadingLogs ? (
                  <div className="ws-cases-loading" style={{ padding: 20 }}>
                    <div className="ws-cases-spinner" />
                  </div>
                ) : caseLogs.length === 0 ? (
                  <p className="ws-cases-no-logs">{isEn ? 'No follow-up records logged yet.' : 'لا توجد سجلات متابعة مسجلة حتى الآن.'}</p>
                ) : (
                  <div className="ws-cases-timeline">
                    {caseLogs.map(log => (
                      <div key={log.id} className="ws-cases-timeline-item">
                        <div className="ws-cases-timeline-dot" />
                        <div className="ws-cases-timeline-content">
                          <div className="ws-cases-timeline-meta">
                            <strong>
                              {log.action === 'created' ? (isEn ? 'Case Created' : 'تم إنشاء الحالة')
                                : log.action === 'assigned' ? (isEn ? 'Staff Assigned' : 'تم إسناد الحالة لموظف')
                                : log.action === 'status_changed' ? (isEn ? 'Status Updated' : 'تم تغيير الحالة')
                                : log.action}
                            </strong>
                            <small>{new Date(log.created_at).toLocaleString(isEn ? 'en-US' : 'ar-SA')}</small>
                          </div>
                          {log.performed_by && (
                            <span className="ws-cases-log-user">
                              بواسطة: {log.performed_by.name}
                            </span>
                          )}
                          {log.details && (
                            <pre className="ws-cases-log-details">{JSON.stringify(log.details, null, 2)}</pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL CASE MODAL */}
      {showCreate && (
        <div className="ws-cases-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="ws-cases-modal" onClick={e => e.stopPropagation()}>
            <div className="ws-cases-modal-header">
              <h3 className="ws-cases-modal-title">{isEn ? 'Create Support Case' : 'إنشاء حالة دعم يدوية'}</h3>
              <button className="ws-cases-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCase} className="ws-cases-modal-body">
              <div className="ws-cases-form-group">
                <label className="ws-cases-label">{isEn ? 'Case Title' : 'عنوان الحالة'} *</label>
                <input
                  type="text"
                  className="ws-cases-input"
                  placeholder={isEn ? 'e.g. Student tuition portal payment error' : 'مثال: تعذر سداد الرسوم عبر البوابة الإلكترونية'}
                  value={newCase.title}
                  onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                  required
                />
              </div>

              <div className="ws-cases-form-row">
                <div className="ws-cases-form-group">
                  <label className="ws-cases-label">{isEn ? 'Problem Category' : 'تصنيف المشكلة'}</label>
                  <input
                    type="text"
                    className="ws-cases-input"
                    placeholder={isEn ? 'e.g. Admission, Technical, Finance' : 'مثال: قبول وتسجيل، تقني، مالي'}
                    value={newCase.category}
                    onChange={e => setNewCase({ ...newCase, category: e.target.value })}
                  />
                </div>

                <div className="ws-cases-form-group">
                  <label className="ws-cases-label">{isEn ? 'Priority' : 'الأولوية'}</label>
                  <select
                    className="ws-cases-select"
                    value={newCase.priority}
                    onChange={e => setNewCase({ ...newCase, priority: e.target.value as any })}
                  >
                    <option value="low">{isEn ? 'Low' : 'منخفضة'}</option>
                    <option value="medium">{isEn ? 'Medium' : 'متوسطة'}</option>
                    <option value="high">{isEn ? 'High' : 'عالية'}</option>
                    <option value="urgent">{isEn ? 'Urgent' : 'حرجة'}</option>
                  </select>
                </div>
              </div>

              <div className="ws-cases-form-group">
                <label className="ws-cases-label">{isEn ? 'Associated Customer (Optional)' : 'العميل المستعلم (اختياري)'}</label>
                <select
                  className="ws-cases-select"
                  value={newCase.end_user_id}
                  onChange={e => setNewCase({ ...newCase, end_user_id: e.target.value })}
                >
                  <option value="">{isEn ? '-- Select Customer --' : '-- اختر العميل --'}</option>
                  {endUsersList.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.name || u.phone || `Customer #${u.id}`}</option>
                  ))}
                </select>
              </div>

              <div className="ws-cases-form-group">
                <label className="ws-cases-label">{isEn ? 'Assign to Staff (Optional)' : 'إسناد لموظف (اختياري)'}</label>
                <select
                  className="ws-cases-select"
                  value={newCase.assigned_staff_id}
                  onChange={e => setNewCase({ ...newCase, assigned_staff_id: e.target.value })}
                >
                  <option value="">{isEn ? '-- Select Staff Member --' : '-- اختر الموظف المسؤول --'}</option>
                  {staffList.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div className="ws-cases-form-group">
                <label className="ws-cases-label">{isEn ? 'Description' : 'الوصف التفصيلي'}</label>
                <textarea
                  className="ws-cases-textarea"
                  placeholder={isEn ? 'Enter problem description...' : 'أدخل وصف المشكلة بدقة...'}
                  value={newCase.description}
                  onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="ws-cases-form-group">
                <label className="ws-cases-label">{isEn ? 'Required Action' : 'الإجراء المطلوب'}</label>
                <input
                  type="text"
                  className="ws-cases-input"
                  placeholder={isEn ? 'e.g. Contact IT department to reset password' : 'مثال: التواصل مع تقنية المعلومات لإعادة تعيين الحساب'}
                  value={newCase.required_action}
                  onChange={e => setNewCase({ ...newCase, required_action: e.target.value })}
                />
              </div>

              <div className="ws-cases-form-actions">
                <button
                  type="button"
                  className="ws-cases-btn ws-cases-btn--secondary"
                  onClick={() => setShowCreate(false)}
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
                <button
                  type="submit"
                  className="ws-cases-btn ws-cases-btn--primary"
                  disabled={saving}
                >
                  {saving ? '...' : (isEn ? 'Create Case' : 'إنشاء الحالة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
