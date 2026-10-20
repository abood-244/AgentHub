import React, { useState } from 'react';
import { useClerk } from '@clerk/react';
import './SignInScreen.css';

export const SignInScreen: React.FC = () => {
  const clerk = useClerk();
  const isLoaded = clerk.loaded;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSecondFactor, setIsSecondFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      let result = await clerk.client.signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === 'needs_first_factor') {
        result = await clerk.client.signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });
      }

      if (result.status === 'needs_second_factor' || (result.status as string) === 'needs_client_trust') {
        const factorStrategy =
          (result.supportedSecondFactors?.find((f: any) => f.strategy === 'email_code')?.strategy as any) ||
          (result.supportedSecondFactors?.[0] as any)?.strategy ||
          'email_code';

        try {
          await clerk.client.signIn.prepareSecondFactor({ strategy: factorStrategy });
        } catch (prepErr) {
          console.warn('prepareSecondFactor failed or already prepared:', prepErr);
        }
        setIsSecondFactor(true);
        setInfoMessage('تم إرسال كود التحقق الأمني (Device Trust / 2FA) إلى بريدك الإلكتروني. يرجى إدخاله لإتمام تسجيل الدخول.');
        setIsLoading(false);
        return;
      }

      if (result.status === 'complete') {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        console.log('Clerk sign-in status:', result.status);
        setErrorMessage(`يتطلب تسجيل الدخول خطوات إضافية غير مكتملة (حالة الحساب: ${result.status}).`);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const firstError = err?.errors?.[0];
      const message = firstError?.longMessage || firstError?.message || err?.message || 'فشل تسجيل الدخول. يرجى التحقق من البريد وكلمة المرور.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !verificationCode.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await clerk.client.signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: verificationCode.trim(),
      });

      if (res.status === 'complete') {
        await clerk.setActive({ session: res.createdSessionId });
      } else {
        setErrorMessage('رمز التحقق غير صحيح أو منتهي الصلاحية.');
      }
    } catch (err: any) {
      console.error('Second factor verification error:', err);
      const firstError = err?.errors?.[0];
      const message = firstError?.longMessage || firstError?.message || err?.message || 'فشل التحقق من الرمز.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/`,
      });
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const message = err?.errors?.[0]?.message || err?.message || 'تعذر بدء تسجيل الدخول بواسطة Google.';
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMessage('يرجى كتابة بريدك الإلكتروني في الحقل أعلاه أولاً لإرسال رابط الاستعادة.');
      return;
    }

    if (!isLoaded) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setInfoMessage('تم إرسال كود استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const msg = err?.errors?.[0]?.message || 'تعذر إرسال رابط استعادة كلمة المرور.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ah-signin-wrapper" dir="rtl">
      <div className="ah-signin-container">
        {/* Campus Building Background Image with Gradient Mask */}
        <div className="ah-signin-header-bg" aria-hidden="true">
          <img
            alt="Campus Background"
            className="ah-signin-bg-image"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBizuUEJV8TD9LshqviBfrl4ZIL0MbM_VIGdXWkenATjlbvs45APQi3dIYR5aBTcM8Kglr1-flD3ngo6npGlOdCSSNQb-xPmD10F7wdJYT_j_nOI5UgqmMuszOSbQ2fLznl2e62vPW-LBvDViUkbbClGVBW0kBUyWdN0uHYbFhNp76Hvbnpq2MEvaTxE4JYCovBsV8B3ujgEprRB4H8abJCo6HJWkwb2VcgAUUT9bd61rKidg8GcSf6EA"
          />
          <div className="ah-signin-bg-overlay" />
        </div>

        {/* iOS Status Bar */}
        <header className="ah-signin-statusbar" aria-hidden="true">
          <div className="ah-signin-statusbar__time">9:41</div>
          <div className="ah-signin-statusbar__icons">
            {/* Cellular signal */}
            <svg className="w-4 h-3.5 fill-current" viewBox="0 0 17 12" width="16" height="12">
              <rect height="3.5" rx="0.7" width="2.8" x="0" y="8.5" />
              <rect height="6" rx="0.7" width="2.8" x="4.2" y="6" />
              <rect height="9" rx="0.7" width="2.8" x="8.5" y="3" />
              <rect height="12" rx="0.7" width="2.8" x="12.8" y="0" />
            </svg>
            {/* WiFi */}
            <svg className="w-4 h-3.5 fill-current" viewBox="0 0 16 12" width="16" height="12">
              <path d="M8 11.2a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm-3.6-3.8a5.1 5.1 0 017.2 0 .8.8 0 001.1-1.1 6.7 6.7 0 00-9.4 0 .8.8 0 101.1 1.1zm-2.7-2.7a8.9 8.9 0 0112.6 0 .8.8 0 101.1-1.1 10.5 10.5 0 00-14.8 0 .8.8 0 101.1 1.1z" />
            </svg>
            {/* Battery */}
            <div style={{ width: 22, height: 11, border: '1px solid currentColor', borderRadius: 3.5, padding: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ height: '100%', width: 14, backgroundColor: 'currentColor', borderRadius: 1.5 }} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="ah-signin-main">
          <div>
            {/* Branding Header: Temple Logo Icon & AgentHub Typography */}
            <div className="ah-signin-brand-box">
              <div className="ah-signin-temple-icon" aria-hidden="true">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 64 64" width="40" height="40">
                  <path d="M32 10L12 24H52L32 10Z" fill="currentColor" />
                  <rect fill="currentColor" height="3.5" rx="1" width="36" x="14" y="25" />
                  <rect fill="currentColor" height="15" rx="0.8" width="4.5" x="18" y="30.5" />
                  <rect fill="currentColor" height="15" rx="0.8" width="4.5" x="26.5" y="30.5" />
                  <rect fill="currentColor" height="15" rx="0.8" width="4.5" x="35" y="30.5" />
                  <rect fill="currentColor" height="15" rx="0.8" width="4.5" x="43.5" y="30.5" />
                  <rect fill="currentColor" height="3.5" rx="1" width="40" x="13" y="47.5" />
                  <rect fill="currentColor" height="3" rx="1.5" width="46" x="10" y="52" />
                </svg>
              </div>

              <h1 className="ah-signin-brand-title">
                <span className="ah-signin-brand-main">Agent</span>
                <span className="ah-signin-brand-accent">Hub</span>
              </h1>
            </div>

            {/* Welcome Headings */}
            <div className="ah-signin-titles">
              <h2 className="ah-signin-heading">مرحباً بعودتك</h2>
              <p className="ah-signin-subheading">سجل الدخول إلى حسابك في AgentHub</p>
            </div>

            {/* Error and Info Alerts */}
            {errorMessage && (
              <div className="ah-signin-error-alert" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {infoMessage && (
              <div className="ah-signin-success-alert" role="status">
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Login Form: Second Factor Code or Regular Email & Password */}
            {isSecondFactor ? (
              <form className="ah-signin-form" onSubmit={handleSecondFactorSubmit}>
                <div className="ah-signin-field">
                  <div className="ah-signin-input-wrapper">
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      required
                      dir="ltr"
                      className="ah-signin-input"
                      placeholder="أدخل كود التحقق (6 أرقام)"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="ah-signin-submit-btn"
                  disabled={isLoading}
                >
                  <span>{isLoading ? 'جاري التحقق...' : 'تأكيد الرمز والدخول'}</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSecondFactor(false);
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#0878F9', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    الرجوع لتسجيل الدخول بكلمة المرور
                  </button>
                </div>
              </form>
            ) : (
              <form className="ah-signin-form" onSubmit={handleEmailPasswordSubmit}>
              {/* Field 1: Email */}
              <div className="ah-signin-field">
                <div className="ah-signin-input-wrapper">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    dir="ltr"
                    className="ah-signin-input"
                    placeholder="البريد الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  <div className="ah-signin-field-icon" aria-hidden="true">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Field 2: Password with visibility toggle */}
              <div className="ah-signin-field">
                <div className="ah-signin-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    className="ah-signin-input ah-signin-input--password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <div className="ah-signin-field-icon" aria-hidden="true">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" width="14" x="5" y="11" />
                      <path d="M8 11V7a4 4 0 118 0v4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                  </div>

                  <button
                    type="button"
                    className="ah-signin-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Auxiliary Row: Remember Me & Forgot Password */}
              <div className="ah-signin-aux-row">
                <label className="ah-signin-remember-label">
                  <input
                    type="checkbox"
                    className="ah-signin-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>تذكرني</span>
                </label>

                <button
                  type="button"
                  className="ah-signin-forgot-btn"
                  onClick={handleForgotPassword}
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="ah-signin-submit-btn"
                disabled={isLoading}
              >
                <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
                {/* Arrow icon facing left for RTL */}
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                </svg>
              </button>
            </form>
            )}

            {/* Divider: أو */}
            <div className="ah-signin-divider" aria-hidden="true">
              <div className="ah-signin-divider__line" />
              <span className="ah-signin-divider__text">أو</span>
            </div>

            {/* Social Authentication: Google OAuth (Replacing Microsoft while preserving layout) */}
            <button
              type="button"
              className="ah-signin-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {/* Official Google 4-Color Icon */}
              <svg className="w-5 h-5 flex-shrink-0" width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>تسجيل الدخول باستخدام Google</span>
            </button>
          </div>

          {/* Bottom Footer */}
          <footer className="ah-signin-footer">
            <p className="ah-signin-footer__text">
              ليس لديك حساب؟{' '}
              <a href="mailto:admin@agenthub.dev" className="ah-signin-footer__link">
                تواصل مع مسؤول الجامعة
              </a>
            </p>
            {/* iOS Home Indicator */}
            <div className="ah-signin-home-indicator" aria-hidden="true" />
          </footer>
        </main>
      </div>
    </div>
  );
};
