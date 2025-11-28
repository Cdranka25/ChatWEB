// src/jsx/Emoji/EmojiInput.jsx
import React, { useRef, useEffect, useState, Suspense } from "react";

const Picker = React.lazy(() => import("emoji-picker-react"));

export default function EmojiInput({ onEmoji }) {
  const btnRef = useRef(null);
  const pickerRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleDocClick(e) {
      if (btnRef.current?.contains(e.target)) return;
      if (pickerRef.current?.contains(e.target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [open]);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    onEmoji?.(emoji);
    // opcional: deixar aberto ou fechar
    // setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        style={{ padding: 8, borderRadius: 8, background: "transparent", border: "none" }}
      >
        😊
      </button>

      {open && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            zIndex: 9999,
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
          }}
        >
          <Suspense fallback={<div style={{ padding: 20 }}>Carregando...</div>}>
            <Picker onEmojiClick={handleEmojiClick} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
