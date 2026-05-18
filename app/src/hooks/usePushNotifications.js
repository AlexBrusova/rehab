import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../lib/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function usePushNotifications(activeHouseId) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported] = useState(
    () => "serviceWorker" in navigator && "PushManager" in window
  );

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const { publicKey } = await authFetch("/api/push/public-key");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const { endpoint, keys } = sub.toJSON();
      await authFetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          houseId: activeHouseId || null,
        }),
      });
      setEnabled(true);
    } catch (e) {
      console.error("Push subscribe failed:", e);
    } finally {
      setLoading(false);
    }
  }, [supported, activeHouseId]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await authFetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE",
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch (e) {
      console.error("Push unsubscribe failed:", e);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const toggle = useCallback(() => {
    if (enabled) return unsubscribe();
    return subscribe();
  }, [enabled, subscribe, unsubscribe]);

  return { supported, enabled, loading, toggle };
}
