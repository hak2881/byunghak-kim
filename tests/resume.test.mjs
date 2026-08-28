import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

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
  for (const metric of ["7,732ms → 283ms", "4,857ms → 11ms", "1,569ms → 2ms", "235,848", "0.04%", "1,067"])
    assert.ok(html.includes(metric), `missing exact metric: ${metric}`);
});

test("does not expose disallowed personal data or unsupported ownership", () => {
  assert.doesNotMatch(html, /01[016789][ -]?\d{3,4}[ -]?\d{4}/);
  assert.doesNotMatch(html, /생년월일|date of birth|고등학교|high school|나이|\bage\b|사진|\bphoto\b/i);
  assert.doesNotMatch(html, /젠테|gente|슬랙|slack|private repo|비공개 저장소/i);
  assert.doesNotMatch(html, /arn:aws|amazonaws\.com|\b\d{12}\b|\b(?:\d{1,3}\.){3}\d{1,3}\b/i);
  const approvedStorefrontKo = "호스팅형 스토어프론트의 구조와 API 데이터 흐름을 이해하고, 짧은 기간 필터 상태와 API 연동 수정을 지원했습니다.";
  const approvedStorefrontEn = "Understood the hosted storefront structure and API data flow, providing short-term support for filter state and API integration changes.";
  assert.ok(html.includes(approvedStorefrontKo));
  assert.ok(html.includes(approvedStorefrontEn));
  assert.doesNotMatch(
    html
      .replaceAll(approvedStorefrontKo, "")
      .replaceAll(approvedStorefrontEn, "")
      .replaceAll("system.commerce.storefront", ""),
    /스토어프론트|storefront/i,
  );

  const externalUrls = [...html.matchAll(/https:\/\/[^"'\s<]+/g)].map((match) => match[0]);
  const approvedUrls = new Set([
    "https://byunghak-kim.vercel.app/",
    "https://byunghak-kim.vercel.app/og.png",
    "https://github.com/hak2881",
    "https://github.com/hak2881/reliable-backend-patterns",
    "https://github.com/hak2881/commerce-backend-msa",
    "https://github.com/hak2881/loyalty-ledger-systems",
    "https://github.com/hak2881/erp-integration-patterns",
    "https://github.com/hak2881/ai-experience-platform",
    "https://github.com/hak2881/aws-production-operations",
  ]);
  assert.ok(externalUrls.length > 0);
  for (const url of externalUrls) {
    assert.ok(approvedUrls.has(url), `unapproved public URL: ${url}`);
  }
});

test("every translated element has Korean and English copy", () => {
  const nodes = [...html.matchAll(/<[^>]+data-i18n="[^"]+"[^>]*>/g)].map((m) => m[0]);
  assert.ok(nodes.length >= 65);
  for (const node of nodes) {
    assert.match(node, /data-ko="[^"]+"/);
    assert.match(node, /data-en="[^"]+"/);
  }

  const keys = new Set(nodes.map((node) => node.match(/data-i18n="([^"]+)"/)?.[1]));
  for (const key of [
    "work.production.search",
    "work.production.backfill",
    "work.production.reliability",
    "work.production.operations",
    "work.internship.pipeline",
    "work.internship.validation",
    "work.internship.reporting",
    "work.internship.period",
    "systems.intro",
    "system.commerce.model",
    "system.commerce.results",
    "system.commerce.cache",
    "system.commerce.storefront",
    "system.ledger.integer",
    "system.ledger.idempotency",
    "system.ledger.outbox",
    "system.ai.capture",
    "system.ai.queue",
    "system.ai.delivery",
    "system.erp.orders",
    "system.erp.freight",
    "system.erp.recovery",
    "public.intro",
    "public.patterns",
    "public.commerce",
    "public.ledger",
    "public.erp",
    "public.ai",
    "public.aws",
    "stack.reliability",
    "stack.integration",
  ]) assert.ok(keys.has(key), `missing translation key: ${key}`);
});

test("shows detailed contributions for both experience entries", () => {
  const work = html.match(/<section id="work"[\s\S]*?<\/section>/)?.[0] ?? "";
  const timeline = work.match(/<div class="timeline">([\s\S]*?)<\/div>/)?.[0] ?? "";
  assert.equal([...timeline.matchAll(/<article class="timeline-item">/g)].length, 2);
  assert.equal([...html.matchAll(/<ul class="achievement-list">/g)].length, 2);
  assert.ok([...html.matchAll(/<ul class="achievement-list">[\s\S]*?<\/ul>/g)]
    .every((match) => [...match[0].matchAll(/<li /g)].length >= 3));
});

test("shows the approved employer context in both languages", () => {
  const work = html.match(/<section id="work"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(work, /data-ko="Lukuku · 백엔드 &amp; 클라우드 엔지니어"/);
  assert.match(work, /data-en="Lukuku · Backend &amp; Cloud Engineer"/);
  assert.match(work, /data-ko="Logblack · AI 엔지니어 인턴"/);
  assert.match(work, /data-en="Logblack · AI Engineering Intern"/);
  assert.match(work, /data-ko="2025\.11 — 현재" data-en="2025\.11 — Present"/);
  assert.match(work, /data-ko="2025\.05 — 2025\.08 · 3개월" data-en="2025\.05 — 2025\.08 · 3 months"/);
  assert.doesNotMatch(work, /NDA/);
  assert.match(html, /data-ko="고객사와 내부 식별정보는 NDA와 개인정보 보호를 위해 제외했습니다\."/);
  assert.match(html, /data-en="Client and internal identifiers are omitted for NDA and privacy reasons\."/);
});

test("explains every selected system with details and technologies", () => {
  for (const id of ["commerce-backend", "ledger-platform", "ai-platform", "erp-integration"]) {
    const card = html.match(new RegExp(`<article class="system-card" id="${id}">([\\s\\S]*?)<\\/article>`))?.[0] ?? "";
    assert.match(card, /class="system-details"/);
    assert.ok([...card.matchAll(/<li /g)].length >= 3);
    assert.match(card, /class="tag-list"/);
  }
});

test("links the expanded public engineering case studies", () => {
  for (const repository of [
    "reliable-backend-patterns",
    "commerce-backend-msa",
    "loyalty-ledger-systems",
    "erp-integration-patterns",
    "ai-experience-platform",
    "aws-production-operations",
  ]) assert.match(html, new RegExp(`https://github\\.com/hak2881/${repository}`));
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
  assert.match(html, /<p class="period" data-i18n="work\.production\.period" data-ko="2025\.11 — 현재" data-en="2025\.11 — Present">2025\.11 — 현재<\/p>/);
});

test("implements focus, responsive, reduced-motion, and print contracts", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /\.skip-link/);
  assert.match(css, /\.sr-only/);
});

test("styles detailed content for reading and compact printing", () => {
  for (const selector of [
    "achievement-list",
    "system-details",
    "tag-list",
    "public-grid",
    "public-card",
    "section-intro",
  ]) {
    assert.match(css, new RegExp(`\\.${selector}\\s*\\{`));
  }

  assert.match(
    css,
    /\.public-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/s,
  );
  assert.match(css, /\.tag-list\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/s);

  const printRules = css.slice(css.indexOf("@media print"));
  assert.match(printRules, /body\s*\{[^}]*font-size:\s*8\.5pt/s);
  assert.match(
    printRules,
    /\.public-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/s,
  );
});

test("keeps the sole visible identity in print while hiding header controls", () => {
  assert.match(html, /<header class="site-header">[\s\S]*?<a class="identity"[^>]*>김병학[\s\S]*?BYUNGHAK KIM<\/a>/);
  const printRules = css.slice(css.indexOf("@media print"));
  const siteHeaderRule = [...printRules.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find(([, selectors]) => selectors.split(",").map((selector) => selector.trim()).includes(".site-header"));
  assert.ok(siteHeaderRule);
  assert.doesNotMatch(siteHeaderRule[2], /display:\s*none/);
  assert.match(printRules, /\.site-header\s+nav[^{}]*\{[^}]*display:\s*none\s*!important/);
  assert.match(printRules, /\.header-actions[^{}]*\{[^}]*display:\s*none\s*!important/);
});

test("provides paired landmark labels for Korean and English", () => {
  assert.match(html, /<nav[^>]*data-aria-label-ko="주요 메뉴"[^>]*data-aria-label-en="Primary navigation"/);
  assert.match(html, /<section class="evidence"[^>]*data-aria-label-ko="대표 성과"[^>]*data-aria-label-en="Key outcomes"/);
});

test("footer repeats the approved contact links with the privacy notice", () => {
  const footer = html.match(/<footer>[\s\S]*?<\/footer>/)?.[0] ?? "";
  assert.match(footer, /href="mailto:gkr054@naver\.com"[^>]*>gkr054@naver\.com<\/a>/);
  assert.match(footer, /href="https:\/\/github\.com\/hak2881"[^>]*>github\.com\/hak2881<\/a>/);
  assert.match(footer, /data-i18n="footer\.nda"/);
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

test("renders the approved compact bilingual layout", {
  skip: process.env.PRINT_AUDIT !== "1",
}, async () => {
  const root = new URL("..", import.meta.url);
  const assets = new Map([
    ["/", ["index.html", "text/html; charset=utf-8"]],
    ["/index.html", ["index.html", "text/html; charset=utf-8"]],
    ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
    ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
    ["/favicon.svg", ["favicon.svg", "image/svg+xml"]],
  ]);
  const server = createServer(async (request, response) => {
    const asset = assets.get(new URL(request.url, "http://127.0.0.1").pathname);
    if (!asset) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": asset[1] });
    response.end(await readFile(new URL(asset[0], root)));
  });
  const globalModules = execFileSync("npm", ["root", "--global"], { encoding: "utf8" }).trim();
  const playwrightPath = join(globalModules, "@playwright/cli/node_modules/playwright-core/index.mjs");
  const { chromium } = await import(pathToFileURL(playwrightPath));
  let auditDirectory;
  let browser;

  try {
    auditDirectory = await mkdtemp(join(tmpdir(), "resume-print-audit-"));
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const pdfPath = (language) => join(auditDirectory, `resume-${language}.pdf`);
    const pageCount = (path) => Number(
      execFileSync("pdfinfo", [path], { encoding: "utf8" }).match(/^Pages:\s+(\d+)/m)?.[1],
    );
    const { port } = server.address();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}`);

    await page.setViewportSize({ width: 1440, height: 900 });
    const desktop = await page.evaluate(() => ({
      titleFont: Number.parseFloat(getComputedStyle(document.querySelector("#hero-title")).fontSize),
      evidenceTop: Math.round(document.querySelector(".evidence").getBoundingClientRect().top),
      workTop: Math.round(document.querySelector("#work").getBoundingClientRect().top),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    assert.ok(desktop.titleFont <= 68, `desktop title is ${desktop.titleFont}px`);
    assert.ok(desktop.evidenceTop <= 520, `desktop evidence starts at ${desktop.evidenceTop}px`);
    assert.ok(desktop.workTop <= 700, `desktop work starts at ${desktop.workTop}px`);
    assert.equal(desktop.overflow, false);

    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.evaluate(() => ({
      titleFont: Number.parseFloat(getComputedStyle(document.querySelector("#hero-title")).fontSize),
      titleLines: (() => {
        const text = document.querySelector("#hero-title").firstChild;
        const lines = [];
        for (let index = 0; index < text.length; index += 1) {
          const range = document.createRange();
          range.setStart(text, index);
          range.setEnd(text, index + 1);
          const top = Math.round(range.getBoundingClientRect().top);
          const line = lines.find((entry) => entry.top === top);
          if (line) line.text += text.textContent[index];
          else lines.push({ top, text: text.textContent[index] });
        }
        return lines.map((line) => line.text.trim());
      })(),
      evidenceTop: Math.round(document.querySelector(".evidence").getBoundingClientRect().top),
      metricLines: [...document.querySelectorAll(".evidence strong")].map((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects().length;
      }),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    assert.ok(mobile.titleFont <= 36, `mobile title is ${mobile.titleFont}px`);
    assert.equal(
      mobile.titleLines.some((line) => line.endsWith("백") || line.startsWith("엔드")),
      false,
      `awkward Korean title wrap: ${mobile.titleLines.join(" / ")}`,
    );
    assert.ok(mobile.evidenceTop <= 520, `mobile evidence starts at ${mobile.evidenceTop}px`);
    assert.deepEqual(mobile.metricLines, [1, 1, 1, 1]);
    assert.equal(mobile.overflow, false);

    await page.pdf({ path: pdfPath("ko"), preferCSSPageSize: true, printBackground: true });
    await page.locator("#language-toggle").click();
    await page.pdf({ path: pdfPath("en"), preferCSSPageSize: true, printBackground: true });

    assert.deepEqual(
      { ko: pageCount(pdfPath("ko")), en: pageCount(pdfPath("en")) },
      { ko: 2, en: 2 },
    );
  } finally {
    await Promise.allSettled([
      browser?.close(),
      server.listening
        ? new Promise((resolve) => server.close(resolve))
        : Promise.resolve(),
      auditDirectory
        ? rm(auditDirectory, { recursive: true, force: true })
        : Promise.resolve(),
    ]);
  }
});
