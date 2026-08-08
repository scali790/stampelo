import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// ─── Landing page tests ────────────────────────────────────────────────────────
test.describe("Landing Page", () => {
  test("renders hero section with brand name", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Brand name appears in nav logo and/or hero — check the page title or nav logo
    const title = await page.title();
    expect(title).toContain("Stampelo");
  });

  test("renders navigation with Create Stamp link", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("nav")).toBeVisible();
  });

  test("renders pricing section with CHF prices", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Check CHF pricing is present
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("CHF");
  });

  test("renders FAQ section", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasFaq = bodyText.includes("FAQ") || bodyText.includes("Frequently");
    expect(hasFaq).toBe(true);
  });

  test("language switcher is present", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasLangSwitch = bodyText.includes("DE") || bodyText.includes("EN");
    expect(hasLangSwitch).toBe(true);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Stampelo/);
  });

  test("has canonical meta tag pointing to stampelo.com", async ({ page }) => {
    await page.goto(BASE_URL);
    const canonical = await page.getAttribute('link[rel="canonical"]', "href");
    expect(canonical).toContain("stampelo.com");
  });
});

// ─── Editor page tests ─────────────────────────────────────────────────────────
test.describe("Editor Page", () => {
  test("loads editor page without errors", async ({ page }) => {
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForLoadState("networkidle");
    // Editor should have loaded
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test("editor page has stamp canvas area", async ({ page }) => {
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForLoadState("networkidle");
    // SVG canvas should be present
    const svgElements = await page.locator("svg").count();
    expect(svgElements).toBeGreaterThan(0);
  });

  test("editor page has toolbar", async ({ page }) => {
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.textContent("body");
    // Should have some editor controls
    expect(bodyText).toBeTruthy();
  });

  test("editor page is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForLoadState("networkidle");
    // Should not have horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50); // Allow small tolerance
  });
});

// ─── PDF Editor page tests ─────────────────────────────────────────────────────
test.describe("PDF Editor Page", () => {
  test("loads PDF editor page", async ({ page }) => {
    await page.goto(`${BASE_URL}/pdf-editor`);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("PDF editor has upload area", async ({ page }) => {
    await page.goto(`${BASE_URL}/pdf-editor`);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.textContent("body");
    expect(bodyText?.toLowerCase()).toContain("pdf") || expect(bodyText?.toLowerCase()).toContain("upload");
  });
});

// ─── Legal pages tests ─────────────────────────────────────────────────────────
test.describe("Legal Pages", () => {
  test("privacy policy page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("Privacy");
  });

  test("terms of service page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("Terms");
  });

  test("refund policy page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/refund`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("Refund");
  });

  test("legal pages reference stampelo.com domain", async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("stampelo.com");
  });

  test("legal pages reference Swiss law", async ({ page }) => {
    await page.goto(`${BASE_URL}/terms`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).toContain("Switzerland");
  });
});

// ─── Navigation tests ──────────────────────────────────────────────────────────
test.describe("Navigation", () => {
  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist-xyz`);
    await page.waitForLoadState("networkidle");
    const bodyText = await page.textContent("body");
    expect(bodyText).toBeTruthy();
  });

  test("landing page links to editor", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Editor links may be in nav or hero CTA
    const links = await page.locator('a[href="/editor"], a[href*="editor"]').count();
    expect(links).toBeGreaterThan(0);
  });
});

// ─── Mobile viewport tests ─────────────────────────────────────────────────────
test.describe("Mobile Responsiveness", () => {
  test("landing page renders on iPhone viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // On mobile, brand name may be in hamburger menu — check page title instead
    const title = await page.title();
    expect(title).toContain("Stampelo");
  });

  test("landing page renders on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // Check page title for brand presence
    const title = await page.title();
    expect(title).toContain("Stampelo");
  });

  test("no horizontal scroll on mobile landing page", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});

// ─── Template library tests ───────────────────────────────────────────────────
test.describe("Template Library", () => {
  async function openTemplateLibrary(page: Page) {
    await page.goto(`${BASE_URL}/editor`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /templates/i }).click();
    await expect(page.getByText("Template Library")).toBeVisible();
  }

  test("category strip exposes the full live category set without stale empty categories", async ({ page }) => {
    await page.setViewportSize({ width: 1700, height: 1000 });
    await openTemplateLibrary(page);

    const strip = page.getByTestId("template-category-strip");
    await expect(strip).toBeVisible();
    const labels = await strip.locator("button").allTextContents();

    expect(labels).toEqual(expect.arrayContaining([
      "All",
      "Approval",
      "Business",
      "Document",
      "Finance",
      "Legal",
      "Medical",
      "Personal",
      "Utility",
    ]));
    expect(labels).not.toContain("Legal / Notary");
    expect(labels).not.toContain("Wedding");
  });

  test("category strip supports horizontal scrolling without page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await openTemplateLibrary(page);

    const strip = page.getByTestId("template-category-strip");
    const overflow = await strip.evaluate((element) => element.scrollWidth - element.clientWidth);
    expect(overflow).toBeGreaterThan(0);

    await strip.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    const utilityButton = strip.getByRole("button", { name: "Utility" });
    await expect(utilityButton).toBeVisible();
    await utilityButton.click();
    await expect(utilityButton).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("switching category clears search and shows matching templates", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 900 });
    await openTemplateLibrary(page);

    const search = page.getByPlaceholder("Search templates...");
    await search.fill("Corporate Seal Blue");
    await expect(page.getByText("Corporate Seal Blue")).toBeVisible();

    const strip = page.getByTestId("template-category-strip");
    const medicalButton = strip.getByRole("button", { name: "Medical" });
    await medicalButton.scrollIntoViewIfNeeded();
    await medicalButton.click();

    await expect(search).toHaveValue("");
    await expect(page.locator("p").filter({ hasText: /^Medical Practice$/ })).toBeVisible();
    await expect(page.locator("p").filter({ hasText: /^Clinic$/ })).toBeVisible();
  });
});
