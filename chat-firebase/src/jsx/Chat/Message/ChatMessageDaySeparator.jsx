// src/jsx/Chat/Message/ChatMessageDaySeparator.jsx
import React from "react";

/*
  Separador de dias (estilo WhatsApp). Recebe um timestamp (createdAt).
*/
export default function ChatMessageDaySeparator({ createdAt }) {
  if (!createdAt) return null;

  const toDate = (ts) => (ts?.toDate ? ts.toDate() : new Date(ts));
  const d = toDate(createdAt);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  let label;
  if (isSameDay(d, today)) label = "Hoje";
  else if (isSameDay(d, yesterday)) label = "Ontem";
  else label = d.toLocaleDateString();

  return (
    <div style={{ textAlign: "center", margin: "12px 0", fontSize: 12, opacity: 0.75 }}>
      {label}
    </div>
  );
}
