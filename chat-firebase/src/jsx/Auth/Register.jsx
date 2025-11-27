// src/jsx/Auth/Register.jsx
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  deleteUser
} from "firebase/auth";
import { auth, db } from "../../js/Firebase/FirebaseConfig.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { uploadAvatar, removeFile } from "../../js/Supabase/SupabaseUpload.js";

export default function Register({ setScreen, setRegistering }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const cadastrar = async () => {
    if (!nome.trim()) return alert("Informe seu nome.");
    if (!email.trim()) return alert("Informe seu email.");
    if (senha.length < 6) return alert("Senha deve ter ao menos 6 caracteres.");
    if (senha !== senha2) return alert("Senhas não conferem.");

    setLoading(true);
    setRegistering(true);

    let createdUser = null;
    let avatarPath = "";

    try {

      const userCred = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCred.user;
      createdUser = user;
      const uid = user.uid;

      // UPLOAD DE AVATAR
      let avatarUrl = "";
      if (avatarFile) {
        const res = await uploadAvatar(avatarFile, uid); 
        avatarUrl = res.publicUrl;
        avatarPath = res.path;
      }

      // Atualizar perfil no Auth
      await updateProfile(user, {
        displayName: nome,
        photoURL: avatarUrl
      });

      // Criar documento Firestore
      await setDoc(doc(db, "users", uid), {
        id: uid,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        avatarUrl,
        online: false,
        createdAt: serverTimestamp()
      });

      // Logout imediato
      await signOut(auth);

      alert("Conta criada com sucesso! Faça login.");
      setScreen("login");

    } catch (err) {
      console.error("ERRO NO REGISTER:", err);

      // rollback
      if (createdUser) {
        try {
          if (avatarPath) await removeFile(avatarPath);
          await deleteUser(createdUser);
        } catch (rollbackErr) {
          console.error("Erro rollback:", rollbackErr);
          try { await signOut(auth); } catch (_) {}
        }
      }

      alert("Erro ao criar conta: " + err.message);
      setScreen("login");
    } finally {
      setLoading(false);
      setRegistering(false);
    }
  };


  return (
    <div className="login-container">
      <h2>Criar Conta</h2>

      <input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} />
      <input placeholder="Confirmar senha" type="password" value={senha2} onChange={e => setSenha2(e.target.value)} />

      <div style={{ marginTop: 8 }}>
        <label>Avatar (opcional)</label>
        <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0] || null)} />
      </div>

      <button onClick={cadastrar} disabled={loading}>
        {loading ? "Criando..." : "Cadastrar"}
      </button>

      <p style={{ marginTop: 20, cursor: "pointer" }} onClick={() => setScreen("login")}>
        Voltar ao Login
      </p>
    </div>
  );
}
