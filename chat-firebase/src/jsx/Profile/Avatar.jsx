// src/jsx/Avatar.jsx
import React, { useState } from "react";

export default function Avatar({ user, size = 40, label }) {
  const [erro, setErro] = useState(false);

  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: Math.max(12, Math.floor(size / 3)),
    background: "#ddd",
    overflow: "hidden",
    color: "#333",
    textTransform: "uppercase"
  };

  const name = (user && (user.nome || user.email)) || label || "U";

  // Se não tem user ou deu erro no load, mostra iniciais
  if (!user || !user.avatarUrl || erro) {
    return <div style={style}>{getInitials(name)}</div>;
  }

  return (
    <img
      src={user.avatarUrl}
      alt={user.nome || user.email || "avatar"}
      style={{ ...style, objectFit: "cover", display: "block" }}
      onError={() => setErro(true)}
      loading="lazy"
    />
  );
}

function getInitials(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== "string") return "?";
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
