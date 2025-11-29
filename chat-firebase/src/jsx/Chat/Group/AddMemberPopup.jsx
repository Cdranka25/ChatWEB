// src/jsx/Chat/Group/AddMemberPopup.jsx
import React, { useEffect, useRef, useState } from "react";
import Avatar from "../../Profile/Avatar";

export default function AddMemberPopup({
  allUsers,
  existingMemberIds,
  onSelect,
  onClose
}) {
  const [query, setQuery] = useState("");
  const popupRef = useRef(null);

  // Fechar clicando fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Filtrar usuários
  const filtered = allUsers
    .filter(u => !existingMemberIds.includes(u.id))
    .filter(u => {
      const q = query.toLowerCase();
      return (
        u.nome?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 5000
      }}
    >
      <div
        ref={popupRef}
        style={{
          width: 380,
          maxHeight: "70vh",
          overflowY: "auto",
          padding: 20,
          borderRadius: 12,
          background: "#fff",
        }}
      >
        <h3>Adicionar membro</h3>

        <input
          placeholder="Pesquisar usuário..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 10,
            marginBottom: 15,
            borderRadius: 8,
            border: "1px solid #ccc"
          }}
        />

        {filtered.length === 0 && (
          <p style={{ fontSize: 14, opacity: 0.7 }}>
            Nenhum usuário encontrado.
          </p>
        )}

        {filtered.map(u => (
          <div
            key={u.id}
            onClick={() => onSelect(u)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 6px",
              borderRadius: 8,
              cursor: "pointer",
              marginBottom: 6,
              background: "#f7f7f7"
            }}
          >
            <Avatar user={u} size={40} />
            <div style={{ marginLeft: 10 }}>
              <div style={{ fontWeight: 600 }}>{u.nome || u.email}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
            </div>
          </div>
        ))}

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "10px 0",
            border: "none",
            borderRadius: 8,
            background: "#ccc"
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
