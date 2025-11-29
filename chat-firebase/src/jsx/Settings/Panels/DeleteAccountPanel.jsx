import React, { useState } from "react";
import { auth, db } from "../../../js/Firebase/FirebaseConfig";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { removeFile } from "../../../js/Supabase/SupabaseUpload";

export default function DeleteAccountPanel({ currentUser, onAccountDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const step1 = window.confirm("⚠ Tem certeza que quer excluir sua conta?");
    if (!step1) return;

    const step2 = window.prompt("Digite CONFIRMAR para excluir a conta:");
    if (!step2 || step2.toLowerCase() !== "confirmar") {
      alert("Ação cancelada. Sua conta não foi excluída.");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Nenhum usuário autenticado.");

      // Reautenticação
      const password = window.prompt("Por segurança, digite sua senha:");
      if (!password) {
        alert("Exclusão cancelada.");
        setLoading(false);
        return;
      }

      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);

      // Deletar avatar
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        const data = snap.exists() ? snap.data() : null;

        if (data?.avatarUrl) {
          const path = data.avatarUrl.split("/object/public/ChatWEB/")[1];
          if (path) await removeFile(path);
        }
      } catch (e) {
        console.warn("Erro ao remover avatar (não bloqueante):", e);
      }

      // Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // Auth
      await deleteUser(user);

      alert("Conta excluída com sucesso.");

      if (onAccountDeleted) onAccountDeleted();

    } catch (err) {
      console.error(err);
      alert("Erro ao excluir conta: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: "var(--panel-bg, #fff)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        animation: "fadeIn 0.2s ease"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            background: "#ffdddd",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#b00020",
            fontWeight: "bold",
            fontSize: 20
          }}
        >
          !
        </div>

        <h3 style={{ margin: 0, color: "#b00020" }}>Excluir Conta</h3>
      </div>

      <p style={{ marginTop: 12, color: "#661111", fontSize: 14 }}>
        Esta ação é <strong>irreversível</strong>.
        Todos os seus dados, conversas e avatar serão permanentemente apagados.
      </p>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: loading ? "#922" : "#b00020",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "0.2s",
            fontWeight: "bold"
          }}
        >
          {loading ? "Excluindo..." : "Excluir Conta Permanentemente"}
        </button>
      </div>
    </div>
  );
}
