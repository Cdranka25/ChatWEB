// src/jsx/Chat/Message/ChatMessage.jsx
import React from "react";
import { linkifyAndEmojify, formatTime, getMessageUrl } from "../../../js/Chat_js/PrivateChat.helpers";
import ChatMessageMenu from "./ChatMessageMenu.jsx";
import ChatMessageDaySeparator from "./ChatMessageDaySeparator.jsx";
import Avatar from "../../Profile/Avatar.jsx";
import { emojify } from "../../../js/Chat_js/Emoji/EmojiParser.js";

export default function ChatMessage({
  mensagem,
  previousCreatedAt,   // <-- NOVO
  euSou,
  remetente,
  idUsuarioAtual,
  abertoPara,
  setAbertoPara,
  onEditar,
  onExcluirParaMim,
  onExcluirParaTodos,
  mostrarNomeRemetente = false,
  isGroup = false,
  groupMemberCount = null
}) {
  const raw = linkifyAndEmojify(mensagem.text || "");
  const html = emojify(raw);
  const url = getMessageUrl(mensagem.url);

  // ------- LÓGICA DO SEPARADOR DE DIA --------
  function isDifferentDay() {
    if (!mensagem.createdAt) return false;
    const cur = mensagem.createdAt?.toDate ? mensagem.createdAt.toDate() : new Date(mensagem.createdAt);

    if (!previousCreatedAt) return true; // primeira mensagem sempre mostra

    const prev = previousCreatedAt?.toDate ? previousCreatedAt.toDate() : new Date(previousCreatedAt);

    return cur.toDateString() !== prev.toDateString();
  }

  const showDaySeparator = isDifferentDay();
  // -------------------------------------------

  // -------- STATUS / TICKS (mantém igual) ----
  let visualStatus = "sent";

  const seenBy = Array.isArray(mensagem.seenBy) ? mensagem.seenBy : [];
  if (mensagem.from === idUsuarioAtual) {
    if (seenBy.length > 0) visualStatus = "seen";
    else if (mensagem.status === "received") visualStatus = "received";
    else visualStatus = "sent";
  }


  if (isGroup && typeof groupMemberCount === "number") {
    const seenBy = Array.isArray(mensagem.seenBy) ? mensagem.seenBy : [];
    const receivedBy = Array.isArray(mensagem.receivedBy) ? mensagem.receivedBy : [];
    const othersCount = Math.max(0, groupMemberCount - 1);

    if (othersCount > 0 && seenBy.length >= othersCount) visualStatus = "seen";
    else if (othersCount > 0 && receivedBy.length >= othersCount) visualStatus = "received";
    else if (seenBy.length > 0) visualStatus = "received";
  }

  const tickStyle = {
    fontSize: 11,
    opacity: visualStatus === "seen" ? 1 : 0.65,
    color: visualStatus === "seen" ? "#19a1ff" : "inherit",
    width: 28,
    display: "inline-block",
    textAlign: "left"
  };

  return (
    <div>
      {showDaySeparator && (
        <div style={{ width: "100%" }}>
          <ChatMessageDaySeparator createdAt={mensagem.createdAt} />
        </div>
      )}


      <div
        style={{
          display: "flex",
          justifyContent: euSou ? "flex-end" : "flex-start",
          marginBottom: 10
        }}
      >
        {!euSou && (
          <div style={{ marginRight: 8 }}>
            <Avatar user={remetente} size={36} />
          </div>
        )}

        <div className={`msg ${euSou ? "me" : "other"}`} style={{ maxWidth: 480 }}>
          {euSou && (
            <ChatMessageMenu
              abertoPara={abertoPara}
              setAbertoPara={setAbertoPara}
              mensagem={mensagem}
              onEditar={onEditar}
              onExcluirParaMim={onExcluirParaMim}
              onExcluirParaTodos={onExcluirParaTodos}
            />
          )}

          {mostrarNomeRemetente && !euSou && (
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              {remetente?.nome || remetente?.email}
            </div>
          )}

          {/* Mídias */}
          {mensagem.type === "image" && <img src={url} alt="" style={{ maxWidth: 260, borderRadius: 12 }} />}
          {mensagem.type === "video" && <video src={url} controls style={{ maxWidth: 260 }} />}
          {mensagem.type === "audio" && <audio src={url} controls />}

          {/* Texto */}
          {mensagem.text && (
            <div dangerouslySetInnerHTML={{ __html: html }} style={{ whiteSpace: "pre-wrap" }} />
          )}

          {/* Hora e status */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              {formatTime(mensagem.createdAt)}
              {mensagem.edited ? " (editada)" : ""}
            </span>

            {mensagem.from === idUsuarioAtual && (
              <span style={tickStyle}>
                {visualStatus === "sent" && "✓"}
                {visualStatus === "received" && "✓✓"}
                {visualStatus === "seen" && "✓✓"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
