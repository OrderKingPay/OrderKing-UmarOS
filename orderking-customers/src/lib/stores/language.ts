
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "../i18n";
import { isLang } from "../i18n";

type LanguageState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang: isLang(lang) ? lang : "en" }),
    }),
    { name: "ok-language" }
  )
);
