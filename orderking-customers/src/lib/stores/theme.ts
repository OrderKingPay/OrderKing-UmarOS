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
      toggleTheme: () => set(() => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.backgroundColor = "#FFFFFF";
        }
        return { theme: "light" };
      }),
      setTheme: () => set(() => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.backgroundColor = "#FFFFFF";
        }
        return { theme: "light" };
      }),
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => () => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.backgroundColor = "#FFFFFF";
        }
      }
    }
  )
);
