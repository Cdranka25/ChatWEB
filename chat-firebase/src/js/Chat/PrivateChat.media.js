// src/js/Chat/PrivateChat.media.js
import { uploadMessageMedia } from "../Supabase/SupabaseUpload";

export async function uploadFileForMessage(file, roomId) {
  if (!file) return { publicUrl: "", path: "" };

  const res = await uploadMessageMedia(file, roomId);
  if (!res) return { publicUrl: "", path: "" };
  if (typeof res === "string") return { publicUrl: res, path: "" };
  return {
    publicUrl: res.publicUrl || res.publicURL || res.url || "",
    path: res.path || res.filePath || ""
  };
}

export function extractFileFromPaste(clipboardData) {
  if (!clipboardData) return null;
  if (clipboardData.files && clipboardData.files.length > 0) {
    return clipboardData.files[0];
  }
  const items = clipboardData.items || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === "file") {
      const f = it.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

export function permissiveFileTypeCheck(file, maxMB = 40) {
  if (!file) return { ok: false, msg: "Arquivo inválido" };
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) return { ok: false, msg: `Arquivo maior que ${maxMB}MB` };
  return { ok: true };
}
