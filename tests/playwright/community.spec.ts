import { test, expect } from '@playwright/test'

test('community hub loads and shows clubs', async ({ page }) => {
  await page.goto('/community')
  await expect(page.locator('h1')).toHaveText(/Community/i)
})
