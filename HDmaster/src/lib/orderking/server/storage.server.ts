import { createHmac, randomBytes } from "node:crypto";

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

function sha256Hex(value: string): string {
  return createHmac("sha256", "").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function encodeQuery(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "%20");
}

function presignPutUrl(input: {
  endpoint: string;
  bucket: string;
  region: string;
  key: string;
  accessKey: string;
  secretKey: string;
  contentType: string;
  expiresSeconds?: number;
}) {
  const url = new URL(input.endpoint.replace(/\/$/, "") + "/" + input.bucket + "/" + input.key);
  const host = url.host;
  const region = input.region || "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").replace("Z", "Z");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const expires = Math.min(Math.max(input.expiresSeconds ?? 900, 1), 604800);

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${input.accessKey}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": "host",
  };

  const canonicalQuery = Object.keys(params)
    .sort()
    .map((key) => `${encodeQuery(key)}=${encodeQuery(params[key]!) }`)
    .join("&");
  const canonicalUri = encodePath(url.pathname);
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${input.secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  url.search = `${canonicalQuery}&X-Amz-Signature=${signature}`;
  return url.toString();
}

export function getStorageConfig() {
  return {
    bucket: process.env.S3_BUCKET || "orderking-uploads",
    region: process.env.S3_REGION || "auto",
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT || "",
    publicBaseUrl: process.env.S3_PUBLIC_URL || "",
    hasCredentials: !!(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY),
  };
}

/**
 * Generates a real AWS SigV4/R2-compatible pre-signed PUT URL.
 * Production never falls back to a fake URL or placeholder asset.
 */
export async function createPresignedUpload(
  req: PresignedUploadRequest,
): Promise<PresignedUploadResponse> {
  const config = getStorageConfig();
  if (!config.hasCredentials) {
    throw new Error("Storage credentials not configured. Refusing to generate a simulated upload URL.");
  }

  if (!config.publicBaseUrl) {
    throw new Error("S3_PUBLIC_URL is required so uploaded objects have a real public/cdn URL.");
  }

  const ext = req.fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const safeTargetId = req.targetId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueKey = `${req.target}/${safeTargetId}/${Date.now()}_${randomBytes(8).toString("hex")}.${ext}`;

  const endpoint =
    config.endpoint ||
    `https://${config.bucket}.s3.${config.region}.amazonaws.com`;

  const uploadUrl = presignPutUrl({
    endpoint,
    bucket: config.endpoint ? config.bucket : "",
    region: config.region,
    key: uniqueKey,
    accessKey: config.accessKey!,
    secretKey: config.secretKey!,
    contentType: req.contentType,
  });

  const publicUrl = `${config.publicBaseUrl.replace(/\/$/, "")}/${uniqueKey}`;

  return {
    uploadUrl,
    publicUrl,
    key: uniqueKey,
    method: "PUT",
    headers: { "Content-Type": req.contentType },
    isMock: false,
  };
}
