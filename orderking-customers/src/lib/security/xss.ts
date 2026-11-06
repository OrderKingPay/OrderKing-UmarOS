const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Strict HTML entity escaping for user strings stored in database or rendered in UI.
 */
export function escapeHtml(str: unknown): string {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPES[char] || char);
}

/**
 * Sanitizes plain text input by stripping control characters and trimming length.
 */
export function sanitizePlainText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "") // strip control characters
    .trim()
    .slice(0, maxLength);
}
