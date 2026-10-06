import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () => set((state) => {
        const next = state.theme === "light" ? "dark" : "light";
        if (typeof document !== "undefined") {
          if (next === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
        return { theme: next };
      }),
      setTheme: (theme) => set(() => {
        if (typeof document !== "undefined") {
          if (theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
        return { theme };
      }),
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          if (state.theme === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
        }
      }
    }
  )
);
