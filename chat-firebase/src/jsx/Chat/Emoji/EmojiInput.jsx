// src/jsx/Emoji/EmojiInput.jsx
import React, { useRef, useEffect } from "react";
import Picker from "emoji-picker-react";

export default function EmojiInput({ onEmoji }) {
  const btnRef = useRef(null);
  const pickerRef = useRef(null);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    function handleDocClick(e) {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (pickerRef.current && pickerRef.current.contains(e.target)) return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [open]);

  const handleEmojiClick = (emojiData) => {
    const emoji =
      emojiData?.emoji ||
      emojiData?.native ||
      (emojiData?.unified
        ? emojiData.unified
          .split("-")
          .map(u => String.fromCodePoint(parseInt(u, 16)))
          .join("")
        : "");
    onEmoji && onEmoji(emoji);
    // keep picker open or close as you prefer:
    // setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        style={{ padding: 8, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
      >
        😊
      </button>

      {open && (
        <div
          ref={pickerRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            zIndex: 9999,
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
          }}
        >
          <Picker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}

