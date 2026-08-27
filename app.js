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

export function initializeResume(root, { storage, clipboard, print, navigate } = {}) {
  const storageKey = "resume-language";
  let language;
  try { language = resolveLanguage(storage?.getItem(storageKey)); }
  catch { language = "ko"; }
  applyLanguage(root, language);

  root.getElementById("language-toggle")?.addEventListener("click", () => {
    language = language === "ko" ? "en" : "ko";
    applyLanguage(root, language);
    try { storage?.setItem(storageKey, language); } catch {}
  });

  root.getElementById("print-button")?.addEventListener("click", () => print?.());

  const email = root.getElementById("email-link");
  email?.addEventListener("click", async (event) => {
    event.preventDefault();
    const copied = await copyText("gkr054@naver.com", clipboard);
    if (!copied) {
      navigate?.(email.href);
      return;
    }
    const status = root.getElementById("copy-status");
    if (status) status.textContent = language === "ko" ? "이메일 주소를 복사했습니다." : "Email address copied.";
  });
}

if (typeof document !== "undefined") {
  let storage;
  try { storage = localStorage; } catch {}
  initializeResume(document, {
    storage,
    clipboard: navigator.clipboard,
    print: () => window.print(),
    navigate: (url) => window.location.assign(url),
  });
}
