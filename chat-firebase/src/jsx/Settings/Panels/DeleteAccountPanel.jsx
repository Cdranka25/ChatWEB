// src/jsx/Settings/panels/DeleteAccountPanel.jsx

import React from "react";

export default function DeleteAccountPanel() {
  const handleDelete = () => {
    if (!window.confirm("Tem certeza que quer excluir sua conta? A ação é irreversível.")) return;
    // implementar chamada para deletar conta no Auth + remover dados no Firestore/Supabase
    alert("Fluxo de exclusão: implemente integração com Auth + DB.");
  };

  return (
    <div>
      <h4>Excluir Conta</h4>
      <p style={{ color: "#a00" }}>Excluir sua conta removerá seus dados. A ação não pode ser desfeita.</p>
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={handleDelete} style={{ background: "#b00020" }}>Excluir Conta</button>
      </div>
    </div>
  );
}
