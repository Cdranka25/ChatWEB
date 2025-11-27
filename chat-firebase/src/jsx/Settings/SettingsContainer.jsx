//src/jsx/Settings/SettingsContainer.jsx
import React, { useState } from "react";
import SettingsMenuFloating from "./SettingsMenuFloating.jsx";
import NotificationsPanel from "./panels/NotificationsPanel.jsx";
import PersonalizationPanel from "./panels/PersonalizationPanel.jsx";
import SecurityPanel from "./panels/SecurityPanel.jsx";
import DeleteAccountPanel from "./panels/DeleteAccountPanel.jsx";


export default function SettingsContainer({ onCloseSidebar }) {
  const [active, setActive] = useState("notifications"); // notifications | personalization | security | delete

  return (
    <div className="settings-root">
      <SettingsMenuFloating active={active} onChange={setActive} onClose={onCloseSidebar} />

      <div className="settings-header">
        <button className="back-btn" onClick={onCloseSidebar}>← Voltar</button>
        <h3>Configurações</h3>
      </div>

      <div className="settings-body">
        <div className="settings-sidebar">
          <button className={`settings-item ${active === "notifications" ? "active" : ""}`} onClick={() => setActive("notifications")}>Notificações</button>
          <button className={`settings-item ${active === "personalization" ? "active" : ""}`} onClick={() => setActive("personalization")}>Personalização</button>
          <button className={`settings-item ${active === "security" ? "active" : ""}`} onClick={() => setActive("security")}>Segurança</button>
          <button className={`settings-item ${active === "delete" ? "active" : ""}`} onClick={() => setActive("delete")}>Excluir Conta</button>
        </div>

        <div className="settings-panel">
          {active === "notifications" && <NotificationsPanel />}
          {active === "personalization" && <PersonalizationPanel />}
          {active === "security" && <SecurityPanel />}
          {active === "delete" && <DeleteAccountPanel />}
        </div>
      </div>
    </div>
  );
}
