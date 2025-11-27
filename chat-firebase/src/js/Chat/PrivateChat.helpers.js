// src/js/Chat/PrivateChat.helpers.js
import { emojify } from "./Emoji/EmojiParser.js";

export function linkifyAndEmojify(text) {
  if (!text) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/gi;

  const html = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"
      style="color:#0b66ff; text-decoration:underline;">${url}</a>`;
  });

  return emojify(html);
}

export function formatTime(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function makeRoomId(a, b) {
  return [a, b].sort().join("_");
}

export function getMessageUrl(m) {
  if (!m) return "";
  if (typeof m === "string") return m;
  return m.publicUrl || m.url || "";
}
