import { en, type MessageTree } from "./en";
import { bn } from "./bn";
import { as } from "./as";
import { hi } from "./hi";

export type Lang =
  | "en"
  | "hi"
  | "bn"
  | "as"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "mr"
  | "gu"
  | "pa"
  | "or";

export const LANGS: { id: Lang; name: string; native: string }[] = [
  { id: "en", name: "English", native: "English" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "as", name: "Assamese", native: "অসমীয়া" },
  { id: "ta", name: "Tamil", native: "தமிழ்" },
  { id: "te", name: "Telugu", native: "తెలుగు" },
  { id: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { id: "ml", name: "Malayalam", native: "മലയാളം" },
  { id: "mr", name: "Marathi", native: "मराठी" },
  { id: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { id: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { id: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
];

const trees: Partial<Record<Lang, MessageTree>> = { en, bn, as, hi };

export function isLang(value: string | null | undefined): value is Lang {
  return LANGS.some((l) => l.id === value);
}

type Nested = Record<string, unknown>;

function lookup(tree: Nested, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = tree;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Nested)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  lang: Lang,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const raw = lookup(trees[lang] as unknown as Nested, path) ?? lookup(trees.en as unknown as Nested, path) ?? path;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export { en, bn, as, hi };
