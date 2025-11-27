// src/jsx/Chat/Private/PrivateChat.MessageComponents.jsx

import React, { useEffect, useRef } from "react";
import { linkifyAndEmojify, formatTime, getMessageUrl } from "../../../js/Chat/PrivateChat.helpers";
import Avatar from "../../Profile/Avatar.jsx";


export function MessageMenu({
  msg,
  onEdit,
  onDeleteForMe,
  onDeleteForAll,
  openMenuId,
  setOpenMenuId
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        openMenuId === msg.id &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId, msg.id]);

  return (
    <div style={{ position: "absolute", top: -6, right: -6, zIndex: 1000 }}>
      <button
        onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        ⋮
      </button>

      {openMenuId === msg.id && (
        <div
          ref={menuRef}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            position: "absolute",
            right: 0,
            top: 26,
            boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
            zIndex: 9999,
            minWidth: 160,
            overflow: "hidden"
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
        <div style={{ marginRight: 8 }}>
          <Avatar user={sender} size={36} />
        </div>
      )}


      <div className={`msg ${isMe ? "me" : "other"}`} style={{ maxWidth: 480, position: "relative", overflow: "visible" }}>
        {/* Menu*/}
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

        {/* Hora + ticks */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 4,               
            marginTop: 4,
            fontSize: 11,       
            opacity: 0.75,
            minHeight: 14,     
          }}
        >
          <span>{formatTime(m.createdAt)}{m.edited && " (editada)"}</span>

          {/* status */}
          {m.from === currentUserId && (
            <span
              style={{
                fontSize: 11,
                opacity: m.status === "seen" ? 1 : 0.6,
                color: m.status === "seen" ? "#19a1ff" : "inherit",
                width: 18,   
                display: "inline-block",
                textAlign: "left",
              }}
            >
              {m.status === "sent" && "✓"}
              {m.status === "received" && "✓✓"}
              {m.status === "seen" && "✓✓"}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
