
import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { db } from "../../../js/Firebase/FirebaseConfig.js";

import { notify } from "../../../js/Chat_js/Notifications_js/NotificationManager.js";


import useSearchUsers from "../../../js/Search/UseSearchUsers.js";

import ChatMessage from "../Message/ChatMessage.jsx";
import MessageInput from "../Message/MessageInput.jsx";
import { makeRoomId } from "../../../js/Chat_js/PrivateChat.helpers.js";
import { uploadFileForMessage, extractFileFromPaste, permissiveFileTypeCheck } from "../../../js/Chat_js/PrivateChat.media.js";

import Avatar from "../../Profile/Avatar.jsx";
import ProfileView from "../../Profile/ProfileView.jsx";

export default function PrivateChat({ currentUser, otherUser, onClose }) {
  const roomId = makeRoomId(currentUser.uid, otherUser.id);
  const { allUsers } = useSearchUsers();
  const initialSnapshotProcessed = useRef(false);

  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const [abertoPara, setAbertoPara] = useState(null); // id da mensagem com menu aberto

  const listRef = useRef(null);
  const messageInputRef = useRef(null); // ref para o MessageInput

  // --------------- listeners & inicialização ---------------
  useEffect(() => {
    notify?.setChatActive?.(true);  // desliga notificações deste chat
    return () => notify?.setChatActive?.(false); // liga novamente ao fechar
  }, []);

  useEffect(() => {
    initialSnapshotProcessed.current = false;
  }, [roomId]);

  useEffect(() => {
    let unsub;
    const setup = async () => {
      // garante que a room exista
      const roomRef = doc(db, "rooms", roomId);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        await setDoc(roomRef, {
          members: [currentUser.uid, otherUser.id],
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastUpdated: serverTimestamp()
        });
      }

      function scrollToBottom() {
        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 40);
      }

      // listener mensagens
      const q = query(collection(db, `rooms/${roomId}/messages`), orderBy("createdAt", "asc"));
      unsub = onSnapshot(q, async s => {
        const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(arr);

        // === SNAPSHOT INICIAL ===
        if (!initialSnapshotProcessed.current) {
          initialSnapshotProcessed.current = true;

          // 1) marcar RECEIVED
          const toReceiveInitial = s.docs.filter(d =>
            d.data().from !== currentUser.uid &&
            d.data().status === "sent"
          );

          if (toReceiveInitial.length > 0) {
            await Promise.all(
              toReceiveInitial.map(d =>
                updateDoc(d.ref, { status: "received" })
              )
            );
          }

          // 2) marcar SEEN
          await markMessagesAsSeen(arr);
          scrollToBottom();
          return;
        }

        // === SNAPSHOTS SUBSEQUENTES (MENSAGENS NOVAS) ===

        // marcar RECEIVED nas mensagens novas
        const toReceive = s
          .docChanges()
          .filter(change => change.type === "added")
          .map(change => change.doc)
          .filter(d =>
            d.data().from !== currentUser.uid &&
            d.data().status === "sent"
          );

        if (toReceive.length > 0) {
          await Promise.all(
            toReceive.map(d =>
              updateDoc(d.ref, { status: "received" })
            )
          );
        }

        // marcar SEEN nas mensagens novas
        await markMessagesAsSeen(arr);       // primeira tentativa
        scrollToBottom();

        // segunda tentativa obrigatória, pois o snapshot inicial não reflete updates imediatamente
        setTimeout(() => {
          markMessagesAsSeen(arr);
        }, 200);

        return;
      });


    };

    setup();
    return () => { if (unsub) unsub(); };
  }, [roomId, currentUser.uid, otherUser.id]);

  // marca como lido / seen
  async function markMessagesAsSeen(messagesArr) {
    try {
      const updates = [];

      for (let msg of messagesArr) {
        if (msg.from === currentUser.uid) continue;

        const seenBy = msg.seenBy || [];
        if (!seenBy.includes(currentUser.uid)) {
          updates.push(
            updateDoc(
              doc(db, `rooms/${roomId}/messages`, msg.id),
              {
                seenBy: arrayUnion(currentUser.uid),
                status: "seen"
              }
            )
          );
        }
      }

      if (updates.length > 0) await Promise.all(updates);
    } catch (err) {
      console.error("Erro marcar seen:", err);
    }
  }


  // --------------- enviar mensagens (texto / arquivo / gif) ---------------
  // Essa função é usada pelo MessageInput (onSend)
  const handleSend = async ({ text = "", file = null, gifUrl = "" }) => {
    // se estivermos em edição, delegamos para saveEdit (mantemos compatibilidade)
    if (editingMessage) {
      return await saveEditFromComposer({ text, file, gifUrl });
    }

    const hasText = (text || "").trim().length > 0;
    const hasFile = !!file;
    const hasGif = !!gifUrl;

    if (!hasText && !hasFile && !hasGif) return;

    setUploading(true);
    try {
      let url = "";
      let type = "text";

      if (hasGif) {
        url = gifUrl;
        type = "gif";
      } else if (hasFile) {
        // valida arquivo com permissiveFileTypeCheck
        const check = permissiveFileTypeCheck(file, 40);
        if (!check.ok) {
          alert(check.msg);
          setUploading(false);
          return;
        }
        const r = await uploadFileForMessage(file, roomId);
        url = r.publicUrl || "";
        const lower = (file.type || "").toLowerCase();
        if (lower.startsWith("image/")) type = "image";
        else if (lower.startsWith("video/")) type = "video";
        else if (lower.startsWith("audio/")) type = "audio";
        else type = "file";
      }

      const payload = {
        text: (text || "").trim(),
        url,
        type,
        from: currentUser.uid,
        createdAt: serverTimestamp(),
        status: "sent",
        seenBy: []
      };

      await addDoc(collection(db, `rooms/${roomId}/messages`), payload);

      // atualiza metadata da sala
      await updateDoc(doc(db, "rooms", roomId), {
        lastMessage: payload.text || (type === "image" ? "[imagem]" : (type === "video" ? "[vídeo]" : (type === "gif" ? "[gif]" : "[arquivo]"))),
        lastUpdated: serverTimestamp()
      });

      // limpa composer
      try {
        if (messageInputRef.current?.clear) messageInputRef.current.clear();
        if (messageInputRef.current?.focus) messageInputRef.current.focus();
      } catch { /* noop */ }

      // scroll handled by listener
    } catch (err) {
      console.error("Erro enviar:", err);
      alert("Erro ao enviar: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  // suporte a envio de GIFs (caso queira chamar diretamente)
  const handleSendGif = async (gifUrlToSend) => {
    if (!gifUrlToSend) return;
    return handleSend({ text: "", file: null, gifUrl: gifUrlToSend });
  };

  // --------------- edição de mensagem ---------------
  const startEditing = (msg) => {
    const created = msg.createdAt?.toDate ? msg.createdAt.toDate().getTime() : (msg.createdAt ? new Date(msg.createdAt).getTime() : 0);
    if (Date.now() - created > 15 * 60 * 1000) return alert("Só é possível editar mensagens até 15 minutos após o envio.");
    setEditingMessage(msg);

    // preenche composer com o texto existente (se houver)
    try {
      if (messageInputRef.current?.clear) messageInputRef.current.clear();
      const initial = msg.text || "";
      if (initial && messageInputRef.current?.insertAtCursor) messageInputRef.current.insertAtCursor(initial);
      if (messageInputRef.current?.focus) messageInputRef.current.focus();
    } catch (e) { /* ignore */ }
  };

  const saveEdit = async () => {
    if (!editingMessage) return;
    try {
      // pegar texto atual do composer
      const newText = (messageInputRef.current?.getText?.() || "").trim();
      await updateDoc(doc(db, `rooms/${roomId}/messages`, editingMessage.id), {
        text: newText,
        edited: true,
        editedAt: serverTimestamp()
      });
      await updateDoc(doc(db, "rooms", roomId), { lastMessage: newText || "", lastUpdated: serverTimestamp() });

      setEditingMessage(null);
      // limpa composer
      try { if (messageInputRef.current?.clear) messageInputRef.current.clear(); } catch { }
    } catch (err) {
      console.error("Erro salvar edit:", err);
      alert("Erro ao editar: " + (err.message || err));
    }
  };

  // caso MessageInput envie (onSend) durante edição, tratamos assim:
  const saveEditFromComposer = async ({ text = "", file = null, gifUrl = "" }) => {
    if (!editingMessage) return;
    // não permitimos anexos/gif na edição — apenas texto (consistente com seu fluxo anterior)
    const newText = (text || "").trim();
    try {
      await updateDoc(doc(db, `rooms/${roomId}/messages`, editingMessage.id), {
        text: newText,
        edited: true,
        editedAt: serverTimestamp()
      });
      await updateDoc(doc(db, "rooms", roomId), { lastMessage: newText || "", lastUpdated: serverTimestamp() });
      setEditingMessage(null);
      try { if (messageInputRef.current?.clear) messageInputRef.current.clear(); } catch { }
    } catch (err) {
      console.error("Erro salvar edit (composer):", err);
      alert("Erro ao editar: " + (err.message || err));
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    try { if (messageInputRef.current?.clear) messageInputRef.current.clear(); } catch { }
  };

  // --------------- util helpers ---------------
  const findUserById = (id) => allUsers?.find(u => u.id === id) || { nome: "", email: "", avatarUrl: "" };

  const deleteForMe = async (msg) => {
    try {
      await updateDoc(doc(db, `rooms/${roomId}/messages`, msg.id), { deletedFor: arrayUnion(currentUser.uid) });
    } catch (err) { console.error(err); alert("Erro ao excluir para mim."); }
  };
  const deleteForAll = async (msg) => {
    try {
      const seen = msg.seenBy || [];
      if (seen.length > 0) return alert("Não é possível excluir para todos: mensagem já foi vista.");
      await updateDoc(doc(db, `rooms/${roomId}/messages`, msg.id), {
        deletedForAll: true, text: "", url: "", type: "text", edited: false, deletedAt: serverTimestamp()
      });
    } catch (err) { console.error(err); alert("Erro ao excluir para todos."); }
  };

  // --------------- render ---------------
  if (showProfile) {
    return <ProfileView user={otherUser} onClose={() => setShowProfile(false)} />;
  }

  return (
    <>
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 18 }}>←</button>
          <Avatar user={otherUser} size={44} onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }} />
          <div style={{ cursor: "pointer" }} onClick={() => setShowProfile(true)}>
            <div style={{ fontWeight: 700 }}>{otherUser.nome || otherUser.email}</div>
            <div style={{ fontSize: 12 }}>{otherUser.email}</div>
          </div>
        </div>
      </div>

      <div className="chat-box" ref={listRef} style={{ overflowY: "auto" }}>
        {messages.map((m, i) => {
          if (m.deletedFor?.includes(currentUser.uid)) return null;
          const isMe = m.from === currentUser.uid;
          const sender = findUserById(m.from);
          const prev = i > 0 ? messages[i - 1].createdAt : null;

          return (
            <div key={m.id} style={{ width: "100%" }}>
              <ChatMessage
                mensagem={m}
                previousCreatedAt={prev}
                euSou={isMe}
                remetente={sender}
                idUsuarioAtual={currentUser.uid}
                abertoPara={abertoPara}
                setAbertoPara={setAbertoPara}
                onEditar={startEditing}
                onExcluirParaMim={deleteForMe}
                onExcluirParaTodos={deleteForAll}
                mostrarNomeRemetente={false}
              />
            </div>
          );
        })}
      </div>

      {/* input area */}
      <div className="chat-input" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <MessageInput
          ref={messageInputRef}
          onSend={handleSend}
          disabled={uploading}
          placeholder={editingMessage ? "Editando..." : "Mensagem..."}
          maxSizeMB={40}
        />

        {/* se estiver editando, mostrar botões de salvar/cancelar */}
        {editingMessage && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={cancelEdit}>Cancelar</button>
            <button onClick={saveEdit} style={{ background: "#075E54", color: "#fff", borderRadius: 8, padding: "8px 12px" }}>Salvar</button>
          </div>
        )}
      </div>
    </>
  );
}
