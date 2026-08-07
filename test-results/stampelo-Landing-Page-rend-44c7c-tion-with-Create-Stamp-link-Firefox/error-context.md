# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stampelo.spec.ts >> Landing Page >> renders navigation with Create Stamp link
- Location: e2e/stampelo.spec.ts:15:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav')

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  4   | 
  5   | // ─── Landing page tests ────────────────────────────────────────────────────────
  6   | test.describe("Landing Page", () => {
  7   |   test("renders hero section with brand name", async ({ page }) => {
  8   |     await page.goto(BASE_URL);
  9   |     await page.waitForLoadState("networkidle");
  10  |     // Brand name appears in nav logo and/or hero — check the page title or nav logo
  11  |     const title = await page.title();
  12  |     expect(title).toContain("Stampelo");
  13  |   });
  14  | 
  15  |   test("renders navigation with Create Stamp link", async ({ page }) => {
  16  |     await page.goto(BASE_URL);
> 17  |     await expect(page.locator("nav")).toBeVisible();
      |                                       ^ Error: expect(locator).toBeVisible() failed
  18  |   });
  19  | 
  20  |   test("renders pricing section with CHF prices", async ({ page }) => {
  21  |     await page.goto(BASE_URL);
  22  |     await page.waitForLoadState("networkidle");
  23  |     // Check CHF pricing is present
  24  |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  25  |     await page.waitForTimeout(500);
  26  |     const bodyText = await page.evaluate(() => document.body.innerText);
  27  |     expect(bodyText).toContain("CHF");
  28  |   });
  29  | 
  30  |   test("renders FAQ section", async ({ page }) => {
  31  |     await page.goto(BASE_URL);
  32  |     await page.waitForLoadState("networkidle");
  33  |     const bodyText = await page.evaluate(() => document.body.innerText);
  34  |     const hasFaq = bodyText.includes("FAQ") || bodyText.includes("Frequently");
  35  |     expect(hasFaq).toBe(true);
  36  |   });
  37  | 
  38  |   test("language switcher is present", async ({ page }) => {
  39  |     await page.goto(BASE_URL);
  40  |     await page.waitForLoadState("networkidle");
  41  |     const bodyText = await page.evaluate(() => document.body.innerText);
  42  |     const hasLangSwitch = bodyText.includes("DE") || bodyText.includes("EN");
  43  |     expect(hasLangSwitch).toBe(true);
  44  |   });
  45  | 
  46  |   test("has correct page title", async ({ page }) => {
  47  |     await page.goto(BASE_URL);
  48  |     await expect(page).toHaveTitle(/Stampelo/);
  49  |   });
  50  | 
  51  |   test("has canonical meta tag pointing to stampelo.ch", async ({ page }) => {
  52  |     await page.goto(BASE_URL);
  53  |     const canonical = await page.getAttribute('link[rel="canonical"]', "href");
  54  |     expect(canonical).toContain("stampelo.ch");
  55  |   });
  56  | });
  57  | 
  58  | // ─── Editor page tests ─────────────────────────────────────────────────────────
  59  | test.describe("Editor Page", () => {
  60  |   test("loads editor page without errors", async ({ page }) => {
  61  |     await page.goto(`${BASE_URL}/editor`);
  62  |     await page.waitForLoadState("networkidle");
  63  |     // Editor should have loaded
  64  |     const bodyText = await page.textContent("body");
  65  |     expect(bodyText).toBeTruthy();
  66  |     expect(bodyText!.length).toBeGreaterThan(100);
  67  |   });
  68  | 
  69  |   test("editor page has stamp canvas area", async ({ page }) => {
  70  |     await page.goto(`${BASE_URL}/editor`);
  71  |     await page.waitForLoadState("networkidle");
  72  |     // SVG canvas should be present
  73  |     const svgElements = await page.locator("svg").count();
  74  |     expect(svgElements).toBeGreaterThan(0);
  75  |   });
  76  | 
  77  |   test("editor page has toolbar", async ({ page }) => {
  78  |     await page.goto(`${BASE_URL}/editor`);
  79  |     await page.waitForLoadState("networkidle");
  80  |     const bodyText = await page.textContent("body");
  81  |     // Should have some editor controls
  82  |     expect(bodyText).toBeTruthy();
  83  |   });
  84  | 
  85  |   test("editor page is responsive on mobile viewport", async ({ page }) => {
  86  |     await page.setViewportSize({ width: 375, height: 812 });
  87  |     await page.goto(`${BASE_URL}/editor`);
  88  |     await page.waitForLoadState("networkidle");
  89  |     // Should not have horizontal overflow
  90  |     const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  91  |     const viewportWidth = await page.evaluate(() => window.innerWidth);
  92  |     expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50); // Allow small tolerance
  93  |   });
  94  | });
  95  | 
  96  | // ─── PDF Editor page tests ─────────────────────────────────────────────────────
  97  | test.describe("PDF Editor Page", () => {
  98  |   test("loads PDF editor page", async ({ page }) => {
  99  |     await page.goto(`${BASE_URL}/pdf-editor`);
  100 |     await page.waitForLoadState("networkidle");
  101 |     const bodyText = await page.textContent("body");
  102 |     expect(bodyText).toBeTruthy();
  103 |   });
  104 | 
  105 |   test("PDF editor has upload area", async ({ page }) => {
  106 |     await page.goto(`${BASE_URL}/pdf-editor`);
  107 |     await page.waitForLoadState("networkidle");
  108 |     const bodyText = await page.textContent("body");
  109 |     expect(bodyText?.toLowerCase()).toContain("pdf") || expect(bodyText?.toLowerCase()).toContain("upload");
  110 |   });
  111 | });
  112 | 
  113 | // ─── Legal pages tests ─────────────────────────────────────────────────────────
  114 | test.describe("Legal Pages", () => {
  115 |   test("privacy policy page loads", async ({ page }) => {
  116 |     await page.goto(`${BASE_URL}/privacy`);
  117 |     await page.waitForLoadState("networkidle");
```