import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import './ConversationsView.css';

interface EndUser {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  is_blocked: boolean;
  ai_responses_paused: boolean;
  avatar_url?: string | null;
}

interface ConversationItem {
  id: number;
  handler: 'ai' | 'human' | 'mixed';
  status: 'open' | 'waiting' | 'resolved' | 'closed';
  last_message_at: string;
  messages_count: number;
  end_user?: EndUser;
  assigned_staff?: { id: number; name: string } | null;
  last_message_snippet?: string;
}

interface MessageItem {
  id: number;
  sender_type: 'end_user' | 'ai' | 'staff' | 'system';
  content: string;
  confidence_score: number | null;
  created_at: string;
}

interface ConversationsViewProps {
  workspaceId: string;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({ workspaceId }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filters & Search
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Messaging & Controls
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Mobile View Toggle
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [workspaceId, filter, search]);

  const showAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      let url = `/workspaces/${workspaceId}/conversations?per_page=50`;
      if (filter === 'ai' || filter === 'human' || filter === 'mixed') {
        url += `&handler=${filter}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await apiClient.get<{ data: ConversationItem[] }>(url);
      setConversations(res.data);

      // If user selected was updated, refresh reference
      if (selectedConv) {
        const updated = res.data.find(c => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conv: ConversationItem) => {
    setSelectedConv(conv);
    setMobileChatOpen(true);
    try {
      setLoadingMessages(true);
      const res = await apiClient.get<{ data: MessageItem[] }>(
        `/workspaces/${workspaceId}/conversations/${conv.id}/messages?per_page=100`
      );
      setMessages(res.data);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      showAlert('error', isEn ? 'Failed to load messages' : 'فشل تحميل الرسائل');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    if (selectedConv.end_user?.is_blocked) {
      showAlert('error', isEn ? 'Cannot send messages to a blocked user' : 'لا يمكن إرسال رسالة إلى مستخدم محظور');
      return;
    }

    try {
      setSending(true);
      const res = await apiClient.post<{ data: MessageItem }>(
        `/workspaces/${workspaceId}/conversations/${selectedConv.id}/messages`,
        { content: replyText.trim() }
      );
      setMessages(prev => [...prev, res.data]);
      setReplyText('');
      loadConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      showAlert('error', err.message || (isEn ? 'Failed to send message' : 'فشل إرسال الرسالة'));
    } finally {
      setSending(false);
    }
  };

  // Block / Unblock User
  const handleToggleBlock = async () => {
    const user = selectedConv?.end_user;
    if (!user) return;

    const willBlock = !user.is_blocked;
    const confirmText = willBlock
      ? (isEn ? `Are you sure you want to block ${user.name || 'this user'} completely? Their messages will not reach the system.` : `هل أنت متأكد من حظر ${user.name || 'هذا المستعلم'} بالكامل؟ لن تصل رسائله للنظام ولن يستقبل أي ردود.`)
      : (isEn ? `Unblock ${user.name || 'this user'}?` : `هل تريد إلغاء حظر ${user.name || 'هذا المستعلم'}؟`);

    if (!confirm(confirmText)) return;

    try {
      setActionLoading(true);
      const endpoint = willBlock
        ? `/workspaces/${workspaceId}/end-users/${user.id}/block`
        : `/workspaces/${workspaceId}/end-users/${user.id}/unblock`;

      const res = await apiClient.post<{ data: EndUser }>(endpoint, {});
      
      // Update local state
      if (selectedConv) {
        const updatedConv: ConversationItem = {
          ...selectedConv,
          end_user: res.data,
        };
        setSelectedConv(updatedConv);
      }
      setConversations(prev =>
        prev.map(c => (c.end_user?.id === user.id ? { ...c, end_user: res.data } : c))
      );

      showAlert('success', willBlock
        ? (isEn ? 'User blocked completely.' : 'تم حظر المستعلم بالكامل ومنع رسائله.')
        : (isEn ? 'User unblocked successfully.' : 'تم إلغاء حظر المستعلم بنجاح.')
      );
    } catch (err: any) {
      showAlert('error', err.message || (isEn ? 'Action failed' : 'فشل تنفيذ الإجراء'));
    } finally {
      setActionLoading(false);
    }
  };

  // Pause / Resume AI Responses
  const handleTogglePauseAi = async () => {
    const user = selectedConv?.end_user;
    if (!user) return;

    const willPause = !user.ai_responses_paused;
    try {
      setActionLoading(true);
      const endpoint = willPause
        ? `/workspaces/${workspaceId}/end-users/${user.id}/pause-ai`
        : `/workspaces/${workspaceId}/end-users/${user.id}/resume-ai`;

      const res = await apiClient.post<{ data: EndUser }>(endpoint, {});

      // Update local state
      if (selectedConv) {
        const updatedConv: ConversationItem = {
          ...selectedConv,
          end_user: res.data,
        };
        setSelectedConv(updatedConv);
      }
      setConversations(prev =>
        prev.map(c => (c.end_user?.id === user.id ? { ...c, end_user: res.data } : c))
      );

      showAlert('success', willPause
        ? (isEn ? 'AI responses paused for this user.' : 'تم إيقاف ردود الذكاء الاصطناعي لهذا المستعلم.')
        : (isEn ? 'AI responses resumed for this user.' : 'تم استئناف ردود الذكاء الاصطناعي لهذا المستعلم.')
      );
    } catch (err: any) {
      showAlert('error', err.message || (isEn ? 'Action failed' : 'فشل تنفيذ الإجراء'));
    } finally {
      setActionLoading(false);
    }
  };

  const getHandlerBadge = (h: string) => {
    switch (h) {
      case 'ai':
        return <span className="ws-wa-badge ws-wa-badge--ai">🤖 {isEn ? 'AI Agent' : 'ذكاء اصطناعي'}</span>;
      case 'human':
        return <span className="ws-wa-badge ws-wa-badge--staff">👤 {isEn ? 'Staff' : 'موظف بشري'}</span>;
      default:
        return <span className="ws-wa-badge ws-wa-badge--mixed">👥 {isEn ? 'Mixed' : 'مختلط'}</span>;
    }
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return '؟';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="ws-wa-container">
      {/* View Header */}
      <div className="ws-wa-top-header">
        <div>
          <h1 className="ws-wa-title">{isEn ? 'Conversations & Messaging' : 'الدردشات والمحادثات'}</h1>
          <p className="ws-wa-subtitle">
            {isEn
              ? 'WhatsApp-style live conversation management, staff handoff, AI pausing, and user blocking'
              : 'إدارة وتتبع المحادثات بنمط واتساب، وتعيين الموظفين، وإيقاف الذكاء الاصطناعي، وحظر المستعلمين'}
          </p>
        </div>
      </div>

      {alertMsg && (
        <div className={`ws-wa-alert ws-wa-alert--${alertMsg.type}`}>
          {alertMsg.text}
        </div>
      )}

      {/* Main Split Window */}
      <div className={`ws-wa-split-layout ${mobileChatOpen ? 'mobile-chat-active' : ''}`}>
        
        {/* LEFT PANE: CONVERSATION LIST (WhatsApp Style) */}
        <div className="ws-wa-sidebar">
          {/* WhatsApp Header / Filters */}
          <div className="ws-wa-sidebar-header">
            <div className="ws-wa-search-box">
              <span className="ws-wa-search-icon">🔍</span>
              <input
                type="text"
                className="ws-wa-search-input"
                placeholder={isEn ? 'Search chats or users...' : 'بحث في الدردشات أو المستخدمين...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="ws-wa-filter-tabs">
              <button
                className={`ws-wa-filter-chip ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {isEn ? 'All' : 'الكل'}
              </button>
              <button
                className={`ws-wa-filter-chip ${filter === 'ai' ? 'active' : ''}`}
                onClick={() => setFilter('ai')}
              >
                🤖 {isEn ? 'AI' : 'ذكاء اصطناعي'}
              </button>
              <button
                className={`ws-wa-filter-chip ${filter === 'human' ? 'active' : ''}`}
                onClick={() => setFilter('human')}
              >
                👤 {isEn ? 'Staff' : 'الموظفون'}
              </button>
              <button
                className={`ws-wa-filter-chip ${filter === 'mixed' ? 'active' : ''}`}
                onClick={() => setFilter('mixed')}
              >
                👥 {isEn ? 'Mixed' : 'المشتركة'}
              </button>
            </div>
          </div>

          {/* Chat List Items */}
          <div className="ws-wa-chat-list">
            {loading ? (
              <div className="ws-wa-loading">
                <div className="ws-wa-spinner" />
                <p>{isEn ? 'Loading conversations...' : 'جاري تحميل المحادثات...'}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="ws-wa-empty-list">
                <span className="ws-wa-empty-icon">💬</span>
                <h4>{isEn ? 'No conversations found' : 'لا توجد محادثات'}</h4>
                <p>{isEn ? 'Incoming customer chats will appear here in real-time.' : 'ستظهر محادثات العملاء الواردة من الودجت هنا مباشرة.'}</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                const isBlocked = conv.end_user?.is_blocked;
                const isAiPaused = conv.end_user?.ai_responses_paused;

                return (
                  <div
                    key={conv.id}
                    className={`ws-wa-chat-item ${isSelected ? 'active' : ''} ${isBlocked ? 'blocked' : ''}`}
                    onClick={() => loadMessages(conv)}
                  >
                    <div className="ws-wa-avatar">
                      {getUserInitials(conv.end_user?.name)}
                      {isBlocked && <span className="ws-wa-avatar-status blocked" title="محظور">🚫</span>}
                      {!isBlocked && isAiPaused && <span className="ws-wa-avatar-status paused" title="الذكاء الاصطناعي متوقف">⏸️</span>}
                    </div>

                    <div className="ws-wa-chat-content">
                      <div className="ws-wa-chat-row1">
                        <span className="ws-wa-chat-title">
                          {conv.end_user?.name || conv.end_user?.phone || `${isEn ? 'Visitor' : 'زائر'} #${conv.id}`}
                        </span>
                        <span className="ws-wa-chat-time">
                          {new Date(conv.last_message_at || Date.now()).toLocaleTimeString(isEn ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="ws-wa-chat-row2">
                        <span className="ws-wa-chat-snippet">
                          {conv.end_user?.phone ? `${conv.end_user.phone} · ` : ''}
                          {conv.messages_count} {isEn ? 'messages' : 'رسالة'}
                        </span>
                        {getHandlerBadge(conv.handler)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: ACTIVE CHAT WINDOW (WhatsApp Style) */}
        <div className="ws-wa-chat-pane">
          {selectedConv ? (
            <>
              {/* WhatsApp Chat Top Header */}
              <div className="ws-wa-pane-header">
                {/* Mobile Back Button (WhatsApp Arrow) */}
                <button
                  className="ws-wa-mobile-back"
                  onClick={() => setMobileChatOpen(false)}
                  title={isEn ? 'Back to chat list' : 'رجوع لقائمة الدردشات'}
                >
                  {isEn ? '←' : '→'}
                </button>

                <div className="ws-wa-avatar ws-wa-avatar--header">
                  {getUserInitials(selectedConv.end_user?.name)}
                </div>

                <div className="ws-wa-header-info">
                  <div className="ws-wa-header-title-row">
                    <h3 className="ws-wa-header-name">
                      {selectedConv.end_user?.name || selectedConv.end_user?.phone || `${isEn ? 'Visitor' : 'زائر'} #${selectedConv.id}`}
                    </h3>
                    {selectedConv.end_user?.is_blocked && (
                      <span className="ws-wa-status-pill blocked">🚫 {isEn ? 'Blocked User' : 'مستعلم محظور'}</span>
                    )}
                    {selectedConv.end_user?.ai_responses_paused && !selectedConv.end_user?.is_blocked && (
                      <span className="ws-wa-status-pill paused">⏸️ {isEn ? 'AI Paused' : 'الذكاء متوقف'}</span>
                    )}
                  </div>
                  <span className="ws-wa-header-sub">
                    {selectedConv.end_user?.email || selectedConv.end_user?.phone || (isEn ? 'Web Widget Channel' : 'قناة الودجت البرمجي')} · {getHandlerBadge(selectedConv.handler)}
                  </span>
                </div>

                {/* Safety & Administrative Controls */}
                <div className="ws-wa-header-actions">
                  <button
                    className={`ws-wa-action-btn ${selectedConv.end_user?.ai_responses_paused ? 'active' : ''}`}
                    onClick={handleTogglePauseAi}
                    disabled={actionLoading || selectedConv.end_user?.is_blocked}
                    title={isEn ? 'Pause or resume AI responses for this specific user' : 'إيقاف أو استئناف ردود الذكاء الاصطناعي لهذا المستعلم'}
                  >
                    {selectedConv.end_user?.ai_responses_paused
                      ? (isEn ? '▶️ Resume AI' : '▶️ استئناف الذكاء')
                      : (isEn ? '⏸️ Pause AI' : '⏸️ إيقاف الذكاء')}
                  </button>

                  <button
                    className={`ws-wa-action-btn ws-wa-action-btn--danger ${selectedConv.end_user?.is_blocked ? 'blocked' : ''}`}
                    onClick={handleToggleBlock}
                    disabled={actionLoading}
                    title={isEn ? 'Block user completely from receiving responses or sending messages' : 'حظر المستعلم بالكامل من استقبال ردود أو إرسال رسائل'}
                  >
                    {selectedConv.end_user?.is_blocked
                      ? (isEn ? '🔓 Unblock' : '🔓 إلغاء الحظر')
                      : (isEn ? '🚫 Block User' : '🚫 حظر المستعلم')}
                  </button>
                </div>
              </div>

              {/* Security Warning Banners */}
              {selectedConv.end_user?.is_blocked && (
                <div className="ws-wa-security-banner ws-wa-security-banner--blocked">
                  <span>🚫</span>
                  <div>
                    <strong>{isEn ? 'End User is Blocked' : 'هذا المستعلم محظور بالكامل في النظام'}</strong>
                    <p>{isEn ? 'Incoming messages are blocked at backend gateway. User cannot send or receive responses.' : 'تم حظر جميع الرسائل الواردة منه على مستوى الخادم، ولن يتمكن من استقبال أي ردود.'}</p>
                  </div>
                </div>
              )}

              {selectedConv.end_user?.ai_responses_paused && !selectedConv.end_user?.is_blocked && (
                <div className="ws-wa-security-banner ws-wa-security-banner--paused">
                  <span>⏸️</span>
                  <div>
                    <strong>{isEn ? 'AI Responses Paused' : 'ردود الذكاء الاصطناعي متوقفة'}</strong>
                    <p>{isEn ? 'The automated agent will not respond to this user. Only human staff can reply.' : 'تم إيقاف الوكيل الآلي لهذا المستعلم، والردود مقتصرة فقط على الموظفين البشريين.'}</p>
                  </div>
                </div>
              )}

              {/* Message Bubble Thread (WhatsApp Look & Feel) */}
              <div className="ws-wa-message-thread">
                <div className="ws-wa-encryption-notice">
                  🔒 {isEn ? 'Messages are securely isolated for this university workspace.' : 'الرسائل مشفرة ومعزولة بالكامل ضمن نطاق مساحة العمل الحالية.'}
                </div>

                {loadingMessages ? (
                  <div className="ws-wa-loading">
                    <div className="ws-wa-spinner" />
                    <p>{isEn ? 'Loading message history...' : 'جاري تحميل سجل المحادثة...'}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="ws-wa-empty-chat">
                    <span>💬</span>
                    <p>{isEn ? 'No messages in this conversation yet.' : 'لا توجد رسائل مسجلة في هذه المحادثة حتى الآن.'}</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isEndUser = msg.sender_type === 'end_user';
                    const isAi = msg.sender_type === 'ai';
                    const isStaff = msg.sender_type === 'staff';
                    const isSystem = msg.sender_type === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="ws-wa-system-bubble">
                          <span>{msg.content}</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`ws-wa-bubble-row ${isEndUser ? 'incoming' : 'outgoing'}`}
                      >
                        <div className={`ws-wa-bubble ${isEndUser ? 'bubble-in' : isAi ? 'bubble-ai' : 'bubble-staff'}`}>
                          {/* Sender identification header */}
                          <div className="ws-wa-bubble-sender">
                            {isEndUser && (selectedConv.end_user?.name || (isEn ? 'Visitor' : 'المستعلم'))}
                            {isAi && (
                              <span className="ws-wa-sender-tag ai">
                                🤖 {isEn ? 'AgentHub AI' : 'وكيل الذكاء الاصطناعي'}
                                {msg.confidence_score !== null && (
                                  <small>({(msg.confidence_score * 100).toFixed(0)}% {isEn ? 'confidence' : 'دقة'})</small>
                                )}
                              </span>
                            )}
                            {isStaff && (
                              <span className="ws-wa-sender-tag staff">
                                👤 {isEn ? 'Staff Member' : 'فريق الدعم البشري'}
                              </span>
                            )}
                          </div>

                          <div className="ws-wa-bubble-text">{msg.content}</div>

                          <div className="ws-wa-bubble-meta">
                            <span className="ws-wa-bubble-time">
                              {new Date(msg.created_at).toLocaleTimeString(isEn ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isEndUser && <span className="ws-wa-ticks">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* WhatsApp Message Input Bar */}
              <form onSubmit={handleSendMessage} className="ws-wa-input-bar">
                <input
                  type="text"
                  className="ws-wa-text-input"
                  placeholder={
                    selectedConv.end_user?.is_blocked
                      ? (isEn ? 'User is blocked. Cannot send messages.' : 'المستعلم محظور. لا يمكن إرسال رسائل.')
                      : (isEn ? 'Type a reply as Staff...' : 'اكتب رداً بصفتك موظف دعم...')
                  }
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  disabled={selectedConv.end_user?.is_blocked || sending}
                />
                <button
                  type="submit"
                  className="ws-wa-send-btn"
                  disabled={!replyText.trim() || selectedConv.end_user?.is_blocked || sending}
                  title={isEn ? 'Send Message' : 'إرسال الرسالة'}
                >
                  {sending ? '...' : (isEn ? 'Send' : 'إرسال')} ➔
                </button>
              </form>
            </>
          ) : (
            <div className="ws-wa-no-selection">
              <span className="ws-wa-no-sel-icon">💬</span>
              <h3>{isEn ? 'Select a chat to begin' : 'اختر محادثة من القائمة لعرضها'}</h3>
              <p>{isEn ? 'Click on any customer conversation to view chat history and take action.' : 'انقر على أي محادثة لمتابعة سير الدردشة مع الذكاء الاصطناعي أو التدخل البشري.'}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
