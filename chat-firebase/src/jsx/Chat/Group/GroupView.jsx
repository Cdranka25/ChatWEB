// src/jsx/Chat/Group/GroupView.jsx
import React, { useEffect, useState } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  serverTimestamp
} from "firebase/firestore";
import AddMemberPopup from "./AddMemberPopup";

import Avatar from "../../Profile/Avatar";
import useSearchUsers from "../../../js/Search/UseSearchUsers";
import { uploadAvatar, removeFile } from "../../../js/Supabase/SupabaseUpload";

export default function GroupView({ group, currentUser, onClose }) {

  // 🔥 TODOS OS HOOKS DEVEM VIR ANTES DE QUALQUER RETURN
  const { allUsers } = useSearchUsers();
  const [showAddPopup, setShowAddPopup] = useState(false);

  const [creator, setCreator] = useState(null);
  const [members, setMembers] = useState([]);

  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  // estas variáveis não quebram hooks
  const createdBy = group?.createdBy ?? group?.creator ?? null;
  const isCreator = createdBy === currentUser.uid;
  const groupId = group?.id;
  const memberIds = React.useMemo(() => {
    return (group?.members || []).map(uid =>
      typeof uid === "string" ? uid : uid.id
    );
  }, [group]);

  // 🔥 useEffect SEM CONDIÇÃO
  useEffect(() => {
    if (!group || !allUsers) return;

    setEditingName(group.name || "");
    setEditingDescription(group.description || "");
    setPreviewAvatar(group.avatarUrl || "");
    setNewAvatarFile(null);

    async function load() {
      // criador
      if (createdBy) {
        const snap = await getDoc(doc(db, "users", createdBy));
        setCreator(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      }

      // membros
      const fullMembers = memberIds
        .map(id => allUsers.find(u => u.id === id))
        .filter(Boolean);

      setMembers(fullMembers);
    }

    load();
  }, [group, createdBy, allUsers, memberIds]);


  // HANDLERS (nunca condicionais)
  const handleSelectAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNewAvatarFile(f);
    setPreviewAvatar(URL.createObjectURL(f));
  };

  const saveGroup = async () => {
    if (!isCreator) return alert("Apenas o criador pode editar.");
    setSaving(true);

    try {
      let avatarUrl = group.avatarUrl || "";

      if (newAvatarFile) {
        if (group.avatarUrl) {
          try {
            const path = group.avatarUrl.split("/object/public/ChatWEB/")[1];
            if (path) await removeFile(path);
          } catch { }
        }

        const uploaded = await uploadAvatar(newAvatarFile, `group_${groupId}`);
        avatarUrl = uploaded.publicUrl;
      }

      await updateDoc(doc(db, "groups", groupId), {
        name: editingName,
        description: editingDescription,
        avatarUrl,
        updatedAt: serverTimestamp()
      });

      alert("Grupo atualizado!");
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    }

    setSaving(false);
  };

  const removeUser = async (uid) => {
    if (!isCreator) return;
    if (uid === currentUser.uid) return alert("Use 'Sair do grupo'.");

    if (!window.confirm("Remover usuário?")) return;

    await updateDoc(doc(db, "groups", groupId), {
      members: arrayRemove(uid),
      updatedAt: serverTimestamp()
    });

    setMembers(m => m.filter(x => x.id !== uid));
  };

  const addUser = async () => {
    if (!isCreator) return;

    const email = prompt("Email do usuário:");
    if (!email) return;

    const found = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found) return alert("Usuário não encontrado.");
    if (memberIds.includes(found.id)) return alert("Já está no grupo.");

    await updateDoc(doc(db, "groups", groupId), {
      members: arrayUnion(found.id),
      updatedAt: serverTimestamp()
    });

    setMembers([...members, found]);
  };

  const leaveGroup = async () => {
    if (!window.confirm("Sair do grupo?")) return;

    await updateDoc(doc(db, "groups", groupId), {
      members: arrayRemove(currentUser.uid),
      updatedAt: serverTimestamp()
    });

    alert("Você saiu do grupo.");
    onClose();
  };

  // 🔥 RENDER SEGURO — AGORA SIM PODE USAR RETURN
  if (!group) {
    return (
      <div className="profile-screen">
        <div className="chat-header">
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "white" }}>
            ←
          </button>
          <span style={{ marginLeft: 10 }}>Carregando grupo...</span>
        </div>
      </div>
    );
  }
  const handleSelectUser = async (user) => {
    try {
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(user.id),
        updatedAt: serverTimestamp()
      });

      setMembers(prev => [...prev, user]);
      setShowAddPopup(false);

    } catch (err) {
      alert("Erro ao adicionar: " + err.message);
    }
  };

  // 🔥 RENDER PRINCIPAL
  return (
    <div className="profile-screen">

      <div className="chat-header">
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "white", fontSize: 18 }}>
          ←
        </button>
        <span style={{ marginLeft: 10 }}>Informações do grupo</span>
      </div>

      <div className="profile-container">
        <div className="profile-card">

          {/* Avatar */}
          <div className="profile-avatar-area">
            <Avatar user={{ avatarUrl: previewAvatar }} size={120} />

            {isCreator && (
              <label className="btn btn-small" style={{ marginTop: 8 }}>
                Trocar foto
                <input type="file" accept="image/*" onChange={handleSelectAvatar} style={{ display: "none" }} />
              </label>
            )}

            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>
              {memberIds.length} membros
            </div>
          </div>

          <div className="profile-fields">

            <div className="profile-field">
              <label>Nome do grupo</label>
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                disabled={!isCreator}
              />
            </div>

            <div className="profile-field">
              <label>Descrição</label>
              <textarea
                rows={3}
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                disabled={!isCreator}
              />
            </div>

            <div className="profile-field">
              <label>Criado por</label>
              <input value={creator?.nome || "Desconhecido"} disabled />
            </div>

            <div className="profile-field">
              <label>Data de criação</label>
              <input value={group.createdAt?.toDate().toLocaleString()} disabled />
            </div>

            <div className="profile-field">
              <label>Membros</label>

              {members.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar user={m} size={40} />
                  <input value={m.nome || m.email} disabled style={{ flex: 1 }} />

                  {isCreator && m.id !== currentUser.uid && (
                    <button className="btn ghost btn-small" onClick={() => removeUser(m.id)}>
                      Remover
                    </button>
                  )}
                </div>
              ))}

              {isCreator && (
                <button className="btn" onClick={() => setShowAddPopup(true)}>
                  + Adicionar membro
                </button>
              )}
            </div>
          </div>

          {isCreator && (
            <button className="save-btn" onClick={saveGroup} disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          )}

          <button className="btn" style={{ background: "#b00020", marginTop: 20 }} onClick={leaveGroup}>
            Sair do grupo
          </button>


          {showAddPopup && (
            <AddMemberPopup
              allUsers={allUsers}
              existingMemberIds={memberIds}
              onSelect={handleSelectUser}
              onClose={() => setShowAddPopup(false)}
            />
          )}

        </div>
      </div>
    </div>
  );
}
