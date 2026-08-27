# Bilingual Resume Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a bilingual, privacy-safe Backend & Cloud Engineer resume as a static Vercel site.

**Architecture:** A semantic Korean-first `index.html` remains fully readable without JavaScript. `app.js` progressively enhances the page with KR/EN translation, remembered language choice, email copy, and printing; `styles.css` owns responsive and print presentation. Node's built-in test runner verifies content boundaries and pure interaction functions without adding runtime dependencies.

**Tech Stack:** HTML5, CSS3, browser JavaScript (ES modules), Node.js built-in `node:test`, Vercel static hosting

**Spec:** `docs/superpowers/specs/2026-08-27-resume-site-design.md`

## Global Constraints

- Position the candidate as `Backend & Cloud Engineer`; do not position him as a frontend engineer.
- Korean is the no-JavaScript default and KR/EN switching must preserve identical claims and numbers.
- Publish only the name, `gkr054@naver.com`, `https://github.com/hak2881`, `South Korea`, and approved education details.
- Do not publish a photo, birth date, age, phone number, employer name, client name, colleague name, private repository name, Slack link, or infrastructure identifier.
- Describe commerce work as search/product backend ownership plus storefront flow understanding and short-term integration support.
- Use only static files; do not add a framework, server function, database, analytics, contact form, or external font.
- Target Vercel scope `hak2881s-projects`, preferring project name `byunghak-kim` and falling back once to `hak2881-resume`.
- Keep the page usable without JavaScript and printable to A4/PDF.

## File Map

- `package.json` — test and local-preview scripts only; no dependencies.
- `index.html` — semantic content, Korean defaults, paired `data-ko`/`data-en` translations, metadata, and static links.
- `styles.css` — Clean ATS+ visual system, responsive layout, accessible focus styles, and print rules.
- `app.js` — pure language helpers plus guarded browser enhancement.
- `tests/resume.test.mjs` — content, privacy, translation, metadata, and CSS contract tests.
- `tests/app.test.mjs` — pure function tests for language resolution and translation application.
- `og.png` — generated social card with only approved public identity.
- `robots.txt` — allow public crawling.
- `sitemap.xml` — final production root URL.
- `vercel.json` — static security headers.

---

### Task 1: Semantic Resume Content and Privacy Contract

**Files:**
- Create: `package.json`
- Create: `tests/resume.test.mjs`
- Create: `index.html`

**Interfaces:**
- Consumes: approved copy, numbers, and privacy boundaries from the spec.
- Produces: translation nodes shaped as `[data-i18n][data-ko][data-en]`; section IDs `work`, `systems`, `engineering`, `about`; static anchors for email and GitHub.

- [ ] **Step 1: Write the failing semantic and privacy tests**

```js
// tests/resume.test.mjs
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
```

- [ ] **Step 2: Create the dependency-free project script and verify the test fails**

```json
{
  "name": "hak2881-resume",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "preview": "python3 -m http.server 4173"
  }
}
```

Run: `npm test`

Expected: FAIL with `ENOENT` because `index.html` does not exist.

- [ ] **Step 3: Implement the semantic Korean-first HTML**

Use this exact section and ownership shape; fill every visible string with paired, HTML-escaped `data-ko` and `data-en` attributes.

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>김병학 — Backend &amp; Cloud Engineer</title>
  <meta name="description" content="Go와 Python으로 신뢰할 수 있는 백엔드를 만들고 AWS에서 배포와 운영까지 책임지는 Backend &amp; Cloud Engineer 김병학입니다.">
  <link rel="stylesheet" href="/styles.css">
  <script type="module" src="/app.js"></script>
</head>
<body>
  <a class="skip-link" href="#main" data-i18n="skip" data-ko="본문으로 건너뛰기" data-en="Skip to content">본문으로 건너뛰기</a>
  <header class="site-header">
    <a class="identity" href="#top">김병학 <span aria-hidden="true">·</span> BYUNGHAK KIM</a>
    <nav aria-label="주요 메뉴">
      <a href="#work" data-i18n="nav.work" data-ko="경력" data-en="Work">경력</a>
      <a href="#systems" data-i18n="nav.systems" data-ko="시스템" data-en="Systems">시스템</a>
      <a href="#engineering" data-i18n="nav.engineering" data-ko="기술" data-en="Engineering">기술</a>
    </nav>
    <div class="header-actions">
      <button id="language-toggle" type="button" aria-pressed="false">KR / EN</button>
      <button id="print-button" type="button" data-i18n="print" data-ko="인쇄 / PDF" data-en="Print / PDF">인쇄 / PDF</button>
    </div>
  </header>

  <main id="main">
    <section id="top" class="hero" aria-labelledby="hero-title">
      <p class="eyebrow">Backend &amp; Cloud Engineer</p>
      <h1 id="hero-title" data-i18n="hero.title" data-ko="운영에서 신뢰할 수 있는 백엔드를 만듭니다." data-en="I build backends that stay reliable in production.">운영에서 신뢰할 수 있는 백엔드를 만듭니다.</h1>
      <p class="hero-summary" data-i18n="hero.summary" data-ko="Go와 Python으로 데이터 정합성이 중요한 서비스를 설계하고, AWS에서 배포·관측·복구까지 책임집니다. 외부 시스템이 많이 얽힌 문제를 설명 가능한 구조로 바꾸는 데 강합니다." data-en="I design data-critical services in Go and Python and own their deployment, observability, and recovery on AWS. I turn integration-heavy problems into systems that can explain their state.">Go와 Python으로 데이터 정합성이 중요한 서비스를 설계하고, AWS에서 배포·관측·복구까지 책임집니다. 외부 시스템이 많이 얽힌 문제를 설명 가능한 구조로 바꾸는 데 강합니다.</p>
      <div class="hero-links"><a id="email-link" href="mailto:gkr054@naver.com">gkr054@naver.com</a><a href="https://github.com/hak2881" rel="me">github.com/hak2881</a></div>
    </section>

    <section class="evidence" aria-label="대표 성과">
      <article><strong>7,732ms → 283ms</strong><span data-i18n="metric.category" data-ko="다중 카테고리 필터" data-en="Multi-category filtering">다중 카테고리 필터</span></article>
      <article><strong>4,857ms → 11ms</strong><span data-i18n="metric.price" data-ko="가격 범위 필터" data-en="Price-range filtering">가격 범위 필터</span></article>
      <article><strong>235K+</strong><span data-i18n="metric.backfill" data-ko="상품 메타데이터 백필" data-en="Product metadata backfill">상품 메타데이터 백필</span></article>
      <article><strong>1,067</strong><span data-i18n="metric.catalog" data-ko="적용 환경의 브랜드 규모" data-en="Brands in the operating catalog">적용 환경의 브랜드 규모</span></article>
    </section>

    <section id="work" class="resume-section" aria-labelledby="work-title">
      <h2 id="work-title" data-i18n="work.title" data-ko="경력" data-en="Experience">경력</h2>
      <article class="timeline-item"><p class="period">2025.11 — Present · NDA</p><h3>Production Backend &amp; Cloud Engineering</h3><p data-i18n="work.production" data-ko="검색·상품 API, 리워드 원장, ERP·배송·결제 연동, AWS 배포와 운영 안정화를 담당했습니다." data-en="Built and operated search and product APIs, reward ledgers, ERP, carrier and payment integrations, and AWS deployment paths.">검색·상품 API, 리워드 원장, ERP·배송·결제 연동, AWS 배포와 운영 안정화를 담당했습니다.</p></article>
      <article class="timeline-item"><p class="period">2025.05 — 2025.08 · NDA</p><h3>AI Engineering Internship</h3><p data-i18n="work.internship" data-ko="ESG 증빙 문서의 변환·분할·구조화 검증과 HTML 리포트 배포 자동화를 구현했습니다." data-en="Automated ESG evidence conversion, segmentation, structured validation, and deployment of HTML review reports.">ESG 증빙 문서의 변환·분할·구조화 검증과 HTML 리포트 배포 자동화를 구현했습니다.</p></article>
    </section>

    <section id="systems" class="resume-section" aria-labelledby="systems-title">
      <h2 id="systems-title" data-i18n="systems.title" data-ko="대표 시스템" data-en="Selected systems">대표 시스템</h2>
      <div class="system-grid">
        <article class="system-card" id="commerce-backend"><h3 data-i18n="system.commerce.title" data-ko="커머스 검색·상품 백엔드" data-en="Commerce search &amp; product backend">커머스 검색·상품 백엔드</h3><p data-i18n="system.commerce.body" data-ko="PostgreSQL 데이터 모델과 Redis 캐시 구조를 개선하고, 스토어프론트까지 이어지는 연동 흐름을 이해하며 협업했습니다." data-en="Improved PostgreSQL data models and Redis caching while collaborating across the API contract that feeds the storefront.">PostgreSQL 데이터 모델과 Redis 캐시 구조를 개선하고, 스토어프론트까지 이어지는 연동 흐름을 이해하며 협업했습니다.</p></article>
        <article class="system-card" id="ledger-platform"><h3 data-i18n="system.ledger.title" data-ko="리워드·원장 플랫폼" data-en="Rewards &amp; ledger platform">리워드·원장 플랫폼</h3></article>
        <article class="system-card" id="ai-platform"><h3 data-i18n="system.ai.title" data-ko="AI 포토 경험 플랫폼" data-en="AI experience platform">AI 포토 경험 플랫폼</h3></article>
        <article class="system-card" id="erp-integration"><h3 data-i18n="system.erp.title" data-ko="B2B ERP 통합" data-en="B2B ERP integration">B2B ERP 통합</h3></article>
      </div>
    </section>

    <section id="engineering" class="resume-section" aria-labelledby="engineering-title"><h2 id="engineering-title" data-i18n="engineering.title" data-ko="기술" data-en="Engineering">기술</h2></section>
    <section id="about" class="resume-section" aria-labelledby="about-title"><h2 id="about-title" data-i18n="about.title" data-ko="학력과 개발 기록" data-en="Education &amp; development">학력과 개발 기록</h2></section>
  </main>

  <footer><p data-i18n="footer.nda" data-ko="회사와 고객 식별정보는 NDA와 개인정보 보호를 위해 제외했습니다." data-en="Employer and client identifiers are omitted for NDA and privacy reasons.">회사와 고객 식별정보는 NDA와 개인정보 보호를 위해 제외했습니다.</p></footer>
  <p id="copy-status" class="sr-only" role="status" aria-live="polite"></p>
</body>
</html>
```

Add the remaining cards and sections with these exact claims and links:

```html
<article class="system-card" id="ledger-platform">
  <h3 data-i18n="system.ledger.title" data-ko="리워드·원장 플랫폼" data-en="Rewards &amp; ledger platform">리워드·원장 플랫폼</h3>
  <p data-i18n="system.ledger.body" data-ko="정수 기반 append-only 원장, 웹훅 멱등성, 포인트 결제·환불, transactional outbox로 중복 지급과 유실을 방지했습니다." data-en="Used integer append-only ledgers, webhook idempotency, points checkout and refunds, and a transactional outbox to prevent duplicate payouts and lost effects.">정수 기반 append-only 원장, 웹훅 멱등성, 포인트 결제·환불, transactional outbox로 중복 지급과 유실을 방지했습니다.</p>
</article>
<article class="system-card" id="ai-platform">
  <h3 data-i18n="system.ai.title" data-ko="AI 포토 경험 플랫폼" data-en="AI experience platform">AI 포토 경험 플랫폼</h3>
  <p data-i18n="system.ai.body" data-ko="카메라 촬영, presigned upload, 유료·비멱등 생성 잡 큐, S3 결과 전달과 QR 결과 페이지를 하나의 흐름으로 연결했습니다." data-en="Connected camera capture, presigned upload, a paid non-idempotent generation queue, S3 delivery, and a QR result page into one workflow.">카메라 촬영, presigned upload, 유료·비멱등 생성 잡 큐, S3 결과 전달과 QR 결과 페이지를 하나의 흐름으로 연결했습니다.</p>
</article>
<article class="system-card" id="erp-integration">
  <h3 data-i18n="system.erp.title" data-ko="B2B ERP 통합" data-en="B2B ERP integration">B2B ERP 통합</h3>
  <p data-i18n="system.erp.body" data-ko="주문·재고·샘플 제한과 중량별 국제 운임을 ERP 원장과 동기화하고, 재시도와 오류 기록으로 운영 상태를 추적했습니다." data-en="Synchronized orders, inventory, sample limits, and weight-tiered freight with an ERP system of record, with retries and persisted error records.">주문·재고·샘플 제한과 중량별 국제 운임을 ERP 원장과 동기화하고, 재시도와 오류 기록으로 운영 상태를 추적했습니다.</p>
</article>

<section class="resume-section public-work" aria-labelledby="public-title">
  <h2 id="public-title" data-i18n="public.title" data-ko="공개 기술 기록" data-en="Public engineering">공개 기술 기록</h2>
  <div>
    <a href="https://github.com/hak2881/reliable-backend-patterns">Reliable Backend Patterns</a>
    <p data-i18n="public.patterns" data-ko="정수 금액, unique 멱등 키, append-only 원장과 transactional outbox를 실행 가능한 Go 예제로 정리했습니다." data-en="Executable Go examples of integer money, unique idempotency keys, append-only ledgers, and transactional outbox delivery.">정수 금액, unique 멱등 키, append-only 원장과 transactional outbox를 실행 가능한 Go 예제로 정리했습니다.</p>
    <a href="https://github.com/hak2881/aws-production-operations">AWS Production Operations</a>
    <p data-i18n="public.aws" data-ko="EKS·Lambda 런타임 경계, 배포 대상 확인, 관측성과 롤백 원칙을 익명화된 사례로 기록했습니다." data-en="Anonymized case studies on EKS and Lambda runtime boundaries, explicit deployment targets, observability, and rollback.">EKS·Lambda 런타임 경계, 배포 대상 확인, 관측성과 롤백 원칙을 익명화된 사례로 기록했습니다.</p>
  </div>
</section>

<section id="engineering" class="resume-section" aria-labelledby="engineering-title">
  <h2 id="engineering-title" data-i18n="engineering.title" data-ko="기술" data-en="Engineering">기술</h2>
  <div class="stack-groups">
    <p><strong>Languages</strong> Go · Python · TypeScript · C#</p>
    <p><strong>Backend &amp; Data</strong> FastAPI · Django · chi · pgx · sqlc · PostgreSQL · Redis</p>
    <p><strong>Cloud &amp; Operations</strong> EKS · Lambda · ECR · ALB · S3 · SQS · IAM · CloudWatch · Kubernetes · Docker · GitHub Actions</p>
  </div>
</section>

<section id="about" class="resume-section" aria-labelledby="about-title">
  <h2 id="about-title" data-i18n="about.title" data-ko="학력과 개발 원칙" data-en="Education &amp; principles">학력과 개발 원칙</h2>
  <div>
    <article><p class="period">2015 — 2022</p><h3 data-i18n="education.school" data-ko="서울과학기술대학교 전기정보공학과" data-en="Seoul National University of Science and Technology · Electrical and Information Engineering">서울과학기술대학교 전기정보공학과</h3></article>
    <ul class="principles">
      <li data-i18n="principle.state" data-ko="상태는 설명할 수 있어야 합니다." data-en="A system should be able to explain its state.">상태는 설명할 수 있어야 합니다.</li>
      <li data-i18n="principle.retry" data-ko="재전송과 재시도는 예외가 아니라 계약으로 다룹니다." data-en="Redelivery and retries are contracts, not exceptions.">재전송과 재시도는 예외가 아니라 계약으로 다룹니다.</li>
      <li data-i18n="principle.ops" data-ko="배포 대상과 롤백 경로를 사람의 기억에 맡기지 않습니다." data-en="Deployment targets and rollback paths should not depend on memory.">배포 대상과 롤백 경로를 사람의 기억에 맡기지 않습니다.</li>
    </ul>
  </div>
</section>
```

- [ ] **Step 4: Run the content tests and make the minimum copy corrections**

Run: `npm test`

Expected: all tests in `tests/resume.test.mjs` PASS.

- [ ] **Step 5: Commit the semantic content**

```bash
git add package.json index.html tests/resume.test.mjs
git commit -m "feat: add bilingual semantic resume content"
```

---

### Task 2: Clean ATS+ Responsive and Print Design

**Files:**
- Modify: `tests/resume.test.mjs`
- Create: `styles.css`

**Interfaces:**
- Consumes: classes and IDs from `index.html`.
- Produces: the visual contract for `.site-header`, `.hero`, `.evidence`, `.resume-section`, `.system-grid`, `.system-card`, `.skip-link`, `.sr-only`, mobile breakpoints, and print output.

- [ ] **Step 1: Add failing CSS contract tests**

```js
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("implements focus, responsive, reduced-motion, and print contracts", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s+print/);
  assert.match(css, /\.skip-link/);
  assert.match(css, /\.sr-only/);
});
```

Run: `npm test`

Expected: FAIL with `ENOENT` because `styles.css` does not exist.

- [ ] **Step 2: Implement the Clean ATS+ design tokens and layout**

```css
:root {
  --ink: #16233a;
  --muted: #5b687b;
  --line: #dfe5ed;
  --paper: #ffffff;
  --soft: #f5f8fc;
  --accent: #245fca;
  --accent-soft: #edf4ff;
  --content: 1120px;
  color-scheme: light;
  font-family: Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--paper); color: var(--ink); line-height: 1.6; }
a { color: inherit; text-underline-offset: .2em; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.skip-link { position: fixed; top: 8px; left: 8px; transform: translateY(-160%); z-index: 20; }
.skip-link:focus { transform: none; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.site-header { position: sticky; top: 0; z-index: 10; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; max-width: var(--content); margin: auto; padding: 18px 24px; background: rgba(255,255,255,.94); border-bottom: 1px solid var(--line); }
.header-actions { justify-self: end; display: flex; gap: 8px; }
.hero, .resume-section, footer { max-width: var(--content); margin: auto; padding: 72px 24px; }
.hero h1 { max-width: 820px; margin: 12px 0 20px; font-size: clamp(2.7rem, 7vw, 5.8rem); line-height: .98; letter-spacing: -.06em; }
.evidence { display: grid; grid-template-columns: repeat(4, 1fr); max-width: var(--content); margin: auto; border-block: 1px solid var(--line); }
.evidence article { padding: 28px 24px; border-right: 1px solid var(--line); }
.evidence strong { display: block; color: var(--accent); font-size: clamp(1.3rem, 2vw, 2rem); letter-spacing: -.04em; }
.resume-section { display: grid; grid-template-columns: 190px 1fr; gap: 56px; border-bottom: 1px solid var(--line); }
.system-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.system-card { padding: 24px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper); }

@media (max-width: 720px) {
  .site-header { grid-template-columns: 1fr auto; }
  .site-header nav { display: none; }
  .evidence, .system-grid { grid-template-columns: 1fr; }
  .evidence article { border-right: 0; border-bottom: 1px solid var(--line); }
  .resume-section { grid-template-columns: 1fr; gap: 24px; padding-block: 48px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}

@media print {
  @page { size: A4; margin: 14mm; }
  .site-header, .skip-link, button { display: none !important; }
  .hero, .resume-section, footer { max-width: none; padding: 10mm 0; }
  .system-card, .timeline-item { break-inside: avoid; }
  a { text-decoration: none; }
}
```

Add these exact finishing rules using the same tokens:

```css
.identity { font-weight: 800; text-decoration: none; letter-spacing: -.02em; }
nav { display: flex; gap: 22px; }
nav a { color: var(--muted); font-size: .84rem; font-weight: 700; text-decoration: none; }
button { min-height: 40px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper); color: var(--ink); padding: 0 14px; font: inherit; font-size: .78rem; font-weight: 750; cursor: pointer; }
.eyebrow, .resume-section > h2 { color: var(--accent); font-size: .78rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.hero-summary { max-width: 720px; color: var(--muted); font-size: clamp(1rem, 1.5vw, 1.2rem); }
.hero-links, .stack-groups { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 28px; }
.timeline-item { padding-bottom: 28px; }
.period { color: var(--muted); font-size: .78rem; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; }
.system-card h3 { margin-top: 0; }
.system-card p, .timeline-item p, .public-work p { color: var(--muted); }
.tag { display: inline-flex; border-radius: 999px; background: var(--accent-soft); color: var(--accent); padding: 5px 9px; font-size: .72rem; font-weight: 750; }
footer { color: var(--muted); font-size: .82rem; }
@media print { body { color: #000; } .evidence strong, .eyebrow, .resume-section > h2 { color: #174c9f; } }
```

- [ ] **Step 3: Run tests and verify the stylesheet contract passes**

Run: `npm test`

Expected: all content and CSS tests PASS.

- [ ] **Step 4: Commit the visual system**

```bash
git add styles.css tests/resume.test.mjs
git commit -m "feat: add responsive resume visual system"
```

---

### Task 3: Language, Copy, and Print Enhancements

**Files:**
- Create: `tests/app.test.mjs`
- Create: `app.js`

**Interfaces:**
- Consumes: DOM nodes `[data-i18n]`, `#language-toggle`, `#print-button`, `#email-link`, and `#copy-status`.
- Produces: `resolveLanguage(stored: string | null): "ko" | "en"`, `applyLanguage(root: DocumentLike, language: "ko" | "en"): void`, `copyText(text: string, clipboard?: Clipboard): Promise<boolean>`.

- [ ] **Step 1: Write failing pure-function tests**

```js
// tests/app.test.mjs
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
```

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` because `app.js` does not exist.

- [ ] **Step 2: Implement pure helpers and guarded browser bootstrap**

```js
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
```

- [ ] **Step 3: Run interaction and full tests**

Run: `npm test`

Expected: all tests in `tests/app.test.mjs` and `tests/resume.test.mjs` PASS.

- [ ] **Step 4: Commit the progressive enhancement**

```bash
git add app.js tests/app.test.mjs
git commit -m "feat: add bilingual resume interactions"
```

---

### Task 4: Metadata, Social Card, and Static Hosting Files

**Files:**
- Modify: `tests/resume.test.mjs`
- Modify: `index.html`
- Create: `og.png`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `vercel.json`

**Interfaces:**
- Consumes: preferred production origin `https://byunghak-kim.vercel.app` until Vercel confirms the actual URL.
- Produces: canonical and Open Graph metadata, one public OG asset, crawl files, and static security headers.

- [ ] **Step 1: Add failing metadata and hosting tests**

```js
const robots = await readFile(new URL("../robots.txt", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

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
```

Run: `npm test`

Expected: FAIL because the metadata and hosting files do not exist.

- [ ] **Step 2: Generate one privacy-safe social card**

Use exactly one image-generation request with this brief:

```text
Create a clean 1200x630 landscape social preview for a Korean backend engineer portfolio. White background, deep navy typography, one restrained cobalt blue rule and small grid accents. Exact visible text only: “김병학”, “BYUNGHAK KIM”, “Backend & Cloud Engineer”, and “Reliable systems, clearly explained.” High-contrast editorial resume aesthetic, generous whitespace, no portrait, no logos, no company names, no client names, no fake code, no extra words.
```

Inspect the returned image for exact text. If the text is incorrect, retry once with the same wording emphasis. Save the valid asset as `og.png`.

- [ ] **Step 3: Add exact metadata and static configuration**

Add these exact canonical, Open Graph, and X tags inside `<head>`:

```html
<link rel="canonical" href="https://byunghak-kim.vercel.app/">
<meta property="og:type" content="website">
<meta property="og:title" content="김병학 — Backend &amp; Cloud Engineer">
<meta property="og:description" content="Go·Python 백엔드, 데이터 정합성, 외부 시스템 연동과 AWS 운영 경험을 소개합니다.">
<meta property="og:url" content="https://byunghak-kim.vercel.app/">
<meta property="og:image" content="https://byunghak-kim.vercel.app/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="김병학 — Backend &amp; Cloud Engineer">
<meta name="twitter:description" content="Reliable backend and cloud systems in Go, Python, and AWS.">
<meta name="twitter:image" content="https://byunghak-kim.vercel.app/og.png">
```

Create:

```text
# robots.txt
User-agent: *
Allow: /
Sitemap: https://byunghak-kim.vercel.app/sitemap.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://byunghak-kim.vercel.app/</loc></url>
</urlset>
```

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

- [ ] **Step 4: Run metadata tests and commit**

Run: `npm test`

Expected: all tests PASS.

```bash
git add index.html og.png robots.txt sitemap.xml vercel.json tests/resume.test.mjs
git commit -m "feat: add resume metadata and hosting files"
```

---

### Task 5: Local Validation, Vercel Project Creation, and Production Deployment

**Files:**
- Modify only if final Vercel URL differs: `index.html`, `robots.txt`, `sitemap.xml`, `tests/resume.test.mjs`
- Generated and ignored: `.vercel/`

**Interfaces:**
- Consumes: fully tested static site and authenticated Vercel CLI user `hak2881`.
- Produces: one linked Vercel project under `hak2881s-projects` and one verified production URL.

- [ ] **Step 1: Run the full local verification suite**

Run:

```bash
npm test
git diff --check
npm run preview
```

In a second retained shell, run:

```bash
curl -I http://localhost:4173/
curl -I http://localhost:4173/styles.css
curl -I http://localhost:4173/app.js
curl -I http://localhost:4173/og.png
```

Expected: tests PASS, diff check is silent, and every URL returns HTTP 200.

- [ ] **Step 2: Create and link the Vercel project once**

Run:

```bash
vercel project add byunghak-kim --scope hak2881s-projects
vercel link --yes --team hak2881s-projects --project byunghak-kim
```

If and only if the first command reports a name conflict, run:

```bash
vercel project add hak2881-resume --scope hak2881s-projects
vercel link --yes --team hak2881s-projects --project hak2881-resume
```

Do not create both projects.

- [ ] **Step 3: Deploy to production and capture the exact URL**

Run: `vercel deploy --prod --yes --scope hak2881s-projects`

Expected: a successful production deployment URL.

- [ ] **Step 4: Reconcile metadata if the actual production origin differs**

If Vercel returns an origin other than `https://byunghak-kim.vercel.app`, replace that origin consistently in `index.html`, `robots.txt`, `sitemap.xml`, and `tests/resume.test.mjs`. Then run:

```bash
npm test
git add index.html robots.txt sitemap.xml tests/resume.test.mjs
git commit -m "fix: align metadata with production URL"
vercel deploy --prod --yes --scope hak2881s-projects
```

- [ ] **Step 5: Verify production assets and privacy**

Run against the exact final origin:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' "$FINAL_ORIGIN/"
curl -fsS -o /dev/null -w '%{http_code}\n' "$FINAL_ORIGIN/styles.css"
curl -fsS -o /dev/null -w '%{http_code}\n' "$FINAL_ORIGIN/app.js"
curl -fsS -o /dev/null -w '%{http_code}\n' "$FINAL_ORIGIN/og.png"
curl -fsS "$FINAL_ORIGIN/" | rg '김병학|Backend & Cloud Engineer|gkr054@naver.com|github.com/hak2881'
```

Expected: each status is `200` and the four approved identity strings are present.

Run a final private-source leak audit from the local checkout using the known employer/client terms gathered during research. Do not commit the term list. Expected: no matches in public site files.

- [ ] **Step 6: Commit final deployment state**

```bash
git status --short
git add -A
git commit -m "chore: finalize production resume deployment"
```

If `git status --short` is already empty after the deployment checks, do not create an empty commit.
