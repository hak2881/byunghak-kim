import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("contains the approved semantic sections and identity", () => {
  for (const token of [
    "Backend &amp; Cloud Engineer",
    'id="work"',
    'id="systems"',
    'id="engineering"',
    'id="about"',
    "gkr054@naver.com",
    "https://github.com/hak2881",
  ]) assert.match(html, new RegExp(token));
});

test("contains the verified backend evidence", () => {
  for (const metric of ["7,732", "283", "4,857", "11", "235K+", "1,067"])
    assert.match(html, new RegExp(metric.replace("+", "\\+")));
});

test("does not expose disallowed personal data or unsupported ownership", () => {
  assert.doesNotMatch(html, /01[016789][ -]?\d{3,4}[ -]?\d{4}/);
  assert.doesNotMatch(html, /생년월일|date of birth|고등학교|high school/i);
  assert.doesNotMatch(html, /스토어프론트(?:를| 전체를)? (?:설계|운영)|owned the entire storefront/i);
});

test("every translated element has Korean and English copy", () => {
  const nodes = [...html.matchAll(/<[^>]+data-i18n="[^"]+"[^>]*>/g)].map((m) => m[0]);
  assert.ok(nodes.length >= 30);
  for (const node of nodes) {
    assert.match(node, /data-ko="[^"]+"/);
    assert.match(node, /data-en="[^"]+"/);
  }
});

test("uses the specified public navigation and approved location", () => {
  assert.match(html, /<a href="#work"[^>]*data-en="Work"/);
  assert.match(html, /<a href="#engineering"[^>]*data-en="Engineering"/);
  assert.match(html, /<a href="#about"[^>]*data-en="About"/);
  assert.doesNotMatch(html, /<nav[\s\S]*?<a href="#systems"/);
  assert.match(html, /South Korea/);
});

test("translates visible role and stack labels", () => {
  for (const token of [
    'data-i18n="work.production.role"',
    'data-i18n="work.internship.role"',
    'data-i18n="stack.languages"',
    'data-i18n="stack.backend"',
    'data-i18n="stack.cloud"',
  ]) assert.match(html, new RegExp(token));
});
