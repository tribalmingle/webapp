import { test, expect } from '@playwright/test'

test('quests page loads', async ({ page }) => {
  await page.goto('/quests')
  await expect(page.locator('h1')).toHaveText(/Quests/i)
})
