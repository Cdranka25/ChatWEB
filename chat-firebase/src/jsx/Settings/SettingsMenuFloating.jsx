//src/jsx/Settings/SettingsMenuFloating.jsx
import React, { useState, useRef, useEffect } from "react";


export default function SettingsMenuFloating({ active, onChange, onClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="settings-floating" ref={ref}>
      <button className="menu-button" onClick={() => setOpen(v => !v)}>⋮</button>

      {open && (
        <div className="menu-dropdown settings-floating-menu">
          <div className="menu-item" onClick={() => { onChange?.("notifications"); setOpen(false); }}>Notificações</div>
          <div className="menu-item" onClick={() => { onChange?.("personalization"); setOpen(false); }}>Personalização</div>
          <div className="menu-item" onClick={() => { onChange?.("security"); setOpen(false); }}>Segurança</div>
          <div className="menu-item" onClick={() => { onChange?.("delete"); setOpen(false); }}>Excluir Conta</div>
          <div className="menu-item" onClick={() => { setOpen(false); onClose?.(); }}>Fechar Configurações</div>
        </div>
      )}
    </div>
  );
}
