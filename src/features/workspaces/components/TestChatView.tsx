import React, { useState } from 'react';
import './TestChatView.css';
import { Workspace, AgentProfile, LLMModel, TestChatMessage } from '../../../types';
import { testChatService, workspaceService } from '../../../services/apiServices';
import { Button } from '../../../design-system/components/Button';
import { Badge } from '../../../design-system/components/Badge';
import {
  Send,
  RotateCcw,
  Bot,
  User,
  Sparkles,
  LifeBuoy,
  CheckCircle,
  HelpCircle,
  Cpu,
  Database,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export interface TestChatViewProps {
  workspace: Workspace;
  agentProfile: AgentProfile;
  selectedModel: LLMModel | null;
  onBack: () => void;
  onMarkWorkspaceActive?: () => void;
}

export const TestChatView: React.FC<TestChatViewProps> = ({
  workspace,
  agentProfile,
  selectedModel,
  onBack,
  onMarkWorkspaceActive,
}) => {
  const { language, t, isRTL } = useTranslation();
  const isEn = language === 'en';

  const [messages, setMessages] = useState<TestChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: isEn
        ? `Welcome to the test environment for ${workspace.nameEn || workspace.name}! I am ${agentProfile.name}. Ask me about admissions, requirements, or test an unconfident query to verify support case escalation.`
        : `أهلاً بك في بيئة الاختبار التجريبية لقسم ${workspace.name}! أنا ${agentProfile.name}. يمكنك سؤالي عن شروط القبول واللوائح لاختبار دقة الإجابة، أو طرح سؤال خارج النطاق لمعاينة التحويل التلقائي لحالة دعم (Support Case).`,
      timestamp: 'الآن',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [testedSuccessful, setTestedSuccessful] = useState(false);
  const [testedEscalation, setTestedEscalation] = useState(false);

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg: TestChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'الآن',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await testChatService.sendTestMessage(workspace.id, text);
      setMessages(prev => [...prev, response]);

      if (response.isEscalated) {
        setTestedEscalation(true);
      } else {
        setTestedSuccessful(true);
      }

      // Automatically update setup progress for testAgent step
      await workspaceService.updateSetupProgress(workspace.id, {
        testAgent: 'ready',
        isLiveReady: true,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'agent',
        text: isEn
          ? 'Conversation reset. Ready for a new test interaction.'
          : 'تمت إعادة ضبط المحادثة. جاهز لجلسة اختبار جديدة.',
        timestamp: 'الآن',
      },
    ]);
  };

  const samplePromptSuccess = isEn
    ? 'What are the admission requirements for the Information Technology program?'
    : 'ما هي متطلبات وشروط القبول في برنامج تقنية المعلومات؟';

  const samplePromptEscalate = isEn
    ? 'Can I get an exceptional tuition fee waiver due to financial hardship?'
    : 'هل يمكنني الحصول على إعفاء استثنائي من الرسوم الدراسية لظروف خاصة؟';

  return (
    <div className="ah-test-chat">
      {/* Test Environment Banner */}
      <div className="ah-test-chat__banner">
        <div className="ah-test-chat__banner-main">
          <div className="ah-test-chat__env-badge">
            <Sparkles size={16} />
            <span>{isEn ? 'TEST ENVIRONMENT' : 'بيئة الاختبار التجريبي'}</span>
          </div>
          <h2 className="ah-test-chat__title">
            {isEn ? `Testing: ${agentProfile.name}` : `اختبار الوكيل: ${agentProfile.name}`}
          </h2>
          <div className="ah-test-chat__meta-pills">
            <span className="ah-test-pill">
              <Cpu size={14} color="#0066FF" />
              <span>Model: {selectedModel?.name || 'OpenAI GPT-4o'}</span>
            </span>
            <span className="ah-test-pill">
              <Database size={14} color="#12B76A" />
              <span>{workspace.knowledgeSourcesCount} Knowledge Sources</span>
            </span>
            <span className="ah-test-pill">
              <Bot size={14} color="#7C3AED" />
              <span>Temp: {agentProfile.temperature}</span>
            </span>
          </div>
        </div>

        <div className="ah-test-chat__banner-actions">
          <Button variant="ghost" size="sm" icon={<RotateCcw size={16} />} onClick={handleResetChat}>
            {isEn ? 'Reset Chat' : 'إعادة ضبط'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            onClick={onBack}
          >
            {isEn ? 'Back to Setup' : 'العودة للإعداد'}
          </Button>
        </div>
      </div>

      {/* Suggested Quick Test Prompts */}
      <div className="ah-test-chat__suggestions">
        <span className="ah-test-chat__suggestions-label">
          {isEn ? 'Quick Test Scenarios:' : 'سيناريوهات الاختبار السريعة:'}
        </span>
        <div className="ah-test-chat__suggestions-btns">
          <button
            type="button"
            className="ah-suggestion-btn ah-suggestion-btn--success"
            onClick={() => handleSend(samplePromptSuccess)}
          >
            <CheckCircle size={14} color="#12B76A" />
            <span>{isEn ? '1. Test Knowledge Match (Success)' : '1. اختبار استرجاع المعرفة (إجابة مؤكدة)'}</span>
          </button>
          <button
            type="button"
            className="ah-suggestion-btn ah-suggestion-btn--escalate"
            onClick={() => handleSend(samplePromptEscalate)}
          >
            <HelpCircle size={14} color="#F04438" />
            <span>{isEn ? '2. Test Low Confidence (Create Support Case)' : '2. اختبار عدم التأكد (رفع حالة دعم بشرية)'}</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="ah-test-chat__thread">
        {messages.map(msg => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`ah-chat-msg ${isAgent ? 'ah-chat-msg--agent' : 'ah-chat-msg--user'}`}
            >
              <div className="ah-chat-msg__avatar">
                {isAgent ? <Bot size={18} /> : <User size={18} />}
              </div>

              <div className="ah-chat-msg__body">
                <div className="ah-chat-msg__bubble">
                  <p className="ah-chat-msg__text">{msg.text}</p>

                  {/* AI Metadata & Knowledge Sources used */}
                  {isAgent && msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                    <div className="ah-chat-msg__provenance">
                      <div className="ah-prov-header">
                        <Database size={13} color="#0066FF" />
                        <span>{isEn ? 'Answer grounded using:' : 'تم توليد الإجابة بالاستناد إلى:'}</span>
                      </div>
                      <div className="ah-prov-tags">
                        {msg.sourcesUsed.map((src, i) => (
                          <span key={i} className="ah-prov-tag">📄 {src}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Support Case Escalation Callout */}
                  {isAgent && msg.isEscalated && (
                    <div className="ah-chat-msg__escalation-card">
                      <div className="ah-escalation-header">
                        <LifeBuoy size={16} color="#F04438" />
                        <span className="ah-escalation-title">
                          {isEn ? 'Automatic Support Case Created' : 'تم رفع حالة دعم جديدة (Support Case)'}
                        </span>
                      </div>
                      <p className="ah-escalation-detail">
                        {isEn
                          ? `The agent could not answer confidently. Escalated according to Workspace rules to: ${msg.escalatedStaffName || 'Unassigned Queue'}`
                          : `تعذر على الوكيل الإجابة بثقة لعدم كفاية المعلومات. تم رفع الحالة آلياً إلى: ${msg.escalatedStaffName || 'صندوق الانتظار (AI المستقل)'}`}
                      </p>
                    </div>
                  )}
                </div>

                <span className="ah-chat-msg__time">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="ah-chat-msg ah-chat-msg--agent">
            <div className="ah-chat-msg__avatar"><Bot size={18} /></div>
            <div className="ah-chat-msg__bubble ah-chat-msg__typing">
              <span className="ah-typing-dot" />
              <span className="ah-typing-dot" />
              <span className="ah-typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Completion & Readiness Status Bar */}
      {(testedSuccessful || testedEscalation) && (
        <div className="ah-test-chat__ready-bar">
          <div className="ah-ready-bar__info">
            <CheckCircle size={20} color="#12B76A" />
            <div>
              <span className="ah-ready-bar__title">
                {isEn ? 'Agent Testing Completed Successfully!' : 'تم التحقق من سلوك الوكيل بنجاح!'}
              </span>
              <p className="ah-ready-bar__sub">
                {isEn
                  ? 'All core components (Knowledge, Model, Escalation) are verified and operating as designed.'
                  : 'تم اختبار استرجاع المعرفة وحالات الدعم. مساحة العمل الآن مؤهلة لتصبح نشطة (Active / Ready).'}
              </p>
            </div>
          </div>
          {onMarkWorkspaceActive && (
            <Button variant="primary" onClick={onMarkWorkspaceActive}>
              {isEn ? 'Activate Workspace Now' : 'تفعيل مساحة العمل الآن (Ready)'}
            </Button>
          )}
        </div>
      )}

      {/* Input Bar */}
      <form
        className="ah-test-chat__input-bar"
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="ah-test-chat__input"
          placeholder={isEn ? 'Type a test inquiry for the agent...' : 'اكتب استفساراً لاختبار رد الوكيل...'}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <Button
          type="submit"
          variant="primary"
          icon={<Send size={18} />}
          disabled={!inputText.trim() || isTyping}
        >
          {isEn ? 'Send' : 'إرسال'}
        </Button>
      </form>
    </div>
  );
};
