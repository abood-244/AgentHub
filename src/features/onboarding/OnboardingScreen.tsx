import React, { useState } from 'react';
import './OnboardingScreen.css';

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export const ONBOARDING_COMPLETED_KEY = 'agenthub_onboarding_completed';

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  const handleComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (err) {
      console.warn('Unable to write onboarding state to localStorage:', err);
    }
    onComplete();
  };

  const handleImageError = (step: number) => {
    setImageErrors((prev) => ({ ...prev, [step]: true }));
  };

  return (
    <div className="ah-onboarding-wrapper" dir="rtl">
      <div
        className={`ah-onboarding-container ${
          currentStep === 3 ? 'ah-onboarding-container--step3' : ''
        }`}
      >
        {/* Header: Simulated iOS Status Bar */}
        <header className="ah-onboarding-header" aria-hidden="true">
          <div className="ah-onboarding-statusbar">
            <span className="ah-onboarding-statusbar__time">9:41</span>
            <div className="ah-onboarding-statusbar__icons">
              {/* Cellular Signal Icon */}
              <svg className="w-4 h-3.5 fill-current" viewBox="0 0 17 12" width="16" height="12">
                <rect height="3.5" rx="0.7" width="2.8" x="0" y="8.5" />
                <rect height="6" rx="0.7" width="2.8" x="4.2" y="6" />
                <rect height="9" rx="0.7" width="2.8" x="8.5" y="3" />
                <rect height="12" rx="0.7" width="2.8" x="12.8" y="0" />
              </svg>
              {/* WiFi Icon */}
              <svg className="w-4 h-3.5 fill-current" viewBox="0 0 16 12" width="16" height="12">
                <path d="M8 11.2a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6zm-3.6-3.8a5.1 5.1 0 017.2 0 .8.8 0 001.1-1.1 6.7 6.7 0 00-9.4 0 .8.8 0 101.1 1.1zm-2.7-2.7a8.9 8.9 0 0112.6 0 .8.8 0 101.1-1.1 10.5 10.5 0 00-14.8 0 .8.8 0 101.1 1.1z" />
              </svg>
              {/* Battery Icon */}
              <div
                style={{
                  width: 22,
                  height: 11,
                  border: '1px solid currentColor',
                  borderRadius: 3.5,
                  padding: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: 14,
                    backgroundColor: 'currentColor',
                    borderRadius: 1.5,
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Step-Specific Top Navigation Bar */}
        {currentStep === 1 && (
          <nav className="ah-onboarding-nav ah-onboarding-nav--step1" data-purpose="app-nav">
            <div className="ah-onboarding-logo" dir="ltr">
              <span className="ah-onboarding-logo-navy">Agent</span>
              <span className="ah-onboarding-logo-blue">Hub</span>
            </div>
            {/* Step 1: Skip on left side in RTL */}
            <button
              type="button"
              className="ah-onboarding-skip-btn ah-onboarding-skip-btn--step1"
              data-purpose="skip-action"
              onClick={handleComplete}
            >
              تخطي
            </button>
          </nav>
        )}

        {currentStep === 2 && (
          <nav className="ah-onboarding-nav ah-onboarding-nav--step2" data-purpose="screen-header">
            {/* Balance spacer on right in RTL */}
            <div className="ah-onboarding-nav-spacer" aria-hidden="true" />
            <div className="ah-onboarding-logo" dir="ltr">
              <span className="ah-onboarding-logo-navy">Agent</span>
              <span className="ah-onboarding-logo-blue">Hub</span>
            </div>
            {/* Step 2: Skip on left side in RTL */}
            <button
              type="button"
              className="ah-onboarding-skip-btn"
              data-purpose="skip-action"
              onClick={handleComplete}
            >
              تخطي
            </button>
          </nav>
        )}

        {currentStep === 3 && (
          <nav className="ah-onboarding-nav ah-onboarding-nav--step3" aria-label="شريط التنقل العلوي">
            {/* Step 3: Skip button placed first in flex row (Right side in RTL) matching agenthub_3/code.html */}
            <button
              type="button"
              className="ah-onboarding-skip-btn"
              data-purpose="skip-button"
              onClick={handleComplete}
            >
              تخطي
            </button>
            <div className="ah-onboarding-logo" dir="ltr" data-purpose="brand-logo">
              <span className="ah-onboarding-logo-navy">Agent</span>
              <span className="ah-onboarding-logo-blue">Hub</span>
            </div>
            {/* Ghost spacer to keep logo centered */}
            <div className="ah-onboarding-nav-spacer--step3" aria-hidden="true" />
          </nav>
        )}

        {/* Step-Specific Main Content */}
        {currentStep === 1 && (
          <main className="ah-onboarding-main" data-purpose="onboarding-step-body">
            <div className="ah-onboarding-hero" data-purpose="hero-illustration">
              <div className="ah-onboarding-glow ah-onboarding-glow--step1" aria-hidden="true" />
              {!imageErrors[1] ? (
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnclMJcsAX5TeEBUjAhnKPDW4w8dO2GA6xnopOsntNTGYvYGEbmXbugEHsTsNXDGS3B8lZULOOvqmYWc1yppA-5ujZArfojFd8Oh5TDijVZoU4sS846lD9PsC_X6Ke6wEBlvuionlAu6z2H0BEJWXf6kyRagyM_pz8IencDEH8onKWTdQu_fElOiVie9QiZm5OyR9BHWy5roE0qzUr-0ZZmXCN5bviy82QrsFmvwKnVU91Fg7nGd2V7BYmU_0FJyv00-k"
                  alt="روبوت الذكاء الاصطناعي مع أيقونات تعليمية وبيانية"
                  className="ah-onboarding-img"
                  onError={() => handleImageError(1)}
                  loading="eager"
                />
              ) : (
                <div className="ah-onboarding-fallback">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="10" rx="3" />
                    <circle cx="12" cy="5" r="2" />
                    <line x1="12" y1="7" x2="12" y2="11" />
                    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                  </svg>
                  <span>الذكاء الاصطناعي للجامعة</span>
                </div>
              )}
            </div>

            <div className="ah-onboarding-text" data-purpose="text-content">
              <h1 className="ah-onboarding-title">
                أدخل الذكاء الاصطناعي
                <br />
                إلى جامعتك بسهولة
              </h1>
              <p className="ah-onboarding-subtitle">
                يتيح لجامعتك تشغيل وكلاء ذكاء اصطناعي متخصصين لخدمة الطلاب والموظفين وتعزيز الخدمات
                الأكاديمية والإدارية.
              </p>
            </div>
          </main>
        )}

        {currentStep === 2 && (
          <main className="ah-onboarding-main" data-purpose="onboarding-step-body">
            <div className="ah-onboarding-hero" data-purpose="hero-illustration">
              {!imageErrors[2] ? (
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_HVD9v63eDH7bj_MYRP-6bcwQ43R-ebp502MABZhyi2pHCjZOV4t-GiWrIL6YSHriV0GbrawJTzwIIXULNm6eUZJM6RXnOMj4IVtMnS5YJ8OXZfZdKttpCZe-g8n7fQMbvZyvsbwhelqgAnifP3rFPuWEvOQlWDFJtnwBlU3lG4mHKz0pYFO4gvuvOmMzd4WoWa6ScOO7mI0Ax0u1MQXtnCO4AimyFqoIle5nhr-UBakH9vjJ0waBIQ4boVqp-tG4J2M"
                  alt="ادارة مركزية ووكلاء متخصصين"
                  className="ah-onboarding-img"
                  onError={() => handleImageError(2)}
                  loading="eager"
                />
              ) : (
                <div className="ah-onboarding-fallback">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <path d="M7 8h4M7 12h2" />
                  </svg>
                  <span>الإدارة المركزية والوكلاء</span>
                </div>
              )}
            </div>

            <div className="ah-onboarding-text" data-purpose="content-text">
              <h1 className="ah-onboarding-title ah-onboarding-title--step2">
                ادارة مركزية ووكلاء متخصصين
              </h1>
              <p className="ah-onboarding-subtitle">
                أنشئ ووكلاء ذكاء اصطناعي مخصصين لكلياتك وإداراتك، وأدر المستخدمين والصلاحيات، وحقق
                التكامل مع أنظمتك الجامعية.
              </p>
            </div>
          </main>
        )}

        {currentStep === 3 && (
          <main className="ah-onboarding-main" data-purpose="main-content">
            <div className="ah-onboarding-hero" data-purpose="hero-illustration">
              <div className="ah-onboarding-glow ah-onboarding-glow--step3" aria-hidden="true" />
              {!imageErrors[3] ? (
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9MydOcAgcFzPDTVAr3j0EaPBn-3bUGoMp31w5d4H5OP2mnIYGGdz8UmqQb4zzYw7FB6eAVr0n1geyhO_4SQsNc-b6UHV_Q9vWJJwPBr6Izcfx9gxOXhgCNfdC_3TQmm8rJC4RDYCBtCDRpmbXJBFVimN4dSVvl1GDcp5ARXrERGnhq5JIAhwPtDE--t19_WzJDlVbQAs-Cb9Y6yvHtL45zVcOah7e3AlVC51qgwej2TuqW2RZQxsK0Mei7ZVs86LwfcI"
                  alt="رسم توضيحي للمنشأة التعليمية مع الخدمات الرقمية المتصلة"
                  className="ah-onboarding-img"
                  onError={() => handleImageError(3)}
                  loading="eager"
                />
              ) : (
                <div className="ah-onboarding-fallback">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 21h18M5 21V9l7-5 7 5v12M9 14h6" />
                  </svg>
                  <span>خدمات رقمية جامعية متصلة</span>
                </div>
              )}
            </div>

            <div className="ah-onboarding-text" data-purpose="content-text">
              <h1 className="ah-onboarding-title">خدمات أكثر.. تأثير أكبر</h1>
              <p className="ah-onboarding-subtitle">
                قدم خدمات ذكية للطلاب وأعضاء هيئة التدريس والموظفين، وارقب الأداء من خلال تقارير
                شاملة للتحسين المستمر.
              </p>
            </div>
          </main>
        )}

        {/* Step-Specific Footer & Controls */}
        {currentStep === 1 && (
          <footer className="ah-onboarding-footer ah-onboarding-footer--step1" data-purpose="footer-actions">
            {/* Pagination dots (3 equal dots, active is rightmost dot in RTL) */}
            <div className="ah-onboarding-dots" aria-label="شريط التقدم" role="tablist">
              <span
                aria-current="step"
                className="ah-onboarding-dot ah-onboarding-dot--active-step1"
              />
              <span className="ah-onboarding-dot ah-onboarding-dot--inactive" />
              <span className="ah-onboarding-dot ah-onboarding-dot--inactive" />
            </div>

            {/* Bottom Full-width Next Button with RTL Left Arrow */}
            <div className="ah-onboarding-btn-wrap">
              <button
                type="button"
                className="ah-onboarding-btn ah-onboarding-btn--next-full"
                data-purpose="next-button"
                onClick={() => setCurrentStep(2)}
              >
                <span>التالي</span>
                <svg
                  className="ah-onboarding-arrow-svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <line x1="19" x2="5" y1="12" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            </div>

            {/* iOS Home Indicator */}
            <div className="ah-onboarding-home-indicator" aria-hidden="true" />
          </footer>
        )}

        {currentStep === 2 && (
          <footer className="ah-onboarding-footer ah-onboarding-footer--step2" data-purpose="bottom-controls">
            {/* Pagination dots (Dot 2 is active) */}
            <div className="ah-onboarding-dots" aria-label="مؤشر الصفحات" role="tablist">
              <span className="ah-onboarding-dot ah-onboarding-dot--inactive" />
              <span
                aria-current="step"
                className="ah-onboarding-dot ah-onboarding-dot--active-step2"
              />
              <span className="ah-onboarding-dot ah-onboarding-dot--inactive" />
            </div>

            {/* Action buttons row (In RTL grid: Right = السابق, Left = التالي) */}
            <div className="ah-onboarding-btn-grid" data-purpose="action-buttons">
              <button
                type="button"
                className="ah-onboarding-btn ah-onboarding-btn--prev-step2"
                onClick={() => setCurrentStep(1)}
              >
                السابق
              </button>
              <button
                type="button"
                className="ah-onboarding-btn ah-onboarding-btn--next-step2"
                onClick={() => setCurrentStep(3)}
              >
                <span>التالي</span>
                <svg
                  className="ah-onboarding-arrow-svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <line x1="19" x2="5" y1="12" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            </div>

            {/* iOS Home Indicator */}
            <div className="ah-onboarding-home-indicator" aria-hidden="true" />
          </footer>
        )}

        {currentStep === 3 && (
          <footer className="ah-onboarding-footer ah-onboarding-footer--step3" data-purpose="bottom-actions">
            {/* Pagination dots: Dot 1 & 2 round inactive, Dot 3 elongated active pill */}
            <div className="ah-onboarding-dots" aria-label="مؤشر الصفحات" role="tablist">
              <span className="ah-onboarding-dot ah-onboarding-dot--inactive-step3" />
              <span className="ah-onboarding-dot ah-onboarding-dot--inactive-step3" />
              <span
                aria-current="page"
                className="ah-onboarding-dot ah-onboarding-dot--pill-step3"
              />
            </div>

            {/* Stacked Action Buttons */}
            <div className="ah-onboarding-btn-stack">
              {/* Primary CTA: ابدأ الآن */}
              <button
                type="button"
                className="ah-onboarding-btn ah-onboarding-btn--get-started"
                data-purpose="primary-cta"
                onClick={handleComplete}
              >
                <span>ابدأ الآن</span>
                <svg className="ah-onboarding-arrow-svg" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                  />
                </svg>
              </button>

              {/* Secondary CTA: السابق */}
              <button
                type="button"
                className="ah-onboarding-btn ah-onboarding-btn--prev-step3"
                data-purpose="secondary-cta"
                onClick={() => setCurrentStep(2)}
              >
                السابق
              </button>
            </div>

            {/* iOS Home Indicator */}
            <div className="ah-onboarding-home-indicator" aria-hidden="true" />
          </footer>
        )}
      </div>
    </div>
  );
};
