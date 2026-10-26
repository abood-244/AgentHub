import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim()

if (!PUBLISHABLE_KEY) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not defined in environment variables.')
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ClerkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Failed to initialize authentication',
    };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Authentication Error Boundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#071B45',
            color: '#ffffff',
            fontFamily: "'IBM Plex Sans Arabic', -apple-system, sans-serif",
            padding: '24px',
            textAlign: 'center',
            direction: 'rtl',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              <span>Agent</span><span style={{ color: '#0878F9' }}>Hub</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '16px 0 8px', color: '#F87171' }}>
              تعذر الاتصال بخدمة المصادقة (Clerk)
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 16px' }}>
              فشل المتصفح في تحميل سكربت المصادقة الخارجي. قد يكون السبب حجب مزود الإنترنت المحلي (ISP) للنطاق أو انقطاع الاتصال مؤقتاً.
            </p>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#CBD5E1',
                marginBottom: '20px',
                fontFamily: 'monospace',
                direction: 'ltr',
                wordBreak: 'break-all',
              }}
            >
              {this.state.errorMessage}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0878F9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                إعادة المحاولة (Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} proxyUrl="/__clerk">
        <App />
      </ClerkProvider>
    </ClerkErrorBoundary>
  </StrictMode>,
)
