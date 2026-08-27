import assert from "node:assert/strict";
import test from "node:test";
import { applyLanguage, copyText, resolveLanguage } from "../app.js";

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
    querySelectorAll: () => [node],
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
