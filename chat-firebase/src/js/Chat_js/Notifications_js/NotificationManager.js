// src/js/Chat_js/Notifications_js/NotificationManager.js

// --------------------------------------------------------------------
// Simple notification manager with dedupe + in-app event
// --------------------------------------------------------------------

let audio = null;
function loadSound() {
  if (!audio) {
    audio = new Audio("/notification.mp3");
    audio.volume = 1.0;
  }
}

// memória de notificações recentes (msgId -> timestamp)
const recent = new Map();
// TTL em ms para considerar como "já mostrado"
const RECENT_TTL = 30 * 1000; // 30s

function cleanupRecent() {
  const now = Date.now();
  for (const [k, t] of recent.entries()) {
    if (now - t > RECENT_TTL) recent.delete(k);
  }
}
setInterval(cleanupRecent, 10 * 1000);

// --------------------------------------------------------------------
// NOTIFY function
// - payload: { id, text, senderName, isGroup }
// --------------------------------------------------------------------
export function notify({ id, text, senderName, isGroup }) {
  // dedupe by id (if provided)
  if (id) {
    const ts = recent.get(id);
    if (ts && (Date.now() - ts) < RECENT_TTL) {
      // já mostramos esta mensagem recentemente
      return;
    }
  }

  // fallback dedupe by text+sender (if no id)
  const dedupeKey = id || `${senderName}:::${text}`;
  const ts = recent.get(dedupeKey);
  if (ts && (Date.now() - ts) < RECENT_TTL) return;

  // registra no recent
  recent.set(dedupeKey, Date.now());

  // dispatch in-app event for popup UI
  try {
    window.dispatchEvent(new CustomEvent("chat_notification", {
      detail: { id, text, senderName, isGroup }
    }));
  } catch (e) {
    // ignore
  }

  // browser notification + sound
  try {
    loadSound();

    if (!("Notification" in window)) {
      console.log("Navegador não suporta notificações.");
      return;
    }
    if (Notification.permission !== "granted") {
      // não dispara, apenas retorna
      return;
    }

    new Notification(senderName || "Nova mensagem", {
      body: text || (isGroup ? "Nova mensagem no grupo" : "Nova mensagem"),
      icon: "/logo.png"
    });

    // tocar som (catch para evitar erro)
    audio.play().catch(() => { });

  } catch (err) {
    console.warn("Erro ao notificar:", err);
  }
}

// --------------------------------------------------------------------
// Settings (localStorage)
// --------------------------------------------------------------------
const STORAGE_KEY = "notification_settings_v1";

export function getNotificationSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function updateNotificationSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log("Configurações de notificação salvas:", settings);
  } catch (err) {
    console.error("Erro ao salvar configurações:", err);
  }
}
