// src/jsx/Profile/ProfileView.jsx
import React from "react";
import Avatar from "./Avatar.jsx";

export default function ProfileView({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="profile-screen">

      {/* HEADER */}
      <div className="chat-header">
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "white", fontSize: 18 }}
        >
          ←
        </button>
        <span style={{ marginLeft: 10 }}>Perfil</span>
      </div>

      {/* BODY */}
      <div className="profile-container">

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Avatar user={user} size={120} />
        </div>

        <div className="profile-field">
          <label>Nome</label>
          <input value={user.nome || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Email</label>
          <input value={user.email || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Telefone</label>
          <input value={user.phone || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Empresa</label>
          <input value={user.company || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Data de nascimento</label>
          <input type="date" value={user.birthdate || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Status</label>
          <input value={user.status || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Sobre</label>
          <textarea rows={3} value={user.about || ""} disabled />
        </div>

        <div className="profile-field">
          <label>Links</label>
          {(!user.links || user.links.length === 0) && (
            <p style={{ fontSize: 12 }}>Nenhum link adicionado.</p>
          )}

          {user.links && user.links.map((l, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <input value={l.label} disabled style={{ width: "40%", marginRight: 10 }} />
              <input value={l.url} disabled style={{ width: "55%" }} />
            </div>
          ))}
        </div>

        <div className="profile-field">
          <label>Usuário desde</label>
          <input
            value={user.createdAt?.toDate().toLocaleString() || ""}
            disabled
          />
        </div>

      </div>
    </div>
  );
}
