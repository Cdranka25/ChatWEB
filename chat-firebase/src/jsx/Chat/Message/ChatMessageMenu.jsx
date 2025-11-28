// src/jsx/Chat/Message/ChatMessageMenu.jsx
import React, { useRef, useEffect } from "react";

export default function ChatMessageMenu({
  abertoPara,
  setAbertoPara,
  mensagem,
  onEditar,
  onExcluirParaMim,
  onExcluirParaTodos
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleDocClick(e) {
      if (!menuRef.current) return;

      if (e.target.closest && e.target.closest('[data-chat-msg-menu-button]')) return;
      if (!menuRef.current.contains(e.target)) setAbertoPara(null);
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [setAbertoPara]);

  const toggle = () => {
    setAbertoPara(abertoPara === mensagem.id ? null : mensagem.id);
  };

  return (
    <div style={{ position: "absolute", top: -6, right: -6, zIndex: 1000 }}>
      <button
        data-chat-msg-menu-button={mensagem.id}
        onClick={toggle}
        aria-label="abrir menu de opção da mensagem"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        ⋮
      </button>

      {abertoPara === mensagem.id && (
        <div
          ref={menuRef}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            position: "absolute",
            right: 0,
            top: 26,
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            minWidth: 160,
            overflow: "hidden"
          }}
        >
          <div className="menu-item" onClick={() => { setAbertoPara(null); onEditar?.(mensagem); }}>Editar</div>
          <div className="menu-item" onClick={() => { setAbertoPara(null); onExcluirParaMim?.(mensagem); }}>Excluir para mim</div>
          <div className="menu-item" onClick={() => { setAbertoPara(null); onExcluirParaTodos?.(mensagem); }}>Excluir para todos</div>
        </div>
      )}
    </div>
  );
}
