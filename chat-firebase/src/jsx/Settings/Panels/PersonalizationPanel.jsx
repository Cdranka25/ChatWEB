// src/jsx/Settings/panels/PersonalizationPanel.jsx
import React, { useState, useEffect } from "react";

/**
 * Gera classes de tema no root (document.documentElement.style) para aplicar globalmente.
 */
const THEMES = {
  "whatsapp": {
    "--bg": "#e5ddd5",
    "--primary": "#075E54",
    "--accent": "#128C7E",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#dcf8c6",
    "--chat-me-grad-end": "#cfeec0"
  },
  "telegram": {
    "--bg": "#e6f0ff",
    "--primary": "#0088cc",
    "--accent": "#1c9be6",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#d8f1ff",
    "--chat-me-grad-end": "#bfe8ff"
  },
  "discord": {
    "--bg": "#f2ecff",
    "--primary": "#5865F2",
    "--accent": "#6e7cff",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#efe9ff",
    "--chat-me-grad-end": "#e2dbff"
  },
  "amoled": {
    "--bg": "#000000",
    "--primary": "#1f1f1f",
    "--accent": "#06d6a0",
    "--chat-other": "#111111",
    "--chat-me-grad-start": "#041f0f",
    "--chat-me-grad-end": "#06331b"
  },
  "beige": {
    "--bg": "#fbf7f2",
    "--primary": "#b38f6f",
    "--accent": "#d6c2a1",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#f0e8df",
    "--chat-me-grad-end": "#e6dccf"
  }
};

export default function PersonalizationPanel() {
  const [theme, setTheme] = useState("whatsapp");
  const [fontSize, setFontSize] = useState(15);

  useEffect(() => {
    const map = THEMES[theme];
    for (const k in map) document.documentElement.style.setProperty(k, map[k]);
    document.documentElement.style.setProperty("--global-font-size", `${fontSize}px`);
  }, [theme, fontSize]);

  return (
    <div>
      <h4>Personalização</h4>

      <div>
        <label>Tema pronto</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {Object.keys(THEMES).map(t => (
            <div key={t} className={`theme-swatch ${t} ${theme === t ? "selected" : ""}`} onClick={() => setTheme(t)}>
              <div className="swatch-preview" />
              <div style={{ fontSize: 12, marginTop: 6, textTransform: "capitalize" }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Fonte / Tamanho</label>
        <div className="setting-row">
          <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
          <div>{fontSize}px</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Papel de parede</label>
        <div style={{ marginTop: 8 }}>
          <select>
            <option>Simples — padrão</option>
            <option>Linhas suaves</option>
            <option>Gradiente leve</option>
          </select>
        </div>
      </div>
    </div>
  );
}
