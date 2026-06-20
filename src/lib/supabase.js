// Supabase Storage ulanishi (rasm, video, avatar fayllari uchun)
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// Bucket nomi (Supabase'da yaratilgan). Hozircha "models" bucket'idan
// foydalanamiz, ichida avatars/, videos/, products/, gallery/ papkalari.
export const STORAGE_BUCKET = "models";

export const getPublicUrl = (path, bucket = STORAGE_BUCKET) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Noyob, xavfsiz fayl yo'lini yaratish.
export const makeUploadPath = (folder, fileName) => {
  const ext = (fileName.split(".").pop() || "bin").toLowerCase();
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return `${folder}/${safe}`;
};

// Faylni yuklab, ommaviy URL qaytaradi.
export const uploadFile = async (folder, file, bucket = STORAGE_BUCKET) => {
  const path = makeUploadPath(folder, file.name);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  return { url: getPublicUrl(path, bucket), path };
};

export const deleteFile = async (path, bucket = STORAGE_BUCKET) => {
  await supabase.storage.from(bucket).remove([path]);
};
