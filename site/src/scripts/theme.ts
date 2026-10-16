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
  root.dataset.theme = theme;
  toggle?.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

// The inline script in the layout already set the theme before first paint.
apply(root.dataset.theme === "dark" ? "dark" : "light");

toggle?.addEventListener("click", () => {
  const next: Theme = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("theme", next);
  } catch {}
  apply(next);
});

// Follow the system until the visitor picks a theme.
system.addEventListener("change", () => {
  if (!stored()) apply(system.matches ? "dark" : "light");
});
