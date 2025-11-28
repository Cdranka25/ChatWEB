// src/js/Chat/PrivateChat.helpers.js

// Apenas linkifica URLs, não mexe com emojis.
export function linkifyAndEmojify(text) {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/gi;

  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"
      style="color:#0b66ff; text-decoration:underline;">${url}</a>`;
  });
}

// formata horário
export function formatTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// cria RoomId único
export function makeRoomId(a, b) {
  return [a, b].sort().join("_");
}

// retorna URL correta da mídia
export function getMessageUrl(m) {
  if (!m) return "";
  if (typeof m === "string") return m;
  return m.publicUrl || m.url || "";
}
