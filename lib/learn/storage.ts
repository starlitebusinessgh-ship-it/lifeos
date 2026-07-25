import { supabase } from "@/lib/supabase";

const BUCKET = "library-pdfs";

export function pdfPublicUrl(filePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadPdfFile(
  bookId: string,
  file: File
): Promise<{ path: string | null; error: string | null }> {
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
  const path = `${bookId}/${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: "application/pdf",
  });

  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

export async function deletePdfFile(filePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([filePath]);
}
