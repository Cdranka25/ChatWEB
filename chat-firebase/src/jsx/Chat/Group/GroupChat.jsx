// src/jsx/Chat/Group/GroupChat.jsx
import { useEffect, useState, useRef } from "react";
import { db } from "../../../js/Firebase/FirebaseConfig.js";
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, setDoc, getDoc} from "firebase/firestore";
import useSearchUsers from "../../../js/Search/UseSearchUsers.js";
import Avatar from "../../Profile/Avatar.jsx";
import { uploadMessageMedia } from "../../../js/Supabase/SupabaseUpload.js";

// Format hour
function formatTime(ts) {
    if (!ts) return "";
    if (ts?.toDate)
        return ts.toDate().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    try {
        return new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "";
    }
}

// Format day separator
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
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const listRef = useRef(null);

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
                if (listRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }
            }, 50);
        });

        return () => unsub();
    }, [group.id]);

    // SELECT FILE
    const onSelectFile = e => {
        const f = e.target.files[0];
        if (!f) return;

        if (f.size > 40 * 1024 * 1024) {
            alert("Arquivo muito grande (máx. 40MB).");
            return;
        }

        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
    };

    // SEND MESSAGE
    const send = async () => {
        if (!text.trim() && !file) return;

        setUploading(true);

        try {
            let media = "";
            let type = "text";

            if (file) {
                media = await uploadMessageMedia(file, `group_${group.id}`);
                const t = file.type.toLowerCase();

                if (t.startsWith("image/")) type = "image";
                else if (t.startsWith("video/")) type = "video";
                else type = "file";
            }

            await addDoc(collection(db, `groups/${group.id}/messages`), {
                text: text?.trim() || "",
                type,
                url: media || "",
                from: currentUser.uid,
                createdAt: serverTimestamp()
            });

            await setDoc(
                doc(db, "groups", group.id),
                {
                    lastMessage:
                        text?.trim() ||
                        (type === "image"
                            ? "[imagem]"
                            : type === "video"
                                ? "[vídeo]"
                                : "[arquivo]"),
                    lastUpdated: serverTimestamp()
                },
                { merge: true }
            );

            setText("");
            setFile(null);

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl("");
            }
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
            alert("Erro ao enviar: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const findUserById = id => allUsers.find(u => u.id === id);

    // RENDER
    return (
        <>
            {/* HEADER */}
            <div className="chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            fontSize: 18
                        }}
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

            {/* CHAT */}
            <div className="chat-box" ref={listRef}>
                {messages.map((m, i) => {
                    const isMe = m.from === currentUser.uid;
                    const sender = findUserById(m.from);
                    const showDay =
                        i === 0 ||
                        formatDay(messages[i - 1].createdAt) !==
                        formatDay(m.createdAt);

                    return (
                        <div key={m.id}>
                            {showDay && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        margin: "10px 0",
                                        fontSize: 12,
                                        opacity: 0.7
                                    }}
                                >
                                    {formatDay(m.createdAt)}
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    marginBottom: 8,
                                    alignItems: "flex-end",
                                    justifyContent: isMe
                                        ? "flex-end"
                                        : "flex-start"
                                }}
                            >
                                {!isMe && (
                                    <div style={{ marginRight: 8 }}>
                                        <Avatar user={sender} size={36} />
                                    </div>
                                )}

                                <div style={{ maxWidth: "75%" }}>
                                    <div className={`msg ${isMe ? "me" : "other"}`}>
                                        {!isMe && (
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    marginBottom: 6
                                                }}
                                            >
                                                {sender?.nome || sender?.email}
                                            </div>
                                        )}

                                        {m.type === "image" ? (
                                            <img
                                                src={m.url}
                                                alt="img"
                                                style={{
                                                    maxWidth: "100%",
                                                    borderRadius: 8
                                                }}
                                            />
                                        ) : m.type === "video" ? (
                                            <video
                                                src={m.url}
                                                controls
                                                style={{
                                                    maxWidth: "100%",
                                                    borderRadius: 8
                                                }}
                                            />
                                        ) : (
                                            <div style={{ whiteSpace: "pre-wrap" }}>
                                                {m.text}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="hora"
                                        style={{
                                            textAlign: isMe ? "right" : "left"
                                        }}
                                    >
                                        {formatTime(m.createdAt)}
                                    </div>
                                </div>

                                {isMe && (
                                    <div style={{ width: 36, marginLeft: 8 }} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* INPUT */}
            <div
                className="chat-input"
                style={{ flexDirection: "column", gap: 8 }}
            >
                {/* PREVIEW */}
                {previewUrl && (
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center"
                        }}
                    >
                        {file?.type.startsWith("image/") && (
                            <img
                                src={previewUrl}
                                style={{
                                    width: 120,
                                    height: 80,
                                    borderRadius: 8,
                                    objectFit: "cover"
                                }}
                                alt="preview"
                            />
                        )}

                        {file?.type.startsWith("video/") && (
                            <video
                                src={previewUrl}
                                style={{ width: 160, height: 100, borderRadius: 8 }}
                                controls
                            />
                        )}

                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>
                                {file.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setFile(null);
                                URL.revokeObjectURL(previewUrl);
                                setPreviewUrl("");
                            }}
                            style={{ marginLeft: "auto" }}
                        >
                            Remover
                        </button>
                    </div>
                )}

                {/* INPUT AREA */}
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        gap: 8
                    }}
                >
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Mensagem..."
                        style={{
                            flex: 1,
                            padding: 12,
                            borderRadius: 25,
                            border: "1px solid #ccc"
                        }}
                    />

                    <label
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            background: "#fff",
                            padding: "8px 12px",
                            borderRadius: 20,
                            border: "1px solid #ccc"
                        }}
                    >
                        📎
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={onSelectFile}
                            style={{ display: "none" }}
                        />
                    </label>

                    <button
                        onClick={send}
                        disabled={uploading}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 25,
                            border: "none",
                            background: "#075E54",
                            color: "white",
                            cursor: "pointer"
                        }}
                    >
                        {uploading ? "Enviando..." : "Enviar"}
                    </button>
                </div>
            </div>
        </>
    );
}
