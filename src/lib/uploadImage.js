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
