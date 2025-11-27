// src/jsx/Profile.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../../js/Firebase/FirebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  uploadAvatar,
  removeFile
} from "../../js/Supabase/SupabaseUpload";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail
} from "firebase/auth";

import Avatar from "./Avatar.jsx";

export default function Profile({ currentUser, setScreen }) {
  const uid = currentUser.uid;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const statuses = ["online", "offline", "ocupado", "trabalhando", "inativo", "oscioso"];

  // LOAD USER DATA
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setData(snap.data());
      }
      setLoading(false);
    }
    load();
  }, [uid]);

  if (loading || !data) {
    return <div className="chat-header">Carregando perfil...</div>;
  }

  // HANDLE AVATAR SELECT / PREVIEW
  const handleAvatarSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setAvatarFile(f);

    const url = URL.createObjectURL(f);
    setAvatarPreview(url);
  };

  // REMOVE AVATAR
  const handleRemoveAvatar = async () => {
    if (!data.avatarUrl) return;

    if (!window.confirm("Remover avatar atual?")) return;

    setRemovingAvatar(true);

    try {
      // extrair path do avatar
      const path = data.avatarUrl.split("/object/public/ChatWEB/")[1];
      if (path) {
        await removeFile(path);
      }

      await updateDoc(doc(db, "users", uid), {
        avatarUrl: "",
        updatedAt: serverTimestamp()
      });

      setData({ ...data, avatarUrl: "" });
      setAvatarFile(null);
      setAvatarPreview("");

    } catch (err) {
      alert("Erro ao remover avatar: " + err.message);
    }

    setRemovingAvatar(false);
  };

  // SAVE PROFILE
  const saveProfile = async () => {
    setLoading(true);

    let avatarUrl = data.avatarUrl;

    // UPLOAD NEW AVATAR
    if (avatarFile) {
      const uploaded = await uploadAvatar(avatarFile, uid);
      avatarUrl = uploaded.publicUrl;
    }

    const docRef = doc(db, "users", uid);

    await updateDoc(docRef, {
      nome: data.nome || "",
      birthdate: data.birthdate || "",
      company: data.company || "",
      about: data.about || "",
      status: data.status || "",
      phone: data.phone || "",
      links: data.links || [],
      avatarUrl,
      updatedAt: serverTimestamp()
    });

    alert("Perfil salvo!");
    setScreen("private");
  };

  // SAVE EMAIL (WITH PASSWORD)
  const updateUserEmail = async () => {
    try {
      const cred = EmailAuthProvider.credential(
        currentUser.email,
        emailPassword
      );

      await reauthenticateWithCredential(currentUser, cred);

      await updateEmail(currentUser, newEmail);

      await updateDoc(doc(db, "users", uid), {
        email: newEmail.toLowerCase(),
        updatedAt: serverTimestamp()
      });

      alert("Email atualizado!");
      setEmailModal(false);

    } catch (err) {
      alert("Erro ao alterar email: " + err.message);
    }
  };

  // LINK MANAGEMENT
  const addLink = () => {
    const updated = data.links ? [...data.links] : [];
    updated.push({ label: "", url: "" });
    setData({ ...data, links: updated });
  };

  const updateLink = (i, field, value) => {
    const updated = [...data.links];
    updated[i][field] = value;
    setData({ ...data, links: updated });
  };

  const removeLink = (i) => {
    const updated = [...data.links];
    updated.splice(i, 1);
    setData({ ...data, links: updated });
  };

  return (
    <div className="profile-screen">

      {/* HEADER */}
      <div className="chat-header">
        <button
          onClick={() => setScreen("private")}
          style={{ background: "transparent", border: "none", color: "white", fontSize: 18 }}
        >
          ←
        </button>
        <span style={{ marginLeft: 10 }}>Meu Perfil</span>
      </div>

      {/* BODY */}
      <div className="profile-container">

        {/* AVATAR */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Avatar
            user={{ avatarUrl: avatarPreview || data.avatarUrl }}
            size={120}
          />

          <div style={{ marginTop: 10 }}>
            <label className="btn">
              Trocar Avatar
              <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: "none" }} />
            </label>

            {data.avatarUrl && (
              <button onClick={handleRemoveAvatar} disabled={removingAvatar} style={{ marginLeft: 10 }}>
                Remover
              </button>
            )}
          </div>
        </div>

        {/* CAMPOS DO PERFIL */}
        <div className="profile-field">
          <label>Nome</label>
          <input
            value={data.nome || ""}
            onChange={(e) => setData({ ...data, nome: e.target.value })}
          />
        </div>

        <div className="profile-field">
          <label>Data de nascimento</label>
          <input
            type="date"
            value={data.birthdate || ""}
            onChange={(e) => setData({ ...data, birthdate: e.target.value })}
          />
        </div>

        <div className="profile-field">
          <label>Empresa</label>
          <input
            value={data.company || ""}
            onChange={(e) => setData({ ...data, company: e.target.value })}
          />
        </div>

        <div className="profile-field">
          <label>Sobre</label>
          <textarea
            rows={3}
            value={data.about || ""}
            onChange={(e) => setData({ ...data, about: e.target.value })}
          ></textarea>
        </div>

        <div className="profile-field">
          <label>Status</label>
          <select
            value={data.status || ""}
            onChange={(e) => setData({ ...data, status: e.target.value })}
          >
            <option value="">Selecione...</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="profile-field">
          <label>Email</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={data.email || ""} disabled />
            <button onClick={() => {
              setNewEmail(data.email);
              setEmailModal(true);
            }}>
              Alterar
            </button>
          </div>
        </div>

        <div className="profile-field">
          <label>Telefone</label>
          <input
            value={data.phone || ""}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
          />
        </div>

        {/* LINKS */}
        <div className="profile-field">
          <label>Links</label>

          {(!data.links || data.links.length === 0) && (
            <p style={{ fontSize: 12 }}>Nenhum link adicionado.</p>
          )}

          {data.links && data.links.map((l, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <input
                placeholder="Nome (ex: Instagram)"
                value={l.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                style={{ width: "40%", marginRight: 10 }}
              />
              <input
                placeholder="URL"
                value={l.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                style={{ width: "40%", marginRight: 10 }}
              />
              <button onClick={() => removeLink(i)}>X</button>
            </div>
          ))}

          <button onClick={addLink}>+ Adicionar Link</button>
        </div>

        <div className="profile-field">
          <label>Usuário desde</label>
          <input value={data.createdAt?.toDate().toLocaleString() || ""} disabled />
        </div>

        {/* BOTÃO SALVAR */}
        <button className="save-btn" onClick={saveProfile}>
          Salvar
        </button>
      </div>

      {/* MODAL EMAIL */}
      {emailModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Alterar Email</h3>
            <input
              placeholder="Novo email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              placeholder="Senha atual"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />

            <button onClick={updateUserEmail}>Confirmar</button>
            <button onClick={() => setEmailModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
