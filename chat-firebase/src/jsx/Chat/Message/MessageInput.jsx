import React, { useState, useRef, useEffect, useImperativeHandle } from "react";
import GifSearchModal from "../Gif/GifSearchModal.jsx";
import EmojiInput from "../Emoji/EmojiInput.jsx";

/**
 * MessageInput
 * - Fornece contentEditable com API de ref: insertAtCursor, focus, getText, clear
 * - Gera onSend({ text, file, gifUrl }) quando o usuário envia
 * - Suporta: anexar arquivo, drag/drop, paste (arquivo), emoji (via EmojiInput), GIF modal
 *
 * Props:
 * - onSend: fn({ text, file, gifUrl }) => Promise/void
 * - disabled: boolean
 * - placeholder: string
 * - maxSizeMB: number (default 40)
 */
const MessageInput = React.forwardRef(({ onSend, disabled = false, placeholder = "Mensagem...", maxSizeMB = 40 }, ref) => {
  const editableRef = useRef(null);
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showGifModal, setShowGifModal] = useState(false);
  const [sending, setSending] = useState(false);

  // Atualiza o content do contentEditable se necessário (não controlamos texto aqui)
  useEffect(() => {
    // nothing to sync initially
  }, []);

  // handlers
  const getText = () => {
    const el = editableRef.current;
    if (!el) return "";
    return el.innerText || "";
  };

  const clear = () => {
    const el = editableRef.current;
    if (el) el.textContent = "";
    setFile(null);
    if (previewUrl) { try { URL.revokeObjectURL(previewUrl); } catch { } }
    setPreviewUrl("");
  };

  const focus = () => {
    editableRef.current && editableRef.current.focus();
  };

  const insertAtCursor = (text) => {
    const el = editableRef.current;
    if (!el) return;

    const sel = window.getSelection();
    let range = sel && sel.getRangeAt && sel.rangeCount ? sel.getRangeAt(0) : null;

    if (!range || !el.contains(range.startContainer)) {
      el.focus();
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    const node = document.createTextNode(text);
    range.deleteContents();
    range.insertNode(node);

    // move cursor after node
    range.setStartAfter(node);
    range.setEndAfter(node);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
    el.normalize();
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  };

  useImperativeHandle(ref, () => ({
    insertAtCursor,
    focus,
    getText,
    clear
  }));

  // Send: delega a lógica para o onSend recebido do pai
  const handleSendClick = async () => {
    if (disabled || sending) return;
    const text = (getText() || "").trim();

    if (!text && !file) return;

    setSending(true);
    try {
      await onSend?.({ text, file, gifUrl: "" });
      // after successful send, clear
      clear();
    } catch (err) {
      console.error("MessageInput.onSend error:", err);
      // deixa o pai tratar alertas
    } finally {
      setSending(false);
    }
  };

  // envia GIF direto
  const handleSendGif = async (gifUrl) => {
    if (disabled || sending) return;
    setSending(true);
    try {
      await onSend?.({ text: "", file: null, gifUrl });
      setShowGifModal(false);
    } catch (err) {
      console.error("Erro ao enviar gif (MessageInput):", err);
    } finally {
      setSending(false);
    }
  };

  // arquivo selecionado
  const onFileSelected = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > maxSizeMB * 1024 * 1024) { alert(`Arquivo muito grande (máx ${maxSizeMB}MB).`); return; }
    setFile(f);
    try { setPreviewUrl(URL.createObjectURL(f)); } catch { setPreviewUrl(""); }
  };

  // drag/drop
  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;

    const onDragOver = (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = "copy"; };
    const onDrop = (ev) => {
      ev.preventDefault();
      const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (!f) return;
      if (f.size > maxSizeMB * 1024 * 1024) { alert(`Arquivo muito grande (máx ${maxSizeMB}MB).`); return; }
      setFile(f);
      try { setPreviewUrl(URL.createObjectURL(f)); } catch { setPreviewUrl(""); }
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
    };
  }, [maxSizeMB]);

  // paste (arquivo)
  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;

    const onPaste = (e) => {
      const files = e.clipboardData && e.clipboardData.files && e.clipboardData.files[0];
      if (files) {
        if (files.size > maxSizeMB * 1024 * 1024) { alert(`Arquivo muito grande (máx ${maxSizeMB}MB).`); return; }
        setFile(files);
        try { setPreviewUrl(URL.createObjectURL(files)); } catch { setPreviewUrl(""); }
        e.preventDefault();
      }
    };

    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [maxSizeMB]);

  // tecla Enter -> enviar (sem shift)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  // accessibility: expose a custom event 'emoji-input-enter' for integrations (compat)
  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [file, sending, disabled]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* preview do anexo */}
      {previewUrl && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {file && file.type && file.type.startsWith("image/") && <img src={previewUrl} alt="preview" style={{ width: 120, height: 80, borderRadius: 8, objectFit: "cover" }} />}
          {file && file.type && file.type.startsWith("video/") && <video src={previewUrl} style={{ width: 160, height: 100 }} controls />}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{file?.name}</div>
            <button onClick={() => { if (previewUrl) try { URL.revokeObjectURL(previewUrl); } catch { } setPreviewUrl(""); setFile(null); }}>Remover</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Emoji picker */}
        <div>
          <EmojiInput onEmoji={(emoji) => insertAtCursor(emoji)} />
        </div>

        {/* contentEditable */}
        <div
          ref={editableRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={() => { /* nothing else - getText lerá */ }}
          data-placeholder={placeholder}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #ccc",
            borderRadius: 20,
            minHeight: 36,
            maxHeight: 200,
            overflowY: "auto",
            outline: "none",
            whiteSpace: "pre-wrap",
            fontSize: 15,
            lineHeight: "1.45",
            fontFamily: `"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`
          }}
        />

        {/* anexar arquivo */}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px", borderRadius: 8, background: "#fff", border: "1px solid #ddd" }}>
          📎
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={onFileSelected} />
        </label>

        {/* GIF */}
        <button title="GIF" onClick={() => setShowGifModal(true)} style={{ padding: "8px 10px", borderRadius: 8, border: "none", background: "#fff", cursor: "pointer" }}>🎞️</button>

        {/* Enviar */}
        <button
          onClick={handleSendClick}
          disabled={disabled || sending}
          style={{ padding: "10px 14px", borderRadius: 20, border: "none", background: disabled || sending ? "#7da79a" : "#075E54", color: "#fff", cursor: disabled || sending ? "not-allowed" : "pointer" }}
        >
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </div>

      {/* GIF modal */}
      {showGifModal && (
        <GifSearchModal
          onClose={() => setShowGifModal(false)}
          onPickGif={(url) => {
            handleSendGif(url);
          }}
        />
      )}
    </div>
  );
});

export default MessageInput;
