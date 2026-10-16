type Theme = "light" | "dark";

const root = document.documentElement;
const toggle = document.getElementById("theme-toggle");
const system = window.matchMedia("(prefers-color-scheme: dark)");

function stored(): string | null {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  root.dataset.mode = theme;
  toggle?.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

// The inline script in the layout already set the theme before first paint.
apply(root.dataset.mode === "dark" ? "dark" : "light");

toggle?.addEventListener("click", () => {
  const next: Theme = root.dataset.mode === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("theme", next);
  } catch {}
  apply(next);
});

// Dark text tokens would print light-on-white once the browser drops backgrounds, so paper is always light.
let screenTheme: Theme | null = null;
window.addEventListener("beforeprint", () => {
  screenTheme = root.dataset.mode === "dark" ? "dark" : "light";
  root.dataset.mode = "light";
});
window.addEventListener("afterprint", () => {
  if (screenTheme) root.dataset.mode = screenTheme;
  screenTheme = null;
});

// Follow the system until the visitor picks a theme.
system.addEventListener("change", () => {
  if (!stored()) apply(system.matches ? "dark" : "light");
});
