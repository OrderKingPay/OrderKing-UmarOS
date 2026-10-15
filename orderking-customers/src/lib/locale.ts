
import type { Lang } from "./i18n";

export function localeFor(lang: Lang): string {
  if (lang === "bn") return "bn-IN";
  if (lang === "hi") return "hi-IN";
  if (lang === "gu") return "gu-IN";
  if (lang === "kn") return "kn-IN";
  if (lang === "ml") return "ml-IN";
  if (lang === "mr") return "mr-IN";
  if (lang === "pa") return "pa-IN";
  if (lang === "ta") return "ta-IN";
  if (lang === "te") return "te-IN";
  return "en-IN";
}

export function htmlLang(lang: Lang): string {
  return lang;
}
