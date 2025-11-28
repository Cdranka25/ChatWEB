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
  setDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import Avatar from "../../Profile/Avatar.jsx";
import { uploadMessageMedia } from "../../../js/Supabase/SupabaseUpload.js";
import ChatMessage from "../Message/ChatMessage.jsx";
import MessageInput from "../Message/MessageInput.jsx";

/* formata hora (reaproveita sua util) */
function formatTimeLocal(ts) {
  if (!ts) return "";
  if (ts?.toDate) return ts.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

function formatDay(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString();
}

export default function GroupChat({ group, currentUser, onClose }) {
  const { allUsers } = useSearchUsers();

  const [messages, setMessages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const listRef = useRef(null);
  const [abertoPara, setAbertoPara] = useState(null);

  // ref do MessageInput — usado para inserir emoji no cursor, etc.
  const messageInputRef = useRef(null);

  useEffect(() => {
    const isMember =
      group.members?.includes(currentUser.uid) ||
      group.members?.some?.(m => m.id === currentUser.uid);

    if (!isMember) {
      alert("Você não é membro deste grupo!");
      onClose();
      return;
    }
  }, [group, currentUser.uid, onClose]);

  useEffect(() => {
    const messagesRef = collection(db, `groups/${group.id}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 50);
    });

    return () => unsub();
  }, [group.id]);

  const findUserById = id => {
    // group.members pode ser array de ids ou array de objetos { id, nome, ... }
    if (!allUsers) return typeof id === "object" ? id : null;
    const u = allUsers.find(u => u.id === id);
    if (u) return u;
    // fallback: se id for objeto já com dados
    return typeof id === "object" ? id : null;
  };

  // Função centralizada para enviar (texto, file ou gifUrl)
  const handleSend = async ({ text = "", file = null, gifUrl = "" }) => {
    // evita enviar vazio
    const hasText = (text || "").trim().length > 0;
    const hasFile = !!file;
    const hasGif = !!gifUrl;

    if (!hasText && !hasFile && !hasGif) return;

    setUploading(true);
    try {
      let mediaUrl = "";
      let type = "text";

      if (hasGif) {
        mediaUrl = gifUrl;
        type = "image"; // tratamos GIF como image
      } else if (hasFile) {
        // upload via util supabase
        mediaUrl = await uploadMessageMedia(file, `group_${group.id}`);
        const t = (file.type || "").toLowerCase();
        if (t.startsWith("image/")) type = "image";
        else if (t.startsWith("video/")) type = "video";
        else if (t.startsWith("audio/")) type = "audio";
        else type = "file";
      }

      // quando criamos a mensagem no grupo, inclua seenBy: [] e receivedBy: []
      await addDoc(collection(db, `groups/${group.id}/messages`), {
        text: (text || "").trim(),
        type,
        url: mediaUrl || "",
        from: currentUser.uid,
        createdAt: serverTimestamp(),
        // para compatibilidade com ChatMessage esperamos arrays opcionais
        seenBy: [],
        receivedBy: [],
      });

      await setDoc(doc(db, "groups", group.id), {
        lastMessage:
          (text && text.trim()) ||
          (type === "image" ? "[imagem]" : (type === "video" ? "[vídeo]" : "[arquivo]")),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // limpa input via ref (se existir)
      try {
        if (messageInputRef.current?.clear) messageInputRef.current.clear();
        if (messageInputRef.current?.focus) messageInputRef.current.focus();
      } catch { /* noop */ }

    } catch (err) {
      console.error("Erro ao enviar mensagem (group):", err);
      alert("Erro ao enviar: " + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  // calculamos tamanho do grupo para passar para ChatMessage
  const groupSize = Array.isArray(group?.members) ? group.members.length : 0;

  return (
    <>
      {/* HEADER */}
      <div className="chat-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "white", fontSize: 18 }}>←</button>
          <Avatar label={group.name} size={44} />
          <div>
            <div style={{ fontWeight: 700 }}>{group.name}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{group.members?.length || 0} membros</div>
          </div>
        </div>
      </div>

      {/* CHAT */}
      <div className="chat-box" ref={listRef}>
        {messages.map((m, i) => {
          const isMe = m.from === currentUser.uid;
          const sender = findUserById(m.from);
          const showDay =
            i === 0 ||
            (messages[i - 1] && new Date(messages[i - 1].createdAt?.toDate ? messages[i - 1].createdAt.toDate() : messages[i - 1].createdAt).toDateString()
              !== new Date(m.createdAt?.toDate ? m.createdAt.toDate() : m.createdAt).toDateString());

          return (
            <div key={m.id}>
              {showDay && <div style={{ textAlign: "center", margin: "10px 0", fontSize: 12, opacity: 0.7 }}>{formatDay(m.createdAt)}</div>}

              <div style={{ display: "flex", marginBottom: 8, alignItems: "flex-end", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "75%" }}>
                  <ChatMessage
                    mensagem={m}
                    euSou={isMe}
                    remetente={sender}
                    idUsuarioAtual={currentUser.uid}
                    abertoPara={abertoPara}
                    setAbertoPara={setAbertoPara}
                    onEditar={() => { /* editar em grupo — opcional */ }}
                    onExcluirParaMim={async (msg) => {
                      try { await updateDoc(doc(db, `groups/${group.id}/messages`, msg.id), { deletedFor: arrayUnion(currentUser.uid) }); }
                      catch (err) { console.error(err); alert("Erro ao excluir para mim."); }
                    }}
                    onExcluirParaTodos={async (msg) => {
                      try {
                        const seen = msg.seenBy || [];
                        if (seen.length > 0) return alert("Não é possível excluir para todos: mensagem já foi vista.");
                        await updateDoc(doc(db, `groups/${group.id}/messages`, msg.id), {
                          deletedForAll: true, text: "", url: "", type: "text", edited: false, deletedAt: serverTimestamp()
                        });
                      } catch (err) { console.error(err); alert("Erro ao excluir para todos."); }
                    }}
                    mostrarNomeRemetente={!isMe}
                    isGroup={true}
                    groupMemberCount={groupSize}
                  />
                  <div className="hora" style={{ textAlign: isMe ? "right" : "left" }}>{formatTimeLocal(m.createdAt)}</div>
                </div>

                {isMe && <div style={{ width: 36, marginLeft: 8 }} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT -> delega tudo ao MessageInput */}
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
