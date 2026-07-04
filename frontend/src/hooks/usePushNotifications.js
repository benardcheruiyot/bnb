import { useEffect } from 'react';
import api from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function getVapidPublicKey() {
  // Use env var if available (avoids extra request)
  if (process.env.REACT_APP_VAPID_PUBLIC_KEY) {
    return process.env.REACT_APP_VAPID_PUBLIC_KEY;
  }
  const res = await api.get('/push/vapid-key');
  return res.data.publicKey;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    // Already subscribed — ensure backend has it
    await api.post('/push/subscribe', existing.toJSON());
    return;
  }

  const vapidKey = await getVapidPublicKey();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await api.post('/push/subscribe', subscription.toJSON());
}

/**
 * Call this hook inside a component that renders only when the user is authenticated.
 */
export function usePushNotifications(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated) return;
    subscribeToPush().catch((err) => {
      console.warn('Push subscription error:', err.message);
    });
  }, [isAuthenticated]);
}
