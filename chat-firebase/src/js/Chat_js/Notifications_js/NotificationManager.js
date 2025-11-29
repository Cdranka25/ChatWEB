// src/js/Chat_js/Notifications_js/NotificationManager.js

import { db } from "../../Firebase/FirebaseConfig.js";
import {
  doc,
  updateDoc,
  collectionGroup,
  query,
  where,
  getDocs,
  collection,
  orderBy,
  limit,
  documentId
} from "firebase/firestore";

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

// função auxiliar mínima para marcar recebido com fallbacks
async function markAsReceivedIfNeeded(roomId, messageId) {
  const msgId = messageId;
  try {
    // 1) Se tivermos roomId + messageId => update direto
    if (roomId && msgId) {
      await updateDoc(doc(db, `rooms/${roomId}/messages`, msgId), { status: "received" });
      return;
    }

    // 2) Se tivermos apenas messageId => procurar via collectionGroup
    if (msgId) {
      try {
        const q = query(collectionGroup(db, "messages"), where(documentId(), "==", msgId), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, { status: "received" });
        }
        return;
      } catch (err) {
        console.error("Erro ao procurar mensagem por id:", err);
        // continue para próximos fallbacks
      }
    }

    // 3) Se tivermos apenas roomId => pegar última mensagem daquele room e marcar received
    if (roomId && !msgId) {
      try {
        const msgsRef = collection(db, `rooms/${roomId}/messages`);
        const q2 = query(msgsRef, orderBy("createdAt", "desc"), limit(1));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const d = snap2.docs[0];
          await updateDoc(d.ref, { status: "received" });
        }
      } catch (err) {
        console.error("Erro ao marcar última mensagem do room como received:", err);
      }
    }
  } catch (err) {
    // não falhar a notificação por conta disso
    console.error("Erro ao marcar como recebido (fallback):", err);
  }
}

// --------------------------------------------------------------------
// NOTIFY function (mantemos a mesma exportação para compatibilidade)
// - payload: { id, text, senderName, isGroup, roomId, messageId }
// Nota: 'id' é mantido para compatibilidade — se for ID da mensagem,
// usamos como messageId.
 // --------------------------------------------------------------------
export function notify({ id, text, senderName, isGroup, roomId, messageId } = {}) {
  // dedupe by id (if provided)
  const rawMsgId = messageId || id; // aceitar ambos
  if (rawMsgId) {
    const ts = recent.get(rawMsgId);
    if (ts && (Date.now() - ts) < RECENT_TTL) {
      // já mostramos esta mensagem recentemente
      return;
    }
  }

  // fallback dedupe by text+sender (if no id)
  const dedupeKey = rawMsgId || `${senderName}:::${text}`;
  const ts = recent.get(dedupeKey);
  if (ts && (Date.now() - ts) < RECENT_TTL) return;

  // registra no recent
  recent.set(dedupeKey, Date.now());

  // Se o chat NÃO está ativo, marcar a mensagem como RECEIVED no Firestore
  // (marca silenciosamente, não bloqueia o restante)
  try {
    if (!notify.chatActive) {
      // marca recebido apenas se tivermos roomId or messageId
      if (roomId || rawMsgId) {
        // fire-and-forget para não bloquear UI
        markAsReceivedIfNeeded(roomId, rawMsgId);
      }
    }
  } catch (e) {
    // ignore
    console.error("Erro ao tentar markAsReceivedIfNeeded:", e);
  }

  // dispatch in-app event for popup UI
  try {
    window.dispatchEvent(new CustomEvent("chat_notification", {
      detail: { id: rawMsgId, roomId, text, senderName, isGroup }
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

// anexamos controle de chat ativo à função notify (compatível com chamadas existentes)
notify.chatActive = false;
notify.setChatActive = function (val) {
  notify.chatActive = !!val;
};

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
