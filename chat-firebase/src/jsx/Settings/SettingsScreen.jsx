// src/jsx/Chat/Settings/SettingsScreen.jsx
import React from "react";

export default function SettingsScreen({ onBack }) {
  return (
    <div className="settings-container">

      {/* HEADER */}
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="settings-title">Configurações</span>
      </div>

      {/* LISTA */}
      <div className="settings-list">

        <div className="settings-item">
          <span>Notificações</span>
        </div>

        <div className="settings-item">
          <span>Segurança</span>
        </div>

        <div className="settings-item">
          <span>Personalização</span>
        </div>

        <div className="settings-item danger">
          <span>Excluir Conta</span>
        </div>

      </div>
    </div>
  );
}
