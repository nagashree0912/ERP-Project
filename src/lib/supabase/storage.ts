import { createClient } from "./client";
// Upload a file to Supabase Storage. Returns public URL (public buckets)
// or file path (private buckets). Falls back gracefully when unconfigured.
export async function uploadFile(bucket: "avatars" | "materials" | "documents", file: File): Promise<{ ok: boolean; url?: string; path?: string; error?: string }> {
  const sup = createClient();
  if (!sup) return { ok: false, error: "Supabase not configured — file kept as local record" };
  const ext = file.name.split(".").pop() || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sup.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) return { ok: false, error: error.message };
  if (bucket === "avatars" || bucket === "materials") {
    const { data } = sup.storage.from(bucket).getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
  }
  return { ok: true, path };
}
export async function downloadFile(bucket: "avatars" | "materials" | "documents", path: string, filename: string) {
  const sup = createClient();
  if (!sup) return false;
  const { data, error } = await sup.storage.from(bucket).download(path);
  if (error || !data) return false;
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  return true;
}
