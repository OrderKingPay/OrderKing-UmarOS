export function nid(): string {
  return crypto.randomUUID();
}

export function orderCode(): string {
  const buf = new Uint16Array(1);
  crypto.getRandomValues(buf);
  const n = 1000 + (buf[0] % 9000);
  return `RSH-${n}`;
}
