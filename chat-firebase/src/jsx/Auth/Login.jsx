// src/jsx/Auth/Login.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../js/Firebase/FirebaseConfig.js";

export default function Login({ setUser, setScreen }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !senha) return alert("Preencha email e senha.");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const user = cred.user;

      console.log("Login OK:", user.uid);

      setUser(user);

    } catch (err) {
      console.error("Erro no login:", err);
      alert("Erro no login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login no Chat</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        placeholder="Senha"
        type="password"
        value={senha}
        onChange={e => setSenha(e.target.value)}
      />

      <button onClick={login} disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p style={{ marginTop: 20 }}>
        Ainda não tem conta?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={() => setScreen("register")}
        >
          Criar Conta
        </span>
      </p>
    </div>
  );
}
