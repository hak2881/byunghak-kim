import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const favicon = await readFile(new URL("../favicon.svg", import.meta.url), "utf8");

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

test("translates the hero role and current-role period", () => {
  assert.match(html, /<p class="eyebrow" data-i18n="hero\.role" data-ko="백엔드 &amp; 클라우드 엔지니어" data-en="Backend &amp; Cloud Engineer">백엔드 &amp; 클라우드 엔지니어<\/p>/);
  assert.match(html, /<p class="period" data-i18n="work\.production\.period" data-ko="2025\.11 — 현재 · NDA" data-en="2025\.11 — Present · NDA">2025\.11 — 현재 · NDA<\/p>/);
});

test("implements focus, responsive, reduced-motion, and print contracts", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /\.skip-link/);
  assert.match(css, /\.sr-only/);
});

test("publishes canonical social metadata", () => {
  assert.match(html, /rel="canonical" href="https:\/\/byunghak-kim\.vercel\.app\/"/);
  assert.match(html, /property="og:image" content="https:\/\/byunghak-kim\.vercel\.app\/og\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
});

test("publishes crawl and security contracts", () => {
  assert.match(robots, /Allow: \/\s/);
  assert.match(sitemap, /https:\/\/byunghak-kim\.vercel\.app\//);
  assert.ok(vercel.headers.some((entry) => entry.source === "/(.*)"));
});

test("links a local privacy-safe SVG favicon", () => {
  assert.match(html, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml">/);
  assert.match(favicon, /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});
