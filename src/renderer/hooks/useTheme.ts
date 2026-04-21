import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type ThemePreference = "system" | "light" | "dark";

const THEME_QUERY_KEY = ["settings", "theme"] as const;
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const DARK_CLASS = "dark";

const resolveIsDark = (theme: ThemePreference): boolean => {
  if (theme === "dark") {
    return true;
  }
  if (theme === "light") {
    return false;
  }
  return window.matchMedia(SYSTEM_THEME_QUERY).matches;
};

const applyThemeClass = (theme: ThemePreference): void => {
  const isDark = resolveIsDark(theme);
  document.documentElement.classList.toggle(DARK_CLASS, isDark);
};

export const useTheme = () => {
  const queryClient = useQueryClient();

  const { data: theme = "system" } = useQuery<ThemePreference>({
    queryKey: THEME_QUERY_KEY,
    queryFn: async () => {
      const settings = await window.api.getSettings();
      return settings?.theme ?? "system";
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    applyThemeClass(theme);

    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const handleChange = () => {
      applyThemeClass("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const mutation = useMutation({
    mutationFn: async (nextTheme: ThemePreference) => {
      await window.api.saveTheme(nextTheme);
      return nextTheme;
    },
    onSuccess: (nextTheme) => {
      queryClient.setQueryData(THEME_QUERY_KEY, nextTheme);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    theme,
    setTheme: (nextTheme: ThemePreference) => mutation.mutate(nextTheme),
    isSaving: mutation.isPending,
  };
};
