import { createClient } from "@supabase/supabase-js";

/**
 * Server-only private merchant document store.
 * Never import this file into a browser component or expose the service key.
 */
const BUCKET = "orderking-merchant-documents";
const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function credentials() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)?.trim();
  if (!url || !key) {
    throw new Error("Secure document storage is unavailable: server credentials are not configured.");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Secure document storage URL is invalid.");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname) {
    throw new Error("Secure document storage requires HTTPS.");
  }
  return { url: parsed.origin, key };
}

export function isPrivateMerchantStorageConfigured(): boolean {
  try {
    credentials();
    return true;
  } catch {
    return false;
  }
}

function storageClient() {
  const { url, key } = credentials();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export function isValidDocumentMagic(bytes: Uint8Array, type: string): boolean {
  if (bytes.byteLength < 12) return false;
  const starts = (...prefix: number[]) => prefix.every((value, idx) => bytes[idx] === value);
  if (type === "application/pdf") return starts(0x25, 0x50, 0x44, 0x46, 0x2d);
  if (type === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (type === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (type === "image/webp") {
    return starts(0x52, 0x49, 0x46, 0x46) &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

export async function uploadPrivateMerchantDocument(input: {
  restaurantId: string;
  kind: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<{ backend: "supabase_private"; key: string; byteSize: number; connected: true }> {
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(input.restaurantId)) throw new Error("Invalid restaurant ID");
  if (!/^[a-zA-Z0-9_-]{1,50}$/.test(input.kind)) throw new Error("Invalid document category");
  const ext = EXTENSIONS[input.contentType];
  if (!ext || !isValidDocumentMagic(input.bytes, input.contentType)) {
    throw new Error("Document content does not match its declared file type.");
  }
  const path = `${input.restaurantId}/${input.kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await storageClient().storage.from(BUCKET).upload(path, input.bytes, {
    contentType: input.contentType,
    upsert: false,
  });
  if (error) throw new Error("Secure document upload failed. Your file was not saved.");
  return { backend: "supabase_private", key: path, byteSize: input.bytes.byteLength, connected: true };
}

/** Best-effort cleanup when saving the SQL metadata fails after object upload. */
export async function removePrivateMerchantDocument(key: string): Promise<void> {
  if (!/^[a-zA-Z0-9_./-]+$/.test(key)) return;
  const { error } = await storageClient().storage.from(BUCKET).remove([key]);
  if (error) throw new Error("Could not remove the orphaned private document.");
}
