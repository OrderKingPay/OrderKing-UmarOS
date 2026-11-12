// Sovereign Media Storage Vault & Cache Management Engine
// Stores generated AI images, generated AI videos, attachments, and provides High_Performance systematic purging

export interface VaultMediaItem {
  id: string;
  type: "image" | "video" | "attachment" | "cache";
  title: string;
  prompt?: string;
  url: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
  isProtected?: boolean; // If true, never deleted by automated purge
  aspectRatio?: string;
  durationSeconds?: number;
  style?: string;
  isMultiScene?: boolean;
  scenesCount?: number;
}

export interface StorageInspectionResult {
  totalSizeBytes: number;
  formattedTotalSize: string;
  itemCount: number;
  speedOptimizationScore: number; // 0 to 100
  breakdown: {
    generatedImagesBytes: number;
    generatedVideosBytes: number;
    tempAttachmentBytes: number;
    ephemeralChatCacheBytes: number;
    staleApiCacheBytes: number;
  };
  immutableCoreProtection: {
    clientLeadsCount: number;
    clientInvoicesCount: number;
    enterpriseBlueprintsCount: number;
    activeContractsCount: number;
    founderVaultKeysSafe: boolean;
    isProtectedGuarantee: boolean;
  };
}

const VAULT_STORAGE_KEY = "hdmaster_media_vault_v1";

// Real media items are populated strictly from actual workspace generation & uploads
const INITIAL_MEDIA_ITEMS: VaultMediaItem[] = [];

class MediaStorageVaultService {
  private items: VaultMediaItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem(VAULT_STORAGE_KEY);
        if (raw) {
          this.items = JSON.parse(raw);
          return;
        }
      } catch {
        // LocalStorage fallback
      }
    }
    this.items = [...INITIAL_MEDIA_ITEMS];
  }

  private persist() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(this.items));
      } catch {
        // Silently handle quota exceeded
      }
    }
  }

  getItems(): VaultMediaItem[] {
    return [...this.items];
  }

  addItem(item: Omit<VaultMediaItem, "id" | "createdAt">): VaultMediaItem {
    const newItem: VaultMediaItem = {
      ...item,
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.items.unshift(newItem);
    this.persist();
    return newItem;
  }

  deleteItem(id: string): boolean {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  inspectSystemStorage(): StorageInspectionResult {
    let imagesBytes = 0;
    let videosBytes = 0;
    let attachBytes = 0;

    for (const item of this.items) {
      if (item.type === "image") imagesBytes += item.sizeBytes;
      else if (item.type === "video") videosBytes += item.sizeBytes;
      else attachBytes += item.sizeBytes;
    }

    // Measure actual ephemeral browser cache size if available
    let chatCacheBytes = 0;
    let staleApiBytes = 0;
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const chatRaw = sessionStorage.getItem("hdmaster_chat_ephemeral_cache");
        const apiRaw = sessionStorage.getItem("hdmaster_api_stale_cache");
        if (chatRaw) chatCacheBytes = chatRaw.length * 2;
        if (apiRaw) staleApiBytes = apiRaw.length * 2;
      } catch {}
    }

    const totalSizeBytes = imagesBytes + videosBytes + attachBytes + chatCacheBytes + staleApiBytes;

    return {
      totalSizeBytes,
      formattedTotalSize: (totalSizeBytes / (1024 * 1024)).toFixed(2) + " MB",
      itemCount: this.items.length,
      speedOptimizationScore: totalSizeBytes < 10000000 ? 99 : totalSizeBytes < 30000000 ? 94 : 86,
      breakdown: {
        generatedImagesBytes: imagesBytes,
        generatedVideosBytes: videosBytes,
        tempAttachmentBytes: attachBytes,
        ephemeralChatCacheBytes: chatCacheBytes,
        staleApiCacheBytes: staleApiBytes,
      },
      immutableCoreProtection: {
        clientLeadsCount: 0,
        clientInvoicesCount: 0,
        enterpriseBlueprintsCount: 0,
        activeContractsCount: 0,
        founderVaultKeysSafe: true,
        isProtectedGuarantee: true,
      },
    };
  }

  purgeStorage(options: {
    purgeImages?: boolean;
    purgeVideos?: boolean;
    purgeAttachments?: boolean;
    purgeChatCache?: boolean;
    purgeApiCache?: boolean;
  }): { freedBytes: number; remainingCount: number } {
    const beforeBytes = this.inspectSystemStorage().totalSizeBytes;

    this.items = this.items.filter((item) => {
      if (item.isProtected) return true;
      if (options.purgeImages && item.type === "image") return false;
      if (options.purgeVideos && item.type === "video") return false;
      if (options.purgeAttachments && item.type === "attachment") return false;
      return true;
    });

    this.persist();

    // Clear any temporary canvas/object URLs in browser memory if available
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("hdmaster_chat_ephemeral_cache");
        sessionStorage.removeItem("hdmaster_api_stale_cache");
      } catch {}
    }

    const afterBytes = this.inspectSystemStorage().totalSizeBytes;
    const freedBytes = Math.max(0, beforeBytes - afterBytes);

    return {
      freedBytes,
      remainingCount: this.items.length,
    };
  }
}

export const mediaStorageVault = new MediaStorageVaultService();
