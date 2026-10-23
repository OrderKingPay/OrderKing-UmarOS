import { platformConfig } from "@/lib/platform-config";

export type StoredObject = {
  backend: "local_preview" | "s3";
  key: string;
  contentType: string;
  byteSize: number;
  connected: boolean;
};

const ALLOWED = new Set<string>([
  ...platformConfig.restaurantSettings.allowedDocumentTypes,
  ...platformConfig.restaurantSettings.allowedImageTypes,
]);

export function validateUpload(input: {
  contentType: string;
  byteSize: number;
  kind: "document" | "image";
}): { ok: true } | { ok: false; error: string } {
  const allowed =
    input.kind === "image"
      ? platformConfig.restaurantSettings.allowedImageTypes
      : platformConfig.restaurantSettings.allowedDocumentTypes;
  if (!allowed.includes(input.contentType as never) && !ALLOWED.has(input.contentType)) {
    return { ok: false, error: "This file type is not allowed." };
  }
  if (input.byteSize <= 0 || input.byteSize > platformConfig.restaurantSettings.maxUploadBytes) {
    return {
      ok: false,
      error: `File must be under ${Math.floor(platformConfig.restaurantSettings.maxUploadBytes / 1024)} KB.`,
    };
  }
  return { ok: true };
}

/**
 * Disabled until a real private object-storage provider is connected.
 * Returning metadata here would falsely claim sensitive identity documents
 * were uploaded, so merchant onboarding must fail closed.
 */
export const storageAdapter = {
  connected: false as const,
  provider: "NOT_CONNECTED" as const,
  async put(_input: {
    key: string;
    contentType: string;
    bytes: Uint8Array;
  }): Promise<StoredObject> {
    throw new Error("Secure document storage is not configured. Contact OrderKing support; your document was not uploaded.");
  },
};
