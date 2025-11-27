// src/jsx/Settings/panels/SecurityPanel.jsx

import React, { useState } from "react";

export default function SecurityPanel() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleChangePassword = () => {
    if (!oldPass || !newPass) return alert("Preencha as senhas.");
    if (newPass !== confirm) return alert("Nova senha e confirmação não batem.");
    // aqui: chamar função de backend / firebase para trocar senha
    alert("Fluxo de alteração de senha disparado (implemente lógica com auth).");
    setOldPass(""); setNewPass(""); setConfirm("");
  };

  return (
    <div>
      <h4>Segurança</h4>

      <div className="profile-field">
        <label>Alterar senha</label>
        <input type="password" placeholder="Senha atual" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
        <input type="password" placeholder="Nova senha" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        <input type="password" placeholder="Confirmar nova senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="btn" onClick={handleChangePassword}>Alterar Senha</button>
      </div>
    </div>
  );
}
