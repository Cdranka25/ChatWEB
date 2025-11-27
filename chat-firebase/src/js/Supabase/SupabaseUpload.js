// src/js/Supabase/SupabaseUpload.js
import { supabase } from "./SupabaseConfig.js";

const BUCKET = "ChatWEB";

function safeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  
    .replace(/[^a-zA-Z0-9.\-_]/g, "_"); 
}

export async function uploadAvatar(file, uid) {
  if (!file) return { publicUrl: "", path: "" };

  const cleanName = safeFileName(file.name);
  const filePath = `avatars/${uid}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) {
    console.error("Erro upload avatar (Supabase):", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl || "";

  return { publicUrl, path: filePath };
}

// Upload de arquivos de mensagens (imagem / vídeo / arquivo)
export async function uploadMessageMedia(file, roomId) {
  if (!file) return { publicUrl: "", path: "" };

  const cleanName = safeFileName(file.name);
  const filePath = `rooms/${roomId}/${Date.now()}-${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    console.error("Erro upload mensagem (Supabase):", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl || "";

  return { publicUrl, path: filePath };
}

// Remover arquivo (rollback ou exclusão manual)
export async function removeFile(path) {
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.warn("Falha ao remover arquivo do Supabase:", error);
  }
}
