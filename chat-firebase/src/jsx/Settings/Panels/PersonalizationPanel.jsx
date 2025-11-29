// src/jsx/Settings/Panels/PersonalizationPanel.jsx
import React, { useState, useEffect } from "react";
import { WALLPAPERS } from "../../../js/Chat_js/Wallpaper_js/WallpaperLoader.js";

const THEMES = {
  whatsapp: {
    "--bg": "#e5ddd5",
    "--primary": "#075E54",
    "--accent": "#128C7E",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#dcf8c6",
    "--chat-me-grad-end": "#cfeec0",
  },
  telegram: {
    "--bg": "#e6f0ff",
    "--primary": "#0088cc",
    "--accent": "#1c9be6",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#d8f1ff",
    "--chat-me-grad-end": "#bfe8ff",
  },
  discord: {
    "--bg": "#f2ecff",
    "--primary": "#5865F2",
    "--accent": "#6e7cff",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#efe9ff",
    "--chat-me-grad-end": "#e2dbff",
  },
  amoled: {
    "--bg": "#000000",
    "--primary": "#1f1f1f",
    "--accent": "#06d6a0",
    "--chat-other": "#111111",
    "--chat-me-grad-start": "#041f0f",
    "--chat-me-grad-end": "#06331b",
  },
  beige: {
    "--bg": "#fbf7f2",
    "--primary": "#b38f6f",
    "--accent": "#d6c2a1",
    "--chat-other": "#ffffff",
    "--chat-me-grad-start": "#f0e8df",
    "--chat-me-grad-end": "#e6dccf",
  },
};

export default function PersonalizationPanel() {
  const [theme, setTheme] = useState("whatsapp");
  const [fontSize, setFontSize] = useState(15);

  const [wallpaper, setWallpaper] = useState(null);
  const [preset, setPreset] = useState(null);

  const [pendingWallpaper, setPendingWallpaper] = useState(null);
  const [pendingPreset, setPendingPreset] = useState(null);
  const [dirty, setDirty] = useState(false);

  // -----------------------------
  // Carregar configurações salvas
  // -----------------------------
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedFont = localStorage.getItem("fontSize");
    const savedWallpaper = localStorage.getItem("wallpaper-upload");
    const savedPreset = localStorage.getItem("wallpaper-preset");

    if (savedTheme) setTheme(savedTheme);
    if (savedFont) setFontSize(Number(savedFont));

    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
      document.documentElement.style.setProperty("--wallpaper-selected", `url(${savedWallpaper})`);
    }

    if (savedPreset) {
      setPreset(savedPreset);
      const mod = WALLPAPERS[savedPreset];
      const src = mod?.default || mod;
      if (src) {
        document.documentElement.style.setProperty("--wallpaper-selected", `url(${src})`);
      }
    }
  }, []);

  // -----------------------------
  // Aplicar tema + fonte
  // -----------------------------
  useEffect(() => {
    const map = THEMES[theme];
    for (const k in map) document.documentElement.style.setProperty(k, map[k]);
    document.documentElement.style.setProperty("--global-font-size", `${fontSize}px`);

    localStorage.setItem("theme", theme);
    localStorage.setItem("fontSize", fontSize);
  }, [theme, fontSize]);

  // -----------------------------
  // Upload temporário
  // -----------------------------
  function handleWallpaperChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPendingPreset(null);
      setPendingWallpaper(reader.result);
      setDirty(true);
    };
    reader.readAsDataURL(file);
  }

  // -----------------------------
  // Seleção de predefinidos
  // -----------------------------
  function handlePresetSelect(name) {
    setPendingWallpaper(null);
    setPendingPreset(name);
    setDirty(true);
  }

  // -----------------------------
  // Aplicar alterações
  // -----------------------------
  function applyChanges() {
    if (pendingWallpaper) {
      setWallpaper(pendingWallpaper);
      setPreset(null);
      document.documentElement.style.setProperty("--wallpaper-selected", `url(${pendingWallpaper})`);

      localStorage.setItem("wallpaper-upload", pendingWallpaper);
      localStorage.removeItem("wallpaper-preset");
    }

    if (pendingPreset) {
      const mod = WALLPAPERS[pendingPreset];
      const src = mod?.default || mod;

      if (src) {
        document.documentElement.style.setProperty("--wallpaper-selected", `url(${src})`);
        setPreset(pendingPreset);
        setWallpaper(null);

        localStorage.setItem("wallpaper-preset", pendingPreset);
        localStorage.removeItem("wallpaper-upload");
      }
    }

    setDirty(false);
  }

  // -----------------------------
  // Remover papel de parede
  // -----------------------------
  function clearWallpaper() {
    setWallpaper(null);
    setPreset(null);
    setPendingWallpaper(null);
    setPendingPreset(null);

    document.documentElement.style.setProperty("--wallpaper-selected", "none");

    localStorage.removeItem("wallpaper-upload");
    localStorage.removeItem("wallpaper-preset");

    setDirty(false);
  }

  return (
    <div style={styles.panel}>
      <h2 style={styles.title}>Personalização</h2>

      {/* Tema */}
      <div style={styles.block}>
        <label style={styles.label}>Tema</label>
        <div style={styles.swatchRow}>
          {Object.keys(THEMES).map((t) => (
            <div
              key={t}
              className="theme-swatch"
              onClick={() => {
                setTheme(t);
                setDirty(true);
              }}
              style={{
                ...styles.themeSwatch,
                borderColor: theme === t ? "var(--primary)" : "transparent",
              }}
            >
              <div style={{ ...styles.swatchPreview, background: THEMES[t]["--primary"] }} />
              <span style={styles.swatchLabel}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fonte */}
      <div style={styles.block}>
        <label style={styles.label}>Tamanho da fonte</label>
        <div style={styles.fontRow}>
          <input
            type="range"
            min="12"
            max="22"
            value={fontSize}
            onChange={(e) => {
              setFontSize(Number(e.target.value));
              setDirty(true);
            }}
          />
          <span>{fontSize}px</span>
        </div>
      </div>

      {/* Wallpapers pré-definidos */}
      <div style={styles.block}>
        <label style={styles.label}>Papéis de parede pré-definidos</label>

        <div style={styles.wallpaperGrid}>
          {Object.entries(WALLPAPERS).map(([name, mod]) => {
            const src = mod?.default || mod;
            return (
              <div
                key={name}
                onClick={() => handlePresetSelect(name)}
                style={{
                  ...styles.wallpaperTile,
                  backgroundImage: `url(${src})`,
                  border:
                    pendingPreset === name || preset === name
                      ? "3px solid var(--primary)"
                      : "2px solid #ccc",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Upload */}
      <div style={styles.block}>
        <label style={styles.label}>Enviar imagem</label>

        <input type="file" accept="image/*" onChange={handleWallpaperChange} />

        {pendingWallpaper && (
          <img src={pendingWallpaper} style={styles.preview} alt="preview" />
        )}
      </div>

      {/* Botões */}
      <div style={styles.buttons}>
        {dirty && (
          <button className="btn" style={styles.saveBtn} onClick={applyChanges}>
            Salvar alterações
          </button>
        )}

        <button className="btn" style={styles.clearBtn} onClick={clearWallpaper}>
          Remover papel de parede
        </button>
      </div>
    </div>
  );
}

/* ============================
   ESTILOS INLINE
============================ */
const styles = {
  panel: {
    padding: 20,
    height: "calc(100vh - 60px)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  title: {
    marginBottom: 10,
    color: "var(--primary)",
  },
  block: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 15, fontWeight: 600 },
  swatchRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  themeSwatch: {
    width: 90,
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    border: "2px solid transparent",
    cursor: "pointer",
  },
  swatchPreview: {
    width: "100%",
    height: 38,
    borderRadius: 6,
  },
  swatchLabel: { fontSize: 13, marginTop: 4, textTransform: "capitalize" },
  fontRow: { display: "flex", alignItems: "center", gap: 10 },
  wallpaperGrid: { display: "flex", flexWrap: "wrap", gap: 12 },
  wallpaperTile: {
    width: 110,
    height: 70,
    borderRadius: 10,
    backgroundSize: "cover",
    backgroundPosition: "center",
    cursor: "pointer",
  },
  preview: {
    width: 160,
    height: 90,
    borderRadius: 10,
    marginTop: 8,
    border: "1px solid #ccc",
    objectFit: "cover",
  },
  buttons: {
    marginTop: 20,
    display: "flex",
    gap: 12,
  },
  saveBtn: {
    background: "var(--primary)",
    color: "#fff",
  },
  clearBtn: {
    background: "#b00020",
    color: "#fff",
  },
};
