import React, { useState } from "react";
import { auth } from "../../../js/Firebase/FirebaseConfig";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from "firebase/auth";

export default function SecurityPanel({ onBack }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPass || !newPass || !confirm)
      return alert("Preencha todos os campos.");

    if (newPass !== confirm)
      return alert("As novas senhas não conferem.");

    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) throw new Error("Nenhum usuário logado.");

      // 🔐 Reautenticação
      const cred = EmailAuthProvider.credential(user.email, oldPass);
      await reauthenticateWithCredential(user, cred);

      // 🔁 Atualizar senha
      await updatePassword(user, newPass);

      alert("Senha alterada com sucesso!");
      setOldPass("");
      setNewPass("");
      setConfirm("");

    } catch (err) {
      alert("Erro ao alterar senha: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-panel">

      <h3 className="settings-title-side">Segurança</h3>

      <div className="settings-field">
        <label>Senha atual</label>
        <input
          type="password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
        />
      </div>

      <div className="settings-field">
        <label>Nova senha</label>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />
      </div>

      <div className="settings-field">
        <label>Confirmar nova senha</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <button
        className="btn"
        onClick={handleChangePassword}
        disabled={loading}
        style={{ marginTop: "16px" }}
      >
        {loading ? "Salvando..." : "Alterar Senha"}
      </button>

      <button 
        className="btn ghost" 
        onClick={onBack}
        style={{ marginTop: 12 }}
      >
        ← Voltar
      </button>
    </div>
  );
}
