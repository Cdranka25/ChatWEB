// src/jsx/Chat/Group/GroupChat.jsx
import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc
} from "firebase/firestore";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import Avatar from "../../Profile/Avatar.jsx";
import { uploadMessageMedia } from "../../../js/Supabase/SupabaseUpload.js";
import ChatMessage from "../Message/ChatMessage.jsx";
import MessageInput from "../Message/MessageInput.jsx";

export default function GroupChat({ group, currentUser, onClose, onOpenGroupView }) {

  const { allUsers } = useSearchUsers();

  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const messageInputRef = useRef(null);
  const listRef = useRef(null);
  const [abertoPara, setAbertoPara] = useState(null);

  // Verifica se o usuário é membro
  useEffect(() => {
    const isMember =
      group.members?.includes(currentUser.uid) ||
      group.members?.some?.(m => m.id === currentUser.uid);

    if (!isMember) {
      alert("Você não é membro deste grupo!");
      onClose();
    }
  }, [group, currentUser.uid, onClose]);

  // Listener das mensagens
  useEffect(() => {
    const messagesRef = collection(db, `groups/${group.id}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 50);
    });

    return () => unsub();
  }, [group.id]);

  // Localiza o remetente
  const findUserById = id => {
    if (!allUsers) return null;
    return allUsers.find(u => u.id === id) || null;
  };

  // Enviar mensagem
  const handleSend = async ({ text = "", file = null, gifUrl = "" }) => {
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
        type = "image";
      } else if (hasFile) {
        const uploaded = await uploadMessageMedia(file, `group_${group.id}`);
        url = uploaded || "";
        const t = (file.type || "").toLowerCase();
        if (t.startsWith("image/")) type = "image";
        else if (t.startsWith("video/")) type = "video";
        else if (t.startsWith("audio/")) type = "audio";
        else type = "file";
      }

      await addDoc(collection(db, `groups/${group.id}/messages`), {
        text: (text || "").trim(),
        url,
        type,
        from: currentUser.uid,
        createdAt: serverTimestamp(),
        seenBy: [],
        receivedBy: []
      });

      await updateDoc(doc(db, "groups", group.id), {
        lastMessage: (text && text.trim()) || (type === "image" ? "[imagem]" : "[arquivo]"),
        lastUpdated: serverTimestamp()
      });

      // limpa composer
      try {
        messageInputRef.current?.clear?.();
        messageInputRef.current?.focus?.();
      } catch { /* noop */ }

    } catch (err) {
      console.error(err);
      alert("Erro ao enviar: " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  const groupSize = group?.members?.length || 0;

  return (
    <>
      {/* HEADER */}
      <div className="chat-header">
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          onClick={() => onOpenGroupView(group)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 18 }}
          >
            ←
          </button>

          <Avatar label={group.name} size={44} />

          <div>
            <div style={{ fontWeight: 700 }}>{group.name}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {group.members?.length || 0} membros
            </div>
          </div>
        </div>
      </div>

      {/* MENSAGENS */}
      <div className="chat-box" ref={listRef}>
        {messages.map((m, i) => {
          const isMe = m.from === currentUser.uid;
          const sender = findUserById(m.from);
          const prev = i > 0 ? messages[i - 1].createdAt : null;

          return (
            <div key={m.id} style={{ width: "100%" }}>
              {/* Somente ChatMessage — ChatMessage renderiza o separador quando necessário */}
              <ChatMessage
                mensagem={m}
                previousCreatedAt={prev}
                euSou={isMe}
                remetente={sender}
                idUsuarioAtual={currentUser.uid}
                abertoPara={abertoPara}
                setAbertoPara={setAbertoPara}
                mostrarNomeRemetente={!isMe}
                isGroup={true}
                groupMemberCount={groupSize}
              />
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="chat-input" style={{ padding: 8 }}>
        <MessageInput
          ref={messageInputRef}
          onSend={handleSend}
          disabled={uploading}
          placeholder="Mensagem..."
          maxSizeMB={40}
        />
      </div>
    </>
  );
}
