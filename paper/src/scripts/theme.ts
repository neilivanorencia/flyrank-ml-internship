/**
 * Runs the theme toggle buttons, which switch between the light and dark themes and remember the choice.
 * `theme-init.js` applies a stored choice before first paint, and this script handles clicks after that.
 */

/** The two themes a visitor can choose. */
type Theme = "dark" | "light";

/** The `localStorage` key that holds the visitor's choice, which `theme-init.js` reads on the next visit. */
const STORAGE_KEY = "theme";
/** The page root, where the chosen theme is written as `data-theme`. */
const root = document.documentElement;
/** The system dark mode setting, used until the visitor picks a theme. */
const systemDark = globalThis.matchMedia("(prefers-color-scheme: dark)");
/** Every toggle button on the page. */
const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]");

/**
 * Finds the theme the page is showing now.
 * @returns The stored choice when there is one, and otherwise the system setting.
 */
const currentTheme = (): Theme => {
  const chosen = root.dataset.theme;
  // A choice written to the root takes priority over the system setting.
  if (chosen === "dark" || chosen === "light") {
    return chosen;
  }
  // With no choice the page follows the system.
  if (systemDark.matches) {
    return "dark";
  }
  return "light";
};

/**
 * Finds the other theme.
 * @param theme - The theme to flip.
 * @returns `light` for `dark` and `dark` for `light`.
 */
const oppositeOf = (theme: Theme): Theme => {
  if (theme === "dark") {
    return "light";
  }
  return "dark";
};

/** Updates every button so its `data-active-theme` and pressed state match the theme on screen. */
const syncButtons = (): void => {
  const theme = currentTheme();
  for (const button of buttons) {
    button.dataset.activeTheme = theme;
    button.setAttribute("aria-pressed", String(theme === "dark"));
  }
};

/**
 * Remembers the visitor's choice for their next visit.
 * @param theme - The theme to store.
 */
const storeTheme = (theme: Theme): void => {
  // Storage can be blocked, and the choice then simply lasts until the page closes.
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
};

for (const button of buttons) {
  button.addEventListener("click", () => {
    const next = oppositeOf(currentTheme());
    root.dataset.theme = next;
    storeTheme(next);
    syncButtons();
  });
}

// Follows a change of the system setting, which matters only while the visitor has made no choice.
systemDark.addEventListener("change", syncButtons);
syncButtons();
