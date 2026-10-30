import { test, expect } from "@playwright/test";

test("sign-in page renders and rejects empty submission", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  const submit = page.getByRole("button", { name: /sign in/i });
  await submit.click();
  // The form should stay on the page (no navigation) when credentials are missing.
  await expect(page).toHaveURL(/signin/);
});

test("public landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/recruai/i);
});
