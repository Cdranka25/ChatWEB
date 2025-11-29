// src/jsx/Settings/SettingsScreen.jsx
import React, { useState } from "react";
import NotificationsPanel from "./Panels/Notifications/NotificationsPanel.jsx";
import SecurityPanel from "./Panels/SecurityPanel.jsx";
import PersonalizationPanel from "./Panels/PersonalizationPanel.jsx"; // ✅ IMPORTADO
import DeleteAccountPanel from "./Panels/DeleteAccountPanel.jsx";

export default function SettingsScreen({ onBack, currentUser }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="settings-container">

      {/* HEADER */}
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="settings-title">Configurações</span>
      </div>

      {/* MENU PRINCIPAL */}
      {!selected && (
        <div className="settings-list">

          <div className="settings-item" onClick={() => setSelected("notifications")}>
            <span>Notificações</span>
          </div>

          <div className="settings-item" onClick={() => setSelected("security")}>
            <span>Segurança</span>
          </div>

          <div className="settings-item" onClick={() => setSelected("personalization")}>
            <span>Personalização</span>
          </div>

          <div className="settings-item danger" onClick={() => setSelected("delete")}>
            <span>Excluir Conta</span>
          </div>

        </div>
      )}

      {/* PAINÉIS */}
      {selected === "notifications" && (
        <NotificationsPanel currentUser={currentUser} />
      )}

      {selected === "security" && (
        <SecurityPanel currentUser={currentUser} />
      )}

      {selected === "personalization" && (
        <PersonalizationPanel /> // ✅ AGORA O PAINEL REAL APARECE
      )}

      {selected === "delete" && (
        <DeleteAccountPanel currentUser={currentUser} onAccountDeleted={onBack} />
      )}

      {/* BOTÃO VOLTAR */}
      {selected && (
        <div style={{ padding: 16 }}>
          <button className="btn" onClick={() => setSelected(null)}>
            ← Voltar
          </button>
        </div>
      )}
    </div>
  );
}
