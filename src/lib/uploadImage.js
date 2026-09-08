import { supabase } from "./supabaseClient";

// Uploads to the `submission-images` bucket under {userId}/{random}-{filename},
// matching the storage RLS policy (the first path segment must be the
// uploader's own user id). Returns the storage path to store in build_images.
export async function uploadSubmissionImage(file, userId) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("submission-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

// Uploads to the `catalog-images` bucket at a fixed path per pet/item
// (kind/id.ext), so re-uploading the same one just replaces it — no
// orphaned old files, and the URL never changes once set. Returns the
// public URL directly since the bucket is public.
export async function uploadCatalogImage(file, kind, id) {
  const ext = file.name.split(".").pop();
  const path = `${kind}/${id}.${ext}`;
  const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
  // Cache-bust so a replaced image shows up immediately instead of the
  // browser serving its cached copy of the old file at the same path.
  return `${data.publicUrl}?v=${Date.now()}`;
}
