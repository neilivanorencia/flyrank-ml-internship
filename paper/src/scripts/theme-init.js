{
  const root = document.documentElement;
  root.classList.add("js");
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      root.dataset.theme = stored;
    }
  } catch {}
}
