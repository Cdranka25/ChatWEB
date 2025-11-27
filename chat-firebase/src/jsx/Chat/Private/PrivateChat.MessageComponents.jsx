import React from "react";
import { linkifyAndEmojify, formatTime, getMessageUrl } from "../../../js/Chat/PrivateChat.helpers";

export function MessageMenu({
  msg,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
  openMenuId,
  setOpenMenuId
}) {
  return (
    <div style={{ position: "absolute", top: -6, right: -6 }}>
      <button
        onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        ⋮
      </button>

      {openMenuId === msg.id && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            position: "absolute",
            right: 0,
            top: 26,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}
        >
          <div className="menu-item" onClick={() => onEdit(msg)}>Editar</div>
          <div className="menu-item" onClick={() => onDeleteForMe(msg)}>Excluir para mim</div>
          <div className="menu-item" onClick={() => onDeleteForAll(msg)}>Excluir para todos</div>
        </div>
      )}
    </div>
  );
}

export function MessageBubble({
  m,
  isMe,
  sender,
  currentUserId,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDeleteForMe,
  onDeleteForAll
}) {
  const html = linkifyAndEmojify(m.text || "");
  const url = getMessageUrl(m.url);

  const mediaStyle = {
    maxWidth: "260px",
    maxHeight: "300px",
    borderRadius: "12px",
    objectFit: "cover",
    background: "#eee"
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 10,
        position: "relative"
      }}
    >
      {!isMe && (
        <img
          src={sender?.avatarUrl}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 8
          }}
        />
      )}

      <div className={`msg ${isMe ? "me" : "other"}`} style={{ maxWidth: 480, position: "relative" }}>
        {/* Menu (somente minhas mensagens) */}
        {isMe && (
          <MessageMenu
            msg={{ ...m, currentUserId }}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onEdit={onEdit}
            onDeleteForMe={onDeleteForMe}
            onDeleteForAll={onDeleteForAll}
          />
        )}

        {/* IMAGEM */}
        {m.type === "image" && (
          <img src={url} alt="" style={mediaStyle} />
        )}

        {/*  VIDEO */}
        {m.tpe === "video" && (
          <video src={url} controls style={mediaStyle} />
        )}

        {/* ÁUDIO */}
        {m.type === "audio" && (
          <audio src={url} controls style={{ width: "100%" }} />
        )}

        {/* GIF */}
        {m.type === "gif" && (
          <img
            src={url}
            alt="gif"
            style={{
              ...mediaStyle,
              cursor: "pointer"
            }}
          />
        )}

        {/* ARQUIVO */}
        {m.type === "file" && (
          <a href={url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-word" }}>
            {url.split("/").pop()}
          </a>
        )}

        {/* TEXTO */}
        {m.text && (
          <div
            style={{ whiteSpace: "pre-wrap", marginTop: m.type !== "text" ? 6 : 0 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {/* Hora */}
        <div
          className="hora"
          style={{
            fontSize: 11,
            marginTop: 6,
            textAlign: "right",
            opacity: 0.7
          }}
        >
          {formatTime(m.createdAt)} {m.edited && "(editada)"}
        </div>
      </div>
    </div>
  );
}
