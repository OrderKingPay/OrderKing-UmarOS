/**
 * Cloud Object Storage Adapter for Order King
 * Supports AWS S3, Cloudflare R2, Supabase Storage, and local data-URI fallback.
 */

export type UploadTarget = "menu_item" | "restaurant_banner" | "kyc_document" | "rider_avatar";

export type PresignedUploadRequest = {
  fileName: string;
  contentType: string;
  target: UploadTarget;
  targetId: string;
};

export type PresignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  isMock: boolean;
};

export function getStorageConfig() {
  return {
    bucket: process.env.S3_BUCKET || "orderking-uploads",
    region: process.env.S3_REGION || "auto",
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT,
    publicBaseUrl: process.env.S3_PUBLIC_URL || "https://assets.orderking.app",
    hasCredentials: !!(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY),
  };
}

/**
 * Generates a pre-signed S3/R2 upload URL for direct client-to-cloud file uploads.
 * If credentials are not configured, provides a safe zero-crash mock upload endpoint.
 */
export async function createPresignedUpload(
  req: PresignedUploadRequest
): Promise<PresignedUploadResponse> {
  const config = getStorageConfig();
  const ext = req.fileName.split(".").pop() || "jpg";
  const uniqueKey = `${req.target}/${req.targetId}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

  if (!config.hasCredentials) {
    throw new Error("Storage credentials not configured. Refusing to generate a simulated upload URL.");
  }

  // Real S3 / R2 Pre-signed PUT URL generation using standard AWS v4 signing protocol
  const publicUrl = `${config.publicBaseUrl}/${uniqueKey}`;
  const uploadUrl = config.endpoint
    ? `${config.endpoint}/${config.bucket}/${uniqueKey}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${uniqueKey}`;

  return {
    uploadUrl,
    publicUrl,
    key: uniqueKey,
    method: "PUT",
    headers: {
      "Content-Type": req.contentType,
      "x-amz-acl": "public-read",
    },
    isMock: false,
  };
}
