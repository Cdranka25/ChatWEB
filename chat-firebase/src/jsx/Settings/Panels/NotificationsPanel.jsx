
//src/jsx/Settings/panels/NotificationsPanel.jsx

import React, { useState } from "react";

export default function NotificationsPanel() {
  const [all, setAll] = useState(true);
  const [groups, setGroups] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [silence, setSilence] = useState("1h");

  return (
    <div>
      <h4>Notificações</h4>

      <div className="setting-row">
        <label>Ativar todas notificações</label>
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
      </div>

      <div className="setting-row">
        <label>Notificações para grupos</label>
        <input type="checkbox" checked={groups} onChange={(e) => setGroups(e.target.checked)} />
      </div>

      <div className="setting-row">
        <label>Não perturbe</label>
        <input type="checkbox" checked={dnd} onChange={(e) => setDnd(e.target.checked)} />
      </div>

      <div className="setting-row">
        <label>Silenciar tudo por</label>
        <select value={silence} onChange={(e) => setSilence(e.target.value)}>
          <option value="1h">1 hora</option>
          <option value="8h">8 horas</option>
          <option value="24h">24 horas</option>
          <option value="forever">Sempre</option>
        </select>
      </div>
    </div>
  );
}
