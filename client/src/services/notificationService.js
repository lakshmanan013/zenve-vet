// Universal Cross-Platform Notification Service for Desktop, Laptop, Android & iOS
// Native OS Push & Background Alerts

let swRegistration = null;

// Detect iOS devices (iPhone, iPad, iPod)
export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

// Check if app is running as standalone PWA (Home Screen app on iOS/Android)
export const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

// Register Service Worker for Web Push & Mobile Android / iOS
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;

    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('Zenve Vet service worker updated.');
          }
        };
      }
    };

    return reg;
  } catch (err) {
    console.warn('Service Worker registration skipped:', err);
    return null;
  }
};

// Listen for messages from Service Worker (e.g. notification click on Android/desktop)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NAVIGATE_NOTIFICATION') {
      window.dispatchEvent(
        new CustomEvent('zenve-notification-click', {
          detail: event.data.data
        })
      );
    }
  });
}

// Gentle, melodic incoming message chime using HTML5 Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: 659.25Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.14, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.32);

    // Tone 2: 880Hz (A5) harmonized chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09);
    gain2.gain.setValueAtTime(0.18, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.52);
  } catch (_) {
    // Audio context may be blocked prior to first user gesture
  }
};

// Check if browser notifications are supported
export const isNotificationSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window || (isIOS() && isStandalonePWA() && 'serviceWorker' in navigator);
};

// Get current system permission status ('granted' | 'denied' | 'default' | 'unsupported')
export const getNotificationPermission = () => {
  if (typeof window === 'undefined') return 'unsupported';
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'unsupported';
};

// Request desktop, laptop & mobile system notification permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined') return 'unsupported';

  // Ensure Service Worker is ready
  if (!swRegistration && 'serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.ready;
    } catch (_) { }
  }

  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      playNotificationChime();
      await showNotification({
        title: 'Zenve Vet Alerts Active',
        message: 'You will receive outside notifications for incoming messages, surgical reels, and clinical cases.',
        type: 'SYSTEM'
      });
    }
    return perm;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
};

// Show a cross-platform notification (System OS + In-App Toast + Sound)
export const showNotification = async ({
  title,
  message,
  type = 'GENERAL', // 'NEW_MESSAGE' | 'REEL_UPLOAD' | 'CLINICAL_CASE_SHARED' | 'CONNECTION_REQUEST' | 'SYSTEM'
  senderName,
  senderAvatar,
  targetId,
  data = {},
  onClick
}) => {
  // 1. Play auditory chime
  playNotificationChime();

  // 2. Dispatch custom in-app event for interactive floating toast banner
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zenve-notification', {
        detail: {
          id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: title || 'Zenve Vet Clinical Alert',
          message,
          type,
          senderName,
          senderAvatar,
          targetId,
          data: {
            ...data,
            targetId,
            senderId: data.senderId || targetId,
            senderName,
            senderAvatar
          },
          timestamp: new Date().toISOString(),
          onClick
        }
      })
    );
  }

  // 3. Trigger native OS notification outside the browser:
  // - Windows Action Center & taskbar popup banner
  // - macOS Notification Center
  // - Android Notification shade & lockscreen
  // - iOS 16.4+ Web Push notification banner
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Tag grouped by sender so multiple messages from the same sender update cleanly
      const senderKey = (data && data.senderId) || targetId;
      const notifTag = type === 'NEW_MESSAGE' && senderKey
        ? `zenve-chat-${senderKey}`
        : `zenve-${type}-${targetId || Date.now()}`;

      const options = {
        body: message,
        // Operating systems require PNG/JPG icons (SVG fails on Windows & Android)
        icon: senderAvatar && !senderAvatar.endsWith('.svg') ? senderAvatar : '/zenve_logo.png',
        badge: '/zenve_logo.png',
        vibrate: type === 'NEW_MESSAGE' ? [120, 80, 180, 80, 120] : [200, 100, 200],
        tag: notifTag,
        renotify: true,
        requireInteraction: false,
        data: {
          type,
          targetId,
          senderId: (data && data.senderId) || targetId,
          senderName,
          senderAvatar,
          url: window.location.origin,
          ...data
        }
      };

      // Prefer ServiceWorkerRegistration.showNotification() - REQUIRED on Android & iOS
      let reg = swRegistration;
      if (!reg && 'serviceWorker' in navigator) {
        try {
          reg = await navigator.serviceWorker.ready;
          swRegistration = reg;
        } catch (_) { }
      }

      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title || 'Zenve Vet Alert', options);
      } else if ('Notification' in window) {
        // Fallback for desktop browsers without active SW registration
        const nativeNotif = new Notification(title || 'Zenve Vet Alert', options);
        nativeNotif.onclick = () => {
          window.focus();
          nativeNotif.close();
          if (onClick) onClick();
        };
      }
    } catch (e) {
      console.warn('Native OS notification trigger fallback:', e);
    }
  }
};

// Direct Message Notification Helper
export const notifyIncomingChatMessage = ({
  senderId,
  senderName,
  senderAvatar,
  message,
  conversationId,
  onClick
}) => {
  return showNotification({
    title: senderName || 'Peer Doctor',
    message: message || 'Sent you a direct clinical message.',
    type: 'NEW_MESSAGE',
    senderName,
    senderAvatar,
    targetId: senderId,
    data: {
      type: 'NEW_MESSAGE',
      senderId,
      targetId: senderId,
      senderName,
      senderAvatar,
      conversationId
    },
    onClick
  });
};

// Convenient Helpers
export const notifyReelUploaded = ({ doctorName, reelTitle, videoId, onSelectVideo }) => {
  return showNotification({
    title: 'New Surgical Reel Uploaded',
    message: `${doctorName || 'A doctor'} uploaded a surgical reel: "${reelTitle || 'Clinical Demonstration'}"`,
    type: 'REEL_UPLOAD',
    senderName: doctorName,
    targetId: videoId,
    onClick: onSelectVideo
  });
};

export const notifyCaseShared = ({ doctorName, caseTitle, caseId, onSelectCase }) => {
  return showNotification({
    title: 'New Clinical Case Shared',
    message: `${doctorName || 'A doctor'} shared a clinical case: "${caseTitle || 'Case Study'}"`,
    type: 'CLINICAL_CASE_SHARED',
    senderName: doctorName,
    targetId: caseId,
    onClick: onSelectCase
  });
};

export const sendTestNotification = () => {
  return showNotification({
    title: 'Zenve Vet Notification Test',
    message: 'Outside notifications are active on this device for surgical reels, clinical cases, and peer messages.',
    type: 'SYSTEM'
  });
};

// Simulate a direct message notification for instant testing
export const simulateDirectMessageNotification = (onOpenChat) => {
  return notifyIncomingChatMessage({
    senderId: 2,
    senderName: 'Dr. Arjun Mehta, BVSc',
    senderAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    message: 'Hello Doctor! Could you review this clinical case and blood report?',
    conversationId: 2,
    onClick: onOpenChat ? () => onOpenChat({
      id: 2,
      name: 'Dr. Arjun Mehta, BVSc',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
    }) : undefined
  });
};
