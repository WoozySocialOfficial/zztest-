import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Two-step Convex upload: get a signed URL, POST the file, return the storageId.
export function useUpload() {
  const generateUploadUrl = useMutation(api.gallery.generateUploadUrl);
  return async (file: File): Promise<string> => {
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const { storageId } = (await res.json()) as { storageId: string };
    return storageId;
  };
}
