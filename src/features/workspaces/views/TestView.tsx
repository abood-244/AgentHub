import React, { useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import './TestView.css';

interface TestSource {
  title?: string;
  content: string;
  document_id?: number;
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

interface TestViewProps {
  workspaceId: string;
}

export const TestView: React.FC<TestViewProps> = ({ workspaceId }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: isEn
        ? 'Welcome to the Agent Test Arena. You can ask any question here to test knowledge retrieval, system instructions, and LLM output before going live.'
        : 'أهلاً بك في ساحة اختبار الوكيل الذكي. يمكنك طرح أي سؤال هنا لاختبار استرجاع قاعدة المعرفة والتعليمات ونموذج الذكاء الاصطناعي قبل الإطلاق المباشر.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const sampleQuestions = isEn
    ? [
        'What are the official working hours?',
        'How can students submit an appeal request?',
        'What services does the academic center provide?',
      ]
    : [
        'ما هي مواعيد الدوام وساعات العمل الرسمية؟',
        'كيف يمكن للطلبة تقديم طلب استئناف أكاديمي؟',
        'ما هي الخدمات التي يقدمها المركز للطلاب؟',
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
        text: res.answer || (isEn ? res.message_en : res.message) || (isEn ? 'No response generated.' : 'لم يتم توليد رد.'),
        sources: res.sources_used || [],
        confidence: res.confidence_score,
        processingTimeMs: res.processing_time_ms,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error(err);
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(serverMsg || (isEn ? 'Failed to process test message.' : 'فشل في معالجة رسالة الاختبار.'));
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
        text: isEn ? 'Test chat cleared. Ask a new question.' : 'تم مسح سجل الاختبار. اطرح سؤالاً جديداً.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="ws-test-container">
      {/* Header */}
      <div className="ws-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="ws-view-title">{isEn ? 'Agent Test Arena' : 'ساحة اختبار الوكيل'}</h1>
          <p className="ws-view-subtitle">
            {isEn
              ? 'Test prompt instructions, RAG vector retrieval, and LLM output in an isolated environment'
              : 'اختبر التعليمات البرمجية واسترجاع المعرفة بالمتجهات واستجابات الذكاء الاصطناعي في بيئة معزولة'}
          </p>
        </div>
        <button className="ws-btn ws-btn--secondary" onClick={clearChat}>
          <span>🧹</span> {isEn ? 'Clear Session' : 'مسح المحادثة'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="ws-test-banner">
        <span className="ws-test-banner__icon">💡</span>
        <span className="ws-test-banner__text">
          {isEn
            ? 'Messages tested here are flagged as test conversations and will not affect live customer analytics.'
            : 'المحادثات في هذه الساحة يتم تمييزها كاختبارية ولا تؤثر على إحصائيات العملاء المباشرة.'}
        </span>
      </div>

      {errorMsg && (
        <div className="ws-alert ws-alert--error" style={{ marginBottom: '16px' }}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Main Chat Box */}
      <div className="ws-test-chatbox">
        {/* Messages Stream */}
        <div className="ws-test-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ws-test-msg ws-test-msg--${msg.sender}`}>
              <div className="ws-test-msg__avatar">
                {msg.sender === 'ai' ? '🤖' : '👤'}
              </div>
              <div className="ws-test-msg__content">
                <div className="ws-test-msg__bubble">
                  <div className="ws-test-msg__text">{msg.text}</div>
                  
                  {/* Meta Details for AI: Latency + Confidence */}
                  {msg.sender === 'ai' && (msg.confidence !== undefined || msg.processingTimeMs !== undefined) && (
                    <div className="ws-test-msg__meta">
                      {msg.confidence !== undefined && (
                        <span className={`ws-test-badge ${msg.confidence >= 0.7 ? 'ws-test-badge--high' : 'ws-test-badge--mid'}`}>
                          {isEn ? 'Confidence' : 'درجة الثقة'}: {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                      {msg.processingTimeMs !== undefined && (
                        <span className="ws-test-badge ws-test-badge--latency">
                          ⚡ {msg.processingTimeMs} ms
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sources Accordion */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="ws-test-sources">
                      <button
                        type="button"
                        className="ws-test-sources__toggle"
                        onClick={() => toggleSources(msg.id)}
                      >
                        <span>📚 {isEn ? `Retrieved Sources (${msg.sources.length})` : `المصادر المسترجعة (${msg.sources.length})`}</span>
                        <span>{expandedSources[msg.id] ? '▲' : '▼'}</span>
                      </button>
                      {expandedSources[msg.id] && (
                        <div className="ws-test-sources__list">
                          {msg.sources.map((src, idx) => (
                            <div key={idx} className="ws-test-source-card">
                              <div className="ws-test-source-card__title">
                                {src.title || `${isEn ? 'Source Chunk' : 'المقطع المعرفي'} #${idx + 1}`}
                              </div>
                              <div className="ws-test-source-card__content">{src.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="ws-test-msg__time">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="ws-test-msg ws-test-msg--ai">
              <div className="ws-test-msg__avatar">🤖</div>
              <div className="ws-test-msg__content">
                <div className="ws-test-msg__bubble ws-test-msg__bubble--typing">
                  <span className="ws-test-dot"></span>
                  <span className="ws-test-dot"></span>
                  <span className="ws-test-dot"></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="ws-test-samples">
          <span className="ws-test-samples__label">{isEn ? 'Try Asking:' : 'أسئلة مقترحة للتجربة:'}</span>
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
            className="ws-input ws-test-input"
            placeholder={isEn ? 'Type a test message or question...' : 'اكتب سؤالك لاختبار الوكيل...'}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            disabled={loading}
          />
          <button
            className="ws-btn ws-btn--primary ws-test-send-btn"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || loading}
          >
            <span>🚀</span> {isEn ? 'Send' : 'إرسال'}
          </button>
        </div>
      </div>
    </div>
  );
};
