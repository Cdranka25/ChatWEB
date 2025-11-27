// src/jsx/PrivateChat.jsx
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
  where,
  getDocs,
  arrayUnion
} from "firebase/firestore";
import Avatar from "../../Profile/Avatar.jsx";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import { uploadFileForMessage, extractFileFromPaste, permissiveFileTypeCheck } from "../../../js/Chat/PrivateChat.media.js";
import { makeRoomId, formatTime, getMessageUrl, linkifyText } from "../../../js/Chat/PrivateChat.helpers.js";
import { MessageBubble } from "./PrivateChat.MessageComponents.jsx";
import { db } from "../../../js/Firebase/FirebaseConfig.js";

import MessageInput from "../Message/MessageInput.jsx";
import EmojiInput from "../Emoji/EmojiInput.jsx";

import ProfileView from "../../Profile/ProfileView.jsx";
import GifSearchModal from "../Gif/GifSearchModal.jsx"



export default function PrivateChat({ currentUser, otherUser, onClose }) {

  const roomId = makeRoomId(currentUser.uid, otherUser.id);
  const { allUsers } = useSearchUsers();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  const [showGifSearch, setShowGifSearch] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [emojiPosition, setEmojiPosition] = useState({});

  const listRef = useRef(null);
  const inputWrapperRef = useRef(null);



  // ---------- CHAT LISTENER ----------
  useEffect(() => {
    let unsub;
    const setup = async () => {
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

      const q = query(collection(db, `rooms/${roomId}/messages`), orderBy("createdAt", "asc"));
      unsub = onSnapshot(q, async s => {
        const arr = s.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(arr);

        const updates = [];
        for (let d of s.docs) {
          const data = d.data();
          if (!data) continue;
          if (data.from !== currentUser.uid && data.status === "sent") {
            updates.push(updateDoc(d.ref, { status: "received" }));
          }
        }
        if (updates.length) {
          try { await Promise.all(updates); } catch (e) { /* ignore */ }
        }

        setTimeout(() => {
          if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
        }, 40);
      });

      await markMessagesAsSeen();
    };

    setup();
    return () => { if (unsub) unsub(); };
  }, [roomId, currentUser.uid, otherUser.id]);

  async function markMessagesAsSeen() {
    try {
      const messagesRef = collection(db, `rooms/${roomId}/messages`);
      const q = query(messagesRef, where("from", "!=", currentUser.uid));
      const snap = await getDocs(q);
      const updates = [];
      for (let d of snap.docs) {
        const data = d.data();
        if (!data) continue;
        const seenBy = data.seenBy || [];
        if (!seenBy.includes(currentUser.uid)) {
          updates.push(updateDoc(d.ref, { seenBy: arrayUnion(currentUser.uid), status: "seen" }));
        }
      }
      if (updates.length) await Promise.all(updates);
    } catch (err) {
      console.error("Erro marcar seen:", err);
    }
  }

  // ---------- SEND (texto + arquivo juntos) ----------
  const send = async () => {
    const messageText = editingMessage ? editText.trim() : text.trim();
    if (!messageText && !file) return;
    setUploading(true);

    try {
      const textToSend = messageText || "";
      let url = "";
      let type = "text";

      if (file) {
        const check = permissiveFileTypeCheck(file, 40);
        if (!check.ok) { alert(check.msg); setUploading(false); return; }
        const r = await uploadFileForMessage(file, roomId);
        url = r.publicUrl || "";
        const lower = (file.type || "").toLowerCase();
        if (lower.startsWith("image/")) type = "image";
        else if (lower.startsWith("video/")) type = "video";
        else if (lower.startsWith("audio/")) type = "audio";
        else type = "file";
      }

      await addDoc(collection(db, `rooms/${roomId}/messages`), {
        text: textToSend,
        url,
        type,
        from: currentUser.uid,
        createdAt: serverTimestamp(),
        status: "sent",
        seenBy: []
      });

      await updateDoc(doc(db, "rooms", roomId), {
        lastMessage: textToSend || (type === "image" ? "[imagem]" : (type === "video" ? "[vídeo]" : "[arquivo]")),
        lastUpdated: serverTimestamp()
      });

      setText("");
      setEditText("");
      setEditingMessage(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(""); }
      setFile(null);
    } catch (err) {
      console.error("Erro enviar:", err);
      alert("Erro ao enviar: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const sendGif = async (gifUrlToSend) => {
    if (!gifUrlToSend) return;
    try {
      await addDoc(collection(db, `rooms/${roomId}/messages`), {
        text: "",
        url: gifUrlToSend,
        type: "gif",
        from: currentUser.uid,
        createdAt: serverTimestamp(),
        status: "sent",
        seenBy: []
      });
      await updateDoc(doc(db, "rooms", roomId), { lastMessage: "[gif]", lastUpdated: serverTimestamp() });
    } catch (err) {
      console.error("Erro enviar gif:", err);
      alert("Erro ao enviar GIF: " + (err.message || err));
    }
  };

  // ---------- SELECIONAR ARQUIVO (clicar) ----------
  const onSelectFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const maxMB = 40;
    if (f.size > maxMB * 1024 * 1024) return alert(`Arquivo muito grande (máx ${maxMB}MB).`);
    setFile(f);
    try { setPreviewUrl(URL.createObjectURL(f)); } catch (err) { setPreviewUrl(""); }
  };

  // ---------- DRAG & DROP (na chat-box ou input) ----------
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const check = permissiveFileTypeCheck(f, 40);
    if (!check.ok) { alert(check.msg); return; }
    setFile(f);
    try { setPreviewUrl(URL.createObjectURL(f)); } catch { setPreviewUrl(""); }
  };

  useEffect(() => {
    const box = listRef.current;
    if (!box) return;
    box.addEventListener("dragover", onDragOver);
    box.addEventListener("drop", onDrop);
    return () => {
      box.removeEventListener("dragover", onDragOver);
      box.removeEventListener("drop", onDrop);
    };
  }, []);

  // ---------- PASTE (Ctrl+V) in input wrapper ----------
  useEffect(() => {
    const el = inputWrapperRef.current;
    if (!el) return;

    function onPaste(e) {
      const fileFromPaste = extractFileFromPaste(e.clipboardData);
      if (fileFromPaste) {
        const check = permissiveFileTypeCheck(fileFromPaste, 40);
        if (!check.ok) { alert(check.msg); return; }
        setFile(fileFromPaste);
        try { setPreviewUrl(URL.createObjectURL(fileFromPaste)); } catch { setPreviewUrl(""); }
        e.preventDefault();
      }
    }

    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, []);

  // ---------- EDITING ----------
  const startEditing = (msg) => {
    const created = msg.createdAt?.toDate ? msg.createdAt.toDate().getTime() : (msg.createdAt ? new Date(msg.createdAt).getTime() : 0);
    if (Date.now() - created > 5 * 60 * 1000) return alert("Só pode editar mensagens até 5 minutos.");
    setEditingMessage(msg);
    setEditText(msg.text || "");
    setText(msg.text || "");
  };

  const saveEdit = async () => {
    if (!editingMessage) return;
    try {
      await updateDoc(doc(db, `rooms/${roomId}/messages`, editingMessage.id), {
        text: editText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      });
      await updateDoc(doc(db, "rooms", roomId), { lastMessage: editText.trim() || "", lastUpdated: serverTimestamp() });
      setEditingMessage(null);
      setEditText("");
      setText("");
    } catch (err) {
      console.error("Erro salvar edit:", err);
      alert("Erro ao editar: " + (err.message || err));
    }
  };

  const cancelEdit = () => { setEditingMessage(null); setEditText(""); setText(""); };

  // ---------- DELETE ----------
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

  // ---------- RENDER helpers ----------
  const renderStatus = (m) => {
    if (m.from !== currentUser.uid) return null;
    if (m.deletedForAll) return null;
    const st = m.status || "sent";
    if (st === "sent") return <span style={{ marginLeft: 6 }}>✓</span>;
    if (st === "received") return <span style={{ marginLeft: 6 }}>✓✓</span>;
    if (st === "seen") return <span style={{ marginLeft: 6, color: "#19a1ff" }}>✓✓</span>;
    return null;
  };

  const findUserById = (id) => allUsers?.find(u => u.id === id) || { nome: "", email: "", avatarUrl: "" };

  // ---------- EMOJI PICKER ----------
  const messageInputRef = useRef(null);

  const onEmojiReceived = (emoji) => {
    if (editingMessage) {
      setEditText(prev => (prev || "") + emoji);
    } else {
      setText(prev => (prev || "") + emoji);
    }

    // insere visualmente no campo
    if (messageInputRef.current) {
      messageInputRef.current.insertAtCursor(emoji);
      messageInputRef.current.focus();
    }
  };

  const handleEnter = () => {
    if (editingMessage) saveEdit();
    else send();
  };


  // --- RENDERIZA PERFIL DO OUTRO USUÁRIO AO CLICAR ---
  if (showProfile) {
    return (
      <ProfileView
        user={otherUser}
        onClose={() => setShowProfile(false)}
      />
    );
  }


  // ---------- JSX ----------
  return (
    <>
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 18 }}>←</button>
          <Avatar
            user={otherUser}
            size={44}
            onclick={() => setShowProfile(true)}
            style={{ cursor: "pointer" }}
          />

          <div style={{ cursor: "pointer" }} onClick={() => setShowProfile(true)}>
            <div style={{ fontWeight: 700 }}>{otherUser.nome || otherUser.email}</div>
            <div style={{ fontSize: 12 }}>{otherUser.email}</div>
          </div>

        </div>
      </div>

      <div className="chat-box" ref={listRef} style={{ overflowY: "auto" }} onDrop={onDrop} onDragOver={onDragOver}>
        {messages.map(m => {
          if (m.deletedFor?.includes(currentUser.uid)) return null;
          const isMe = m.from === currentUser.uid;
          const sender = findUserById(m.from);
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10, position: "relative" }}>
              {/* message bubble */}
              <MessageBubble
                m={m}
                isMe={isMe}
                sender={sender}
                currentUserId={currentUser.uid}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onEdit={startEditing}
                onDeleteForMe={deleteForMe}
                onDeleteForAll={deleteForAll}
              />
            </div>
          );
        })}
      </div>

      {/* input area */}
      <div className="chat-input" style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {previewUrl && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {file && file.type.startsWith("image/") && (
              <img src={previewUrl} alt="prev" style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 8 }} />
            )}
            {file && file.type.startsWith("video/") && <video src={previewUrl} style={{ width: 180 }} controls />}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{file?.name}</div>
              <button onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(""); setFile(null); }}>Remover</button>
            </div>
          </div>
        )}

        <div ref={inputWrapperRef} style={{ display: "flex", gap: 8, alignItems: "center", position: "relative" }}>

          <EmojiInput onEmoji={onEmojiReceived} />

          <MessageInput
            ref={messageInputRef}
            value={editingMessage ? editText : text}
            onChange={(val) => editingMessage ? setEditText(val) : setText(val)}
            onEnter={handleEnter}
            placeholder={editingMessage ? "Editando..." : "Mensagem..."}
          />

          <label style={{ cursor: "pointer" }}>
            📎
            <input type="file" style={{ display: "none" }} accept="image/*,video/*,audio/*,*/*" onChange={onSelectFile} />
          </label>

          <button onClick={() => setShowGifSearch(true)} style={{ padding: 8, borderRadius: 8 }}>
            GIF
          </button>

          {editingMessage ? (
            <>
              <button onClick={cancelEdit}>Cancelar</button>
              <button onClick={saveEdit} style={{ background: "#075E54", color: "#fff", borderRadius: 8 }}>
                Salvar
              </button>
            </>
          ) : (
            <button
              onClick={send}
              disabled={uploading}
              style={{ background: "#075E54", color: "#fff", borderRadius: 20, padding: "8px 12px" }}
            >
              {uploading ? "Enviando..." : "Enviar"}
            </button>
          )}
        </div>
      </div>

      {showGifSearch && (
        <GifSearchModal
          onClose={() => setShowGifSearch(false)}
          onPickGif={(url) => sendGif(url)}
        />
      )}
    </>
  );
}
