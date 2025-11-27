// src/jsx/Chat/Message/MessageInput.jsx
import React, { useImperativeHandle, useRef, useEffect } from "react";

const MessageInput = React.forwardRef(({ value = "", onChange, onEnter, placeholder }, ref) => {
  const divRef = useRef(null);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    if (el.innerText !== value) el.textContent = value;
  }, [value]);

  const handleInput = () => {
    const text = divRef.current.innerText;
    onChange && onChange(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter && onEnter();
    }
  };

  const insertAtCursor = (text) => {
    const el = divRef.current;
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

    range.setStartAfter(node);
    range.setEndAfter(node);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
    el.normalize();

    handleInput();
    el.focus();
  };


  useImperativeHandle(ref, () => ({
    insertAtCursor,
    focus: () => divRef.current && divRef.current.focus(),
    getText: () => divRef.current?.innerText || ""
  }));

  return (
    <div
      ref={divRef}
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className="message-input"
      style={{
        flex: 1,
        padding: "12px 14px",
        border: "1px solid #ccc",
        borderRadius: "20px",
        minHeight: "28px",
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
});

export default MessageInput;
