# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stampelo.spec.ts >> Legal Pages >> privacy policy page loads
- Location: e2e/stampelo.spec.ts:115:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "Privacy"
Received string:    ""
```

# Test source

```ts
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
  118 |     await page.waitForTimeout(1000);
  119 |     const bodyText = await page.evaluate(() => document.body.innerText);
> 120 |     expect(bodyText).toContain("Privacy");
      |                      ^ Error: expect(received).toContain(expected) // indexOf
  121 |   });
  122 | 
  123 |   test("terms of service page loads", async ({ page }) => {
  124 |     await page.goto(`${BASE_URL}/terms`);
  125 |     await page.waitForLoadState("networkidle");
  126 |     await page.waitForTimeout(1000);
  127 |     const bodyText = await page.evaluate(() => document.body.innerText);
  128 |     expect(bodyText).toContain("Terms");
  129 |   });
  130 | 
  131 |   test("refund policy page loads", async ({ page }) => {
  132 |     await page.goto(`${BASE_URL}/refund`);
  133 |     await page.waitForLoadState("networkidle");
  134 |     await page.waitForTimeout(1000);
  135 |     const bodyText = await page.evaluate(() => document.body.innerText);
  136 |     expect(bodyText).toContain("Refund");
  137 |   });
  138 | 
  139 |   test("legal pages reference stampelo.ch domain", async ({ page }) => {
  140 |     await page.goto(`${BASE_URL}/privacy`);
  141 |     await page.waitForLoadState("networkidle");
  142 |     await page.waitForTimeout(1000);
  143 |     const bodyText = await page.evaluate(() => document.body.innerText);
  144 |     expect(bodyText).toContain("stampelo.ch");
  145 |   });
  146 | 
  147 |   test("legal pages reference Swiss law", async ({ page }) => {
  148 |     await page.goto(`${BASE_URL}/terms`);
  149 |     await page.waitForLoadState("networkidle");
  150 |     await page.waitForTimeout(1000);
  151 |     const bodyText = await page.evaluate(() => document.body.innerText);
  152 |     expect(bodyText).toContain("Switzerland");
  153 |   });
  154 | });
  155 | 
  156 | // ─── Navigation tests ──────────────────────────────────────────────────────────
  157 | test.describe("Navigation", () => {
  158 |   test("404 page renders for unknown routes", async ({ page }) => {
  159 |     await page.goto(`${BASE_URL}/this-page-does-not-exist-xyz`);
  160 |     await page.waitForLoadState("networkidle");
  161 |     const bodyText = await page.textContent("body");
  162 |     expect(bodyText).toBeTruthy();
  163 |   });
  164 | 
  165 |   test("landing page links to editor", async ({ page }) => {
  166 |     await page.goto(BASE_URL);
  167 |     await page.waitForLoadState("networkidle");
  168 |     // Editor links may be in nav or hero CTA
  169 |     const links = await page.locator('a[href="/editor"], a[href*="editor"]').count();
  170 |     expect(links).toBeGreaterThan(0);
  171 |   });
  172 | });
  173 | 
  174 | // ─── Mobile viewport tests ─────────────────────────────────────────────────────
  175 | test.describe("Mobile Responsiveness", () => {
  176 |   test("landing page renders on iPhone viewport", async ({ page }) => {
  177 |     await page.setViewportSize({ width: 390, height: 844 });
  178 |     await page.goto(BASE_URL);
  179 |     await page.waitForLoadState("networkidle");
  180 |     // On mobile, brand name may be in hamburger menu — check page title instead
  181 |     const title = await page.title();
  182 |     expect(title).toContain("Stampelo");
  183 |   });
  184 | 
  185 |   test("landing page renders on tablet viewport", async ({ page }) => {
  186 |     await page.setViewportSize({ width: 768, height: 1024 });
  187 |     await page.goto(BASE_URL);
  188 |     await page.waitForLoadState("networkidle");
  189 |     // Check page title for brand presence
  190 |     const title = await page.title();
  191 |     expect(title).toContain("Stampelo");
  192 |   });
  193 | 
  194 |   test("no horizontal scroll on mobile landing page", async ({ page }) => {
  195 |     await page.setViewportSize({ width: 375, height: 812 });
  196 |     await page.goto(BASE_URL);
  197 |     await page.waitForLoadState("networkidle");
  198 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  199 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  200 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  201 |   });
  202 | });
  203 | 
```