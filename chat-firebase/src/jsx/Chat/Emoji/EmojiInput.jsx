// src/jsx/Emoji/EmojiInput.jsx
import React, { useRef, useEffect } from "react";
import { emojify } from "../../../js/Chat/Emoji/EmojiParser";

export default function EmojiInput({ value, onChange, placeholder }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return;

    const html = emojify(value);

    if (divRef.current.innerText !== value) {
      divRef.current.textContent = value;
    }
  }, [value]);

  const handleInput = () => {
    const text = divRef.current.innerText;
    onChange(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      divRef.current.dispatchEvent(new CustomEvent("emoji-input-enter"));
    }
  };

  return (
    <div
      ref={divRef}
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      style={{
        flex: 1,
        padding: "12px 14px",
        border: "1px solid #ccc",
        borderRadius: "20px",
        minHeight: "24px",
        maxHeight: "200px",
        overflowY: "auto",
        outline: "none",
        whiteSpace: "pre-wrap",
        fontSize: "15px",
        lineHeight: "1.45",
        fontFamily: `"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`,
      }}
    />
  );
}
