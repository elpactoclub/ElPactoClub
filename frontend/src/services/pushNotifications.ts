// EN: Service that registers the browser for Web Push notifications using a VAPID key fetched from the backend.
// ES: Servicio que registra el navegador para notificaciones Web Push usando una clave VAPID obtenida del backend.

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1`;

// EN: Converts a URL-safe base64 string to an ArrayBuffer suitable for the Push API applicationServerKey.
// ES: Convierte una cadena base64 URL-safe en un ArrayBuffer apto para applicationServerKey de la Push API.
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

// EN: Registers the service worker, fetches the VAPID key, requests permission and sends the subscription to the server.
// ES: Registra el service worker, obtiene la clave VAPID, solicita permiso y envía la suscripción al servidor.
export async function registerPush(token: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    // Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Get VAPID public key from server
    const r = await fetch(`${API}/notifications/push/vapid-public-key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { key } = await r.json();
    if (!key) return;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Subscribe
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    const sub = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };

    // Send subscription to server
    await fetch(`${API}/notifications/push/subscribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
  } catch {
    // Push not available or denied — silent fail
  }
}
