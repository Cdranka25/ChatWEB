import React, { useState, useEffect } from "react";
import { auth, db } from "../../../../js/Firebase/FirebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateNotificationSettings } from "../../../../js/Chat_js/Notifications_js/NotificationManager.js";


export default function NotificationsPanel() {
  const user = auth.currentUser;

  const [all, setAll] = useState(true);
  const [groups, setGroups] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [silence, setSilence] = useState("1h");

  // 🔵 Carregar configurações do Firestore
  useEffect(() => {
    async function load() {
      if (!user) return;

      const ref = doc(db, "userSettings", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const s = snap.data();
        setAll(s.all ?? true);
        setGroups(s.groups ?? true);
        setDnd(s.dnd ?? false);
        setSilence(s.silence ?? "1h");
      }
    }
    load();
  }, [user]);

  // 🔵 Salvar sempre que qualquer configuração mudar
  useEffect(() => {
    async function save() {
      if (!user) return;

      const ref = doc(db, "userSettings", user.uid);

      await setDoc(
        ref,
        {
          all,
          groups,
          dnd,
          silence,
          updatedAt: new Date()
        },
        { merge: true }
      );
    }

    save();
  }, [all, groups, dnd, silence, user]);

  useEffect(() => {
    updateNotificationSettings({
      all,
      groups,
      dnd,
      silenceUntil: silence === "forever"
        ? Date.now() + 9999999999
        : Date.now() + (silence === "1h" ? 3600000 :
          silence === "8h" ? 8 * 3600000 :
            silence === "24h" ? 24 * 3600000 : 0)
    });
  }, [all, groups, dnd, silence]);

  return (
    <div className="settings-panel">
      <h3 className="settings-title-side">Notificações</h3>

      <div className="setting-row">
        <label>Ativar todas notificações</label>
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
      </div>

      <div className="setting-row">
        <label>Notificações de grupos</label>
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
