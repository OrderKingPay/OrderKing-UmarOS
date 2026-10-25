
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}

export function publicOrderCode(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const buf = new Uint8Array(3);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 3; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  const rand = Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 4).toUpperCase();
  return `${prefix}-${y}${m}${day}-${rand}`;
}
