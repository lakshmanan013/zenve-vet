import React, { useState, useEffect } from 'react';
import { BellRing, X, Smartphone, Laptop, Share2, CheckCircle2 } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  isIOS,
  isStandalonePWA
} from '../services/notificationService';

export function DeviceNotificationBanner() {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('poste_notif_prompt_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Keep permission in sync
    const updatePerm = () => setPermission(getNotificationPermission());
    updatePerm();
    window.addEventListener('focus', updatePerm);
    return () => window.removeEventListener('focus', updatePerm);
  }, []);

  // If already granted or explicitly dismissed, don't show the banner
  if (permission === 'granted' || dismissed) {
    return null;
  }

  // If unsupported or denied, don't show
  if (permission === 'denied' || permission === 'unsupported') {
    return null;
  }

  const handleEnable = async () => {
    if (isIOS() && !isStandalonePWA()) {
      setShowIosGuide(true);
      return;
    }

    setIsRequesting(true);
    try {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res === 'granted') {
        localStorage.setItem('poste_notif_prompt_dismissed', 'true');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('poste_notif_prompt_dismissed', 'true');
    } catch { }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #022c1b 0%, #064e3b 100%)',
        color: '#ffffff',
        borderBottom: '1px solid rgba(46, 229, 157, 0.25)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        position: 'relative',
        zIndex: 9999,
        boxShadow: '0 4px 18px rgba(0, 35, 20, 0.25)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '260px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(46, 229, 157, 0.15)',
            border: '1px solid rgba(46, 229, 157, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <BellRing size={18} color="#2ee59d" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              Enable Device Notifications
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#2ee59d',
                background: 'rgba(46, 229, 157, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              Laptop, Mobile & iOS
            </span>
          </div>
          <span style={{ fontSize: '11.5px', color: '#c2ded2', lineHeight: 1.35 }}>
            {isIOS() && !isStandalonePWA()
              ? 'Receive notifications outside Safari on iPhone/iPad by installing to your Home Screen.'
              : 'Receive alerts outside the website on your desktop, laptop, or phone lock screen.'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleEnable}
          disabled={isRequesting}
          style={{
            backgroundColor: '#2ee59d',
            color: '#003822',
            border: 'none',
            borderRadius: '999px',
            padding: '7px 16px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(46, 229, 157, 0.35)'
          }}
        >
          {isIOS() && !isStandalonePWA() ? (
            <>
              <Share2 size={13} />
              <span>How to Enable on iPhone</span>
            </>
          ) : (
            <>
              <BellRing size={13} />
              <span>{isRequesting ? 'Enabling...' : 'Enable Alerts'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          title="Dismiss notification prompt"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7ca895',
            padding: '6px',
            cursor: 'pointer',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* iOS Safari Home Screen Guide Modal */}
      {showIosGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowIosGuide(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              color: '#0f172a'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={20} color="#003822" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#003822' }}>
                  Enable iPhone & iPad Alerts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Apple requires web apps to be added to your Home Screen before they can send lock-screen notifications outside Safari:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#003822', color: '#ffffff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  1
                </span>
                <span style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.4 }}>
                  In Safari, tap the <strong>Share</strong> button at the bottom of the screen (square with arrow pointing up).
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#003822', color: '#ffffff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  2
                </span>
                <span style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.4 }}>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#003822', color: '#ffffff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  3
                </span>
                <span style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.4 }}>
                  Open <strong>poste Vet</strong> from your iPhone Home Screen and tap <strong>Enable Alerts</strong>.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#003822',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
