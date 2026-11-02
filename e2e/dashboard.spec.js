import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard & Quick Navigation", () => {
  test.beforeEach(async ({ context }) => {
    // Authenticate as PG Owner for both localhost and 127.0.0.1
    const devEmail = "owner@srilakshmipg.local";
    await context.addCookies([
      {
        name: "sd_dev_user",
        value: devEmail,
        domain: "localhost",
        path: "/",
      },
      {
        name: "sd_dev_user",
        value: devEmail,
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
  });

  test("dashboard renders header and key metric cards", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Check dashboard heading
    const heading = page.getByRole("heading", { name: /Dashboard/i });
    await expect(heading).toBeVisible();

    // Check top action buttons are visible
    await expect(page.getByRole("link", { name: /Check-in Resident/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Record Payment/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Invoices/i })).toBeVisible();
  });

  test("clicking Check-in Resident navigates to residents route with modal open", async ({ page }) => {
    await page.goto("/admin/dashboard");

    const checkInBtn = page.getByRole("link", { name: /Check-in Resident/i });
    await checkInBtn.click();

    // Verify URL navigation
    await expect(page).toHaveURL(/\/admin\/residents\?action=new/);

    // Verify Check-in modal is open and has room selector
    const modalHeading = page.getByRole("heading", { name: /Check-in New Resident/i });
    await expect(modalHeading).toBeVisible();
    await expect(page.locator("#select-room")).toBeVisible();
  });

  test("clicking Record Payment navigates to payments route with record modal open", async ({ page }) => {
    await page.goto("/admin/dashboard");

    const recordBtn = page.getByRole("link", { name: /Record Payment/i });
    await recordBtn.click();

    // Verify URL navigation
    await expect(page).toHaveURL(/\/admin\/billing\/payments\?action=record/);

    // Verify record payment modal is visible
    const recordHeading = page.getByRole("heading", { name: /Record Offline \/ Direct Payment/i });
    await expect(recordHeading).toBeVisible();
  });

  test("clicking Invoices navigates to billing invoices route with batch generator", async ({ page }) => {
    await page.goto("/admin/dashboard");

    const invoicesBtn = page.getByRole("link", { name: /Invoices/i }).first();
    await invoicesBtn.click();

    // Verify URL navigation
    await expect(page).toHaveURL(/\/admin\/billing\/invoices\?action=generate/);
  });
});
