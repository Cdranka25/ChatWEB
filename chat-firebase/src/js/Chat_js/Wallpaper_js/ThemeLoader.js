import { db } from "../../Firebase/FirebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { THEMES } from "./ThemePresets";
import { WALLPAPERS } from "../Wallpaper_js/WallpaperLoader";

export async function loadUserTheme(user) {
    if (!user) return;

    console.log("🔵 Carregando tema para:", user.uid);

    const ref = doc(db, "userSettings", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        console.log("⚪ Nenhuma configuração salva para o usuário.");
        return;
    }

    const s = snap.data();
    console.log("🎨 Configurações carregadas:", s);

    // --------------------------
    // 1️⃣ Aplicar tema (cores)
    // --------------------------
    if (s.theme && THEMES[s.theme]) {
        const map = THEMES[s.theme];
        for (const k in map) {
            document.documentElement.style.setProperty(k, map[k]);
        }

        localStorage.setItem("theme", s.theme);
    }

    // --------------------------
    // 2️⃣ Aplicar tamanho da fonte
    // --------------------------
    if (s.fontSize) {
        document.documentElement.style.setProperty("--global-font-size", `${s.fontSize}px`);
        localStorage.setItem("fontSize", s.fontSize);
    }

    // --------------------------
    // 3️⃣ Aplicar papel de parede (upload)
    // --------------------------
    if (s.wallpaperUpload) {
        document.documentElement.style.setProperty(
            "--wallpaper-selected",
            `url(${s.wallpaperUpload})`
        );

        localStorage.setItem("wallpaper-upload", s.wallpaperUpload);
        localStorage.removeItem("wallpaper-preset");

        return; // prioridade para upload
    }

    // --------------------------
    // 4️⃣ Aplicar papel de parede (preset)
    // --------------------------
    if (s.wallpaperPreset) {
        const mod = WALLPAPERS[s.wallpaperPreset];
        const src = mod?.default || mod;

        if (src) {
            document.documentElement.style.setProperty(
                "--wallpaper-selected",
                `url(${src})`
            );

            localStorage.setItem("wallpaper-preset", s.wallpaperPreset);
            localStorage.removeItem("wallpaper-upload");
        }
    }
}
