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
      setUser(cred.user);
    } catch (err) {
      alert("Erro no login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Entrar no Chat</h2>

      <input
        className="auth-input"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="auth-input"
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={e => setSenha(e.target.value)}
      />

      <button className="auth-btn" onClick={login} disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p className="auth-link">
        Não tem conta?{" "}
        <span onClick={() => setScreen("register")}>Criar conta</span>
      </p>
    </div>
  );
}
