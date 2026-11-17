/**
 * OrderKing Fleet Device Health, Permissions & Sunlight Visibility Engine
 * Mandate: Operational parity with leading delivery partner platforms.
 */

export interface PermissionStatusSummary {
  location: "granted" | "denied" | "prompt" | "unsupported";
  camera: "granted" | "denied" | "prompt" | "unsupported";
  audio: "ready" | "suspended" | "unsupported";
  notifications: "granted" | "denied" | "default" | "unsupported";
  batteryLevelPct: number | null;
  batteryCharging: boolean | null;
  batterySufficient: boolean; // >= 15%
  isOptimizedForOutdoor: boolean;
}

export const MIN_DUTY_BATTERY_PCT = 15;
export const WARN_DUTY_BATTERY_PCT = 20;

/**
 * Checks all statutory device permissions required for active field delivery:
 * 1. Location (Foreground & Background High-Accuracy GPS)
 * 2. Camera (Pre-shift selfie & Doorstep Photo Proof of Delivery)
 * 3. Audio (AudioContext Klaxon siren for incoming dispatch offers)
 * 4. Notifications (High-priority dispatch banners)
 * 5. Battery State (>=15% threshold for duty)
 */
export async function checkDevicePermissionHealth(): Promise<PermissionStatusSummary> {
  const result: PermissionStatusSummary = {
    location: "unsupported",
    camera: "unsupported",
    audio: "unsupported",
    notifications: "unsupported",
    batteryLevelPct: null,
    batteryCharging: null,
    batterySufficient: true,
    isOptimizedForOutdoor: false,
  };

  if (typeof window === "undefined") return result;

  // 1. Geolocation permission check
  if ("permissions" in navigator && navigator.permissions?.query) {
    try {
      const geoPerm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      result.location = geoPerm.state;
    } catch {
      result.location = "geolocation" in navigator ? "prompt" : "unsupported";
    }

    try {
      const camPerm = await navigator.permissions.query({ name: "camera" as PermissionName });
      result.camera = camPerm.state;
    } catch {
      result.camera = "mediaDevices" in navigator ? "prompt" : "unsupported";
    }
  } else {
    result.location = "geolocation" in navigator ? "prompt" : "unsupported";
    result.camera = "mediaDevices" in navigator ? "prompt" : "unsupported";
  }

  // 2. Audio context readiness
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      result.audio = "ready";
    }
  } catch {
    result.audio = "unsupported";
  }

  // 3. Notification permission check
  if ("Notification" in window) {
    result.notifications = Notification.permission;
  }

  // 4. Device Battery check
  if ("getBattery" in navigator && typeof (navigator as any).getBattery === "function") {
    try {
      const battery = await (navigator as any).getBattery();
      if (battery && typeof battery.level === "number") {
        const pct = Math.round(battery.level * 100);
        result.batteryLevelPct = pct;
        result.batteryCharging = Boolean(battery.charging);
        result.batterySufficient = pct >= MIN_DUTY_BATTERY_PCT || Boolean(battery.charging);
      }
    } catch {
      // Ignore battery query failures
    }
  }

  // 5. Check if sunlight mode is active in document element
  result.isOptimizedForOutdoor = document.documentElement.classList.contains("sunlight-mode");

  return result;
}

/**
 * Toggles high-contrast sunlight mode for outdoor daytime visibility.
 * Injects high-contrast styles and persists preference in localStorage.
 */
export function toggleSunlightMode(forceState?: boolean): boolean {
  if (typeof document === "undefined") return false;

  const current = document.documentElement.classList.contains("sunlight-mode");
  const next = forceState !== undefined ? forceState : !current;

  if (next) {
    document.documentElement.classList.add("sunlight-mode");
    try {
      localStorage.setItem("ok_rider_sunlight_mode", "true");
    } catch {}
  } else {
    document.documentElement.classList.remove("sunlight-mode");
    try {
      localStorage.removeItem("ok_rider_sunlight_mode");
    } catch {}
  }

  return next;
}

/**
 * Validates battery state before switching to ONLINE duty.
 * Hard-blocks online duty if battery < 15% (unless charging).
 * Issues warning if battery < 20%.
 */
export function evaluateDutyBatteryGate(battery?: {
  level?: number | null;
  charging?: boolean | null;
} | null): { allowed: boolean; warn: boolean; levelPct: number; reason?: string } {
  if (!battery || typeof battery.level !== "number") {
    return { allowed: true, warn: false, levelPct: 100 };
  }

  const rawLevel = battery.level <= 1.0 ? battery.level * 100 : battery.level;
  const levelPct = Math.round(rawLevel);
  const isCharging = Boolean(battery.charging);

  if (levelPct < MIN_DUTY_BATTERY_PCT && !isCharging) {
    return {
      allowed: false,
      warn: true,
      levelPct,
      reason: `Battery level critically low (${levelPct}%). Minimum ${MIN_DUTY_BATTERY_PCT}% battery required to switch Online and receive orders.`,
    };
  }

  if (levelPct < WARN_DUTY_BATTERY_PCT && !isCharging) {
    return {
      allowed: true,
      warn: true,
      levelPct,
      reason: `Low battery warning (${levelPct}%). Please connect your mobile charger to avoid mid-shift interruption.`,
    };
  }

  return { allowed: true, warn: false, levelPct };
}
