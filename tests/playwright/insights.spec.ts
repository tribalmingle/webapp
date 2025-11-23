import { test, expect } from '@playwright/test'

test('insights dashboard loads', async ({ page }) => {
  await page.goto('/insights')
  await expect(page.locator('h1')).toHaveText(/Member Insights/i)
})
