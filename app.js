export function resolveLanguage(stored) {
  return stored === "en" ? "en" : "ko";
}

export function applyLanguage(root, language) {
  root.documentElement.lang = language;
  for (const node of root.querySelectorAll("[data-i18n]")) {
    node.textContent = node.dataset[language];
  }
  const toggle = root.getElementById("language-toggle");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(language === "en"));
    toggle.setAttribute("aria-label", language === "ko" ? "Switch to English" : "한국어로 전환");
  }
}

export async function copyText(text, clipboard) {
  if (!clipboard?.writeText) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

if (typeof document !== "undefined") {
  const storageKey = "resume-language";
  let language;
  try { language = resolveLanguage(localStorage.getItem(storageKey)); }
  catch { language = "ko"; }
  applyLanguage(document, language);

  document.getElementById("language-toggle")?.addEventListener("click", () => {
    language = language === "ko" ? "en" : "ko";
    applyLanguage(document, language);
    try { localStorage.setItem(storageKey, language); } catch {}
  });

  document.getElementById("print-button")?.addEventListener("click", () => window.print());

  document.getElementById("email-link")?.addEventListener("click", async (event) => {
    const copied = await copyText("gkr054@naver.com", navigator.clipboard);
    if (!copied) return;
    event.preventDefault();
    const status = document.getElementById("copy-status");
    if (status) status.textContent = language === "ko" ? "이메일 주소를 복사했습니다." : "Email address copied.";
  });
}
