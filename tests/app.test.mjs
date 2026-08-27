import assert from "node:assert/strict";
import test from "node:test";
import { applyLanguage, copyText, initializeResume, resolveLanguage } from "../app.js";

function createElement({ dataset = {}, textContent = "", href = "" } = {}) {
  const listeners = new Map();
  return {
    dataset,
    textContent,
    href,
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { listeners.set(name, listener); },
    async trigger(name, event = { preventDefault() { this.defaultPrevented = true; } }) {
      await listeners.get(name)(event);
      return event;
    },
  };
}

function createRoot() {
  const translated = createElement({ dataset: { ko: "기술", en: "Engineering" }, textContent: "기술" });
  const navigation = createElement({
    dataset: { ariaLabelKo: "주요 메뉴", ariaLabelEn: "Primary navigation" },
    textContent: "경력 기술 소개",
  });
  const evidence = createElement({
    dataset: { ariaLabelKo: "대표 성과", ariaLabelEn: "Key outcomes" },
    textContent: "7,732ms → 283ms",
  });
  const nodes = {
    "language-toggle": createElement(),
    "print-button": createElement(),
    "email-link": createElement({ href: "mailto:gkr054@naver.com" }),
    "copy-status": createElement(),
  };
  return {
    documentElement: { lang: "ko" },
    querySelectorAll: (selector) => selector === "[data-i18n]" ? [translated] : [navigation, evidence],
    getElementById: (id) => nodes[id] ?? null,
    translated,
    landmarks: { navigation, evidence },
    nodes,
  };
}

test("resolves only an explicitly saved English choice", () => {
  assert.equal(resolveLanguage("en"), "en");
  assert.equal(resolveLanguage("ko"), "ko");
  assert.equal(resolveLanguage(null), "ko");
  assert.equal(resolveLanguage("unexpected"), "ko");
});

test("applies translated text and document language", () => {
  const node = { dataset: { ko: "기술", en: "Engineering" }, textContent: "기술" };
  const root = {
    documentElement: { lang: "ko" },
    querySelectorAll: (selector) => selector === "[data-i18n]" ? [node] : [],
    getElementById: () => null,
  };
  applyLanguage(root, "en");
  assert.equal(root.documentElement.lang, "en");
  assert.equal(node.textContent, "Engineering");
});

test("copyText reports clipboard success and failure", async () => {
  assert.equal(await copyText("x", { writeText: async () => {} }), true);
  assert.equal(await copyText("x", { writeText: async () => { throw new Error("blocked"); } }), false);
  assert.equal(await copyText("x", undefined), false);
});

test("initializes with Korean when storage is blocked", () => {
  const root = createRoot();
  initializeResume(root, { storage: { getItem() { throw new Error("blocked"); } } });
  assert.equal(root.documentElement.lang, "ko");
  assert.equal(root.translated.textContent, "기술");
});

test("toggle updates copy, ARIA state, and persisted language", async () => {
  const root = createRoot();
  const saved = [];
  initializeResume(root, { storage: { getItem: () => null, setItem: (...args) => saved.push(args) } });
  await root.nodes["language-toggle"].trigger("click");
  assert.equal(root.documentElement.lang, "en");
  assert.equal(root.translated.textContent, "Engineering");
  assert.equal(root.nodes["language-toggle"].attributes["aria-pressed"], "true");
  assert.equal(root.nodes["language-toggle"].attributes["aria-label"], "한국어로 전환");
  assert.deepEqual(saved, [["resume-language", "en"]]);
});

test("toggle translates landmark labels without replacing their child content", async () => {
  const root = createRoot();
  initializeResume(root, { storage: { getItem: () => null } });

  await root.nodes["language-toggle"].trigger("click");

  assert.equal(root.landmarks.navigation.attributes["aria-label"], "Primary navigation");
  assert.equal(root.landmarks.evidence.attributes["aria-label"], "Key outcomes");
  assert.equal(root.landmarks.navigation.textContent, "경력 기술 소개");
  assert.equal(root.landmarks.evidence.textContent, "7,732ms → 283ms");
});

test("print control calls the injected print boundary", async () => {
  const root = createRoot();
  let calls = 0;
  initializeResume(root, { print: () => { calls++; } });
  await root.nodes["print-button"].trigger("click");
  assert.equal(calls, 1);
});

test("email cancels navigation before clipboard success and announces copy", async () => {
  const root = createRoot();
  let finishCopy;
  const navigations = [];
  initializeResume(root, {
    clipboard: { writeText: () => new Promise((resolve) => { finishCopy = resolve; }) },
    navigate: (url) => navigations.push(url),
  });
  const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  const pending = root.nodes["email-link"].trigger("click", event);
  assert.equal(event.defaultPrevented, true);
  finishCopy();
  await pending;
  assert.equal(root.nodes["copy-status"].textContent, "이메일 주소를 복사했습니다.");
  assert.deepEqual(navigations, []);
});

test("email explicitly navigates to mailto when copying fails", async () => {
  const root = createRoot();
  const navigations = [];
  initializeResume(root, {
    clipboard: { writeText: async () => { throw new Error("blocked"); } },
    navigate: (url) => navigations.push(url),
  });
  const event = await root.nodes["email-link"].trigger("click");
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(navigations, ["mailto:gkr054@naver.com"]);
});

test("email explicitly navigates to mailto when clipboard is absent", async () => {
  const root = createRoot();
  const navigations = [];
  initializeResume(root, { navigate: (url) => navigations.push(url) });
  await root.nodes["email-link"].trigger("click");
  assert.deepEqual(navigations, ["mailto:gkr054@naver.com"]);
});
