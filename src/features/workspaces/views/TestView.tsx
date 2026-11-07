import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  Database,
  Cpu,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import './TestView.css';

interface TestSource {
  title?: string;
  content?: string;
  content_preview?: string;
  document_id?: number;
  chunk_id?: number;
  chunk_index?: number;
}

interface TestMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: TestSource[];
  confidence?: number;
  processingTimeMs?: number;
  timestamp: string;
}

interface AgentProfileInfo {
  name: string;
  description: string;
  selected_llm_model_id: number | null;
  llm_model?: {
    name: string;
    provider: string;
    model_identifier: string;
  } | null;
  use_knowledge_base: boolean;
  temperature: number;
  status: string;
}

interface TestViewProps {
  workspaceId: string;
  onNavigate?: (section: any) => void;
}

export const TestView: React.FC<TestViewProps> = ({ workspaceId, onNavigate }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [agentProfile, setAgentProfile] = useState<AgentProfileInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: isEn
        ? 'Welcome to the Agent Test Arena. Ask any question to verify system instructions, vector knowledge retrieval, and LLM output before live release.'
        : 'أهلاً بك في ساحة اختبار الوكيل الذكي. اطرح أي استفسار هنا للتحقق من دقة تعليمات النظام، استرجاع متجهات المعرفة (RAG)، واستجابات الذكاء الاصطناعي في بيئة معزولة.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAgentProfile();
  }, [workspaceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadAgentProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await apiClient.get<{ data: AgentProfileInfo | null; exists: boolean }>(
        `/workspaces/${workspaceId}/agent-profile`
      );
      if (res.exists && res.data) {
        setAgentProfile(res.data);
      } else {
        setAgentProfile(null);
      }
    } catch (err) {
      console.error('Failed to load agent profile in TestView:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const sampleQuestions = isEn
    ? [
        'What are the official working hours and days?',
        'How can enrolled students submit an academic appeal?',
        'What documents are needed for transfer admissions?',
      ]
    : [
        'ما هي مواعيد الدوام وساعات العمل الرسمية بالجامعة؟',
        'كيف يمكن للطلبة تقديم طلب استئناف أكاديمي رسمي؟',
        'ما هي شروط وإجراءات التحويل والوثائق المطلوبة؟',
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || loading) return;

    setErrorMsg(null);
    const userMsgId = 'user_' + Date.now();
    const newMsg: TestMessage = {
      id: userMsgId,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await apiClient.post<{
        answer: string;
        sources_used?: TestSource[];
        confidence_score?: number;
        processing_time_ms?: number;
        error?: string;
        message?: string;
        message_en?: string;
      }>(`/workspaces/${workspaceId}/test-chat`, { question: q });

      const aiMsgId = 'ai_' + Date.now();
      const aiReply: TestMessage = {
        id: aiMsgId,
        sender: 'ai',
        text:
          res.answer ||
          (isEn ? res.message_en : res.message) ||
          (isEn ? 'No response generated.' : 'لم يتم توليد رد.'),
        sources: res.sources_used || [],
        confidence: res.confidence_score,
        processingTimeMs: res.processing_time_ms,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('Test chat error:', err);
      const serverMsg =
        err.response?.data?.message ||
        (isEn ? err.response?.data?.message_en : undefined) ||
        err.message;
      setErrorMsg(
        serverMsg ||
          (isEn
            ? 'Failed to process test message.'
            : 'فشل في معالجة رسالة الاختبار من قبل النموذج.')
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_cleared',
        sender: 'ai',
        text: isEn
          ? 'Test session reset. Ask a question to evaluate live agent performance.'
          : 'تم مسح سجل الجلسة بنجاح. اطرح سؤالاً جديداً لاختبار الأداء الحي للوكيل.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMsg(null);
  };

  const isModelMissing = !agentProfile || !agentProfile.selected_llm_model_id;

  return (
    <div className="ws-test-container" dir="rtl">
      {/* ── 1. Top Executive Header ── */}
      <div className="ws-test-hero">
        <div className="ws-test-hero__info">
          <div className="ws-test-hero__avatar">
            <Bot size={28} className="ws-test-hero__icon" />
            <span className="ws-test-hero__dot" />
          </div>

          <div>
            <div className="ws-test-hero__title-row">
              <h1 className="ws-test-hero__title">
                {isEn ? 'Agent Test Arena' : 'ساحة اختبار الوكيل'}
              </h1>
              <span className="ws-test-hero__badge">
                <ShieldCheck size={12} />
                <span>{isEn ? 'Isolated Sandbox' : 'بيئة معزولة آمنة'}</span>
              </span>
            </div>
            <p className="ws-test-hero__subtitle">
              {isEn
                ? 'Evaluate system prompt instructions, vector RAG retrieval, and LLM responses in real-time.'
                : 'اختبر التعليمات البرمجية واسترجاع المعرفة بالمتجهات واستجابات الذكاء الاصطناعي في بيئة معزولة لا تؤثر على الإحصائيات.'}
            </p>
          </div>
        </div>

        <div className="ws-test-hero__actions">
          {onNavigate && (
            <button
              type="button"
              className="ws-test-btn ws-test-btn--outline"
              onClick={() => onNavigate('agent-profile')}
              title={isEn ? 'Configure Agent Profile' : 'تعديل إعدادات الوكيل'}
            >
              <Settings size={15} />
              <span>{isEn ? 'Agent Settings' : 'إعدادات الوكيل'}</span>
            </button>
          )}

          <button
            type="button"
            className="ws-test-btn ws-test-btn--secondary"
            onClick={clearChat}
            title={isEn ? 'Clear Session' : 'مسح المحادثة'}
          >
            <Trash2 size={15} />
            <span>{isEn ? 'Clear Chat' : 'مسح المحادثة'}</span>
          </button>
        </div>
      </div>

      {/* ── Warning Banner if Agent Profile or Model is Missing ── */}
      {isModelMissing && !profileLoading && (
        <div className="ws-test-alert-banner">
          <div className="ws-test-alert-content">
            <AlertCircle size={20} className="ws-test-alert-icon" />
            <div>
              <strong>
                {isEn
                  ? 'Agent Profile or LLM Model Not Configured'
                  : 'تنبيه: ملف الوكيل الذكي أو نموذج الذكاء الاصطناعي غير محدد لهذه المساحة'}
              </strong>
              <p>
                {isEn
                  ? 'The test arena requires an active agent profile with an assigned LLM model to generate responses.'
                  : 'تتطلب ساحة الاختبار تحديد نموذج LLM معتمد وحفظ ملف الوكيل أولاً ليتمكن من معالجة الاستفسارات.'}
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              type="button"
              className="ws-test-configure-btn"
              onClick={() => onNavigate('agent-profile')}
            >
              <span>{isEn ? 'Configure Profile Now' : 'إعداد ملف الوكيل والنموذج الآن'}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}

      {/* ── 2. Live Agent Context Bar ── */}
      {agentProfile && !isModelMissing && (
        <div className="ws-test-context-bar">
          <div className="ws-context-item">
            <Bot size={15} className="ws-context-icon" />
            <span className="ws-context-label">{isEn ? 'Agent:' : 'الوكيل:'}</span>
            <strong className="ws-context-val">{agentProfile.name || (isEn ? 'Assistant' : 'المساعد الذكي')}</strong>
          </div>

          <div className="ws-context-divider" />

          <div className="ws-context-item">
            <Cpu size={15} className="ws-context-icon" />
            <span className="ws-context-label">{isEn ? 'Model:' : 'النموذج:'}</span>
            <strong className="ws-context-val">
              {agentProfile.llm_model ? agentProfile.llm_model.name : 'GPT-4o'}
            </strong>
          </div>

          <div className="ws-context-divider" />

          <div className="ws-context-item">
            <Database size={15} className="ws-context-icon" />
            <span className="ws-context-label">{isEn ? 'RAG:' : 'قاعدة المعرفة:'}</span>
            <strong className="ws-context-val">
              {agentProfile.use_knowledge_base ? (isEn ? 'Active' : 'مفعلة') : (isEn ? 'Disabled' : 'معطلة')}
            </strong>
          </div>

          <div className="ws-context-divider" />

          <div className="ws-context-item">
            <Flame size={15} className="ws-context-icon" />
            <span className="ws-context-label">{isEn ? 'Temp:' : 'الحرارة:'}</span>
            <strong className="ws-context-val">{agentProfile.temperature}</strong>
          </div>
        </div>
      )}

      {/* ── 3. Chatbox Container ── */}
      <div className="ws-test-chatbox">
        {/* Messages Feed */}
        <div className="ws-test-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ws-test-msg ${
                msg.sender === 'user' ? 'ws-test-msg--user' : 'ws-test-msg--ai'
              }`}
            >
              <div className="ws-test-msg__avatar">
                {msg.sender === 'user' ? (
                  <span>👤</span>
                ) : (
                  <Bot size={18} className="ws-test-ai-avatar-icon" />
                )}
              </div>

              <div className="ws-test-msg__body">
                <div className="ws-test-msg__bubble">
                  <div className="ws-test-msg__text">{msg.text}</div>

                  {/* AI Metadata Details (Latency + Confidence) */}
                  {msg.sender === 'ai' &&
                    (msg.confidence !== undefined || msg.processingTimeMs !== undefined) && (
                      <div className="ws-test-msg__metrics">
                        {msg.processingTimeMs !== undefined && (
                          <span className="ws-test-chip ws-test-chip--latency">
                            <Zap size={11} />
                            <span>{msg.processingTimeMs} ms</span>
                          </span>
                        )}
                        {msg.confidence !== undefined && (
                          <span
                            className={`ws-test-chip ${
                              msg.confidence >= 0.7
                                ? 'ws-test-chip--high'
                                : 'ws-test-chip--mid'
                            }`}
                          >
                            <ShieldCheck size={11} />
                            <span>
                              {isEn ? 'Confidence' : 'نسبة الدقة'}:{' '}
                              {Math.round(msg.confidence * 100)}%
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                  {/* RAG Retrieved Sources Drawer */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ws-test-sources">
                      <button
                        type="button"
                        className="ws-test-sources__toggle"
                        onClick={() => toggleSources(msg.id)}
                      >
                        <div className="ws-sources-toggle-title">
                          <Database size={13} />
                          <span>
                            {isEn
                              ? `Referenced Knowledge Sources (${msg.sources.length})`
                              : `المصادر المسترجعة من قاعدة المعرفة (${msg.sources.length})`}
                          </span>
                        </div>
                        {expandedSources[msg.id] ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="ws-test-sources__list">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="ws-test-source-card">
                              <div className="ws-test-source-header">
                                <span className="ws-source-index">#{idx + 1}</span>
                                <span className="ws-source-title">
                                  {src.title ||
                                    (isEn
                                      ? `Document Chunk #${src.chunk_id || src.document_id || idx + 1}`
                                      : `المقطع المسترجع #${src.chunk_id || src.document_id || idx + 1}`)}
                                </span>
                              </div>
                              <p className="ws-test-source-text">
                                {src.content || src.content_preview || (isEn ? 'Content extracted from knowledge base.' : 'محتوى مستخرج من قاعدة المعرفة.')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="ws-test-msg__time">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {/* Typing Animation */}
          {loading && (
            <div className="ws-test-msg ws-test-msg--ai">
              <div className="ws-test-msg__avatar">
                <Bot size={18} className="ws-test-ai-avatar-icon" />
              </div>
              <div className="ws-test-msg__body">
                <div className="ws-test-msg__bubble ws-test-msg__bubble--typing">
                  <span className="ws-test-dot" />
                  <span className="ws-test-dot" />
                  <span className="ws-test-dot" />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="ws-test-chat-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="ws-test-samples">
          <div className="ws-test-samples__label">
            <Sparkles size={14} />
            <span>{isEn ? 'Sample Inquiries:' : 'أسئلة مقترحة للتجربة:'}</span>
          </div>
          <div className="ws-test-samples__items">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="ws-test-sample-pill"
                onClick={() => handleSendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="ws-test-inputbar">
          <input
            type="text"
            className="ws-test-input"
            placeholder={
              isEn
                ? 'Type your test question (e.g. How to apply for admission?)...'
                : 'اكتب سؤالك لاختبار الوكيل (مثال: ما هي شروط القبول والتسجيل؟)...'
            }
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={loading}
          />
          <button
            type="button"
            className="ws-test-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
            aria-label={isEn ? 'Send' : 'إرسال'}
          >
            {loading ? (
              <div className="ws-btn-spinner" />
            ) : (
              <>
                <Send size={16} className="ws-send-icon" />
                <span>{isEn ? 'Send' : 'إرسال'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
