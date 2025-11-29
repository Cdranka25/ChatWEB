// src/jsx/Settings/SettingsScreen.jsx
import React, { useState } from "react";
import NotificationsPanel from "./Panels/Notifications/NotificationsPanel.jsx";
import SecurityPanel from "./Panels/SecurityPanel.jsx";
import PersonalizationPanel from "./Panels/PersonalizationPanel.jsx"; // ✅ IMPORTADO
import DeleteAccountPanel from "./Panels/DeleteAccountPanel.jsx";

export default function SettingsScreen({ onBack, currentUser }) {
  const [selected, setSelected] = useState(null);

  function handleBack() {
    if (selected) setSelected(null);
    else onBack();
  }

  return (
    <div className="settings-container">

      {/* HEADER ÚNICO */}
      <div className="settings-header">
        <button className="back-btn" onClick={handleBack}>←</button>

        {!selected && <span className="settings-title">Configurações</span>}
        {selected === "notifications" && <span className="settings-title">Notificações</span>}
        {selected === "security" && <span className="settings-title">Segurança</span>}
        {selected === "personalization" && <span className="settings-title">Personalização</span>}
        {selected === "delete" && <span className="settings-title">Excluir Conta</span>}
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
        <PersonalizationPanel currentUser={currentUser} />
      )}

      {selected === "delete" && (
        <DeleteAccountPanel currentUser={currentUser} onAccountDeleted={onBack} />
      )}
    </div>
  );
}