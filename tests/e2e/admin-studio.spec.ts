import { test, expect } from '@playwright/test'

test.describe('Admin Studio', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login')
    await page.fill('[name="email"]', 'admin@tribalmingle.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')
  })

  test('should navigate to CRM module', async ({ page }) => {
    await page.goto('/admin/crm')
    await expect(page.locator('h1')).toContainText('CRM')
    await expect(page.locator('text=Search Members')).toBeVisible()
  })

  test('should search for a user in CRM', async ({ page }) => {
    await page.goto('/admin/crm')
    await page.fill('[placeholder*="Search"]', 'test@example.com')
    await page.click('button:has-text("Search")')
    await page.waitForTimeout(1000)
    // Should show results or "no results" message
  })

  test('should create a support ticket', async ({ page }) => {
    await page.goto('/admin/support')
    await page.click('button:has-text("New Ticket")')
    await page.fill('[name="subject"]', 'Test Ticket')
    await page.fill('[name="description"]', 'This is a test ticket')
    await page.selectOption('[name="priority"]', 'medium')
    await page.click('button:has-text("Create")')
    await expect(page.locator('text=Test Ticket')).toBeVisible()
  })

  test('should toggle feature flag', async ({ page }) => {
    await page.goto('/admin/labs')
    
    // Create a test flag
    await page.click('button:has-text("New Feature Flag")')
    await page.fill('[name="key"]', 'e2e_test_flag')
    await page.fill('[name="name"]', 'E2E Test Flag')
    await page.click('button:has-text("Create Flag")')
    
    // Toggle it
    await page.click('text=E2E Test Flag')
    const toggle = page.locator('role=switch')
    await toggle.click()
    
    // Verify it's enabled
    await expect(page.locator('text=Enabled')).toBeVisible()
  })

  test('should view system health', async ({ page }) => {
    await page.goto('/admin/system')
    await expect(page.locator('h1')).toContainText('System Configuration')
    await expect(page.locator('text=MongoDB')).toBeVisible()
    await expect(page.locator('text=Stripe')).toBeVisible()
  })

  test('should create an event', async ({ page }) => {
    await page.goto('/admin/events')
    await page.click('button:has-text("New Event")')
    await page.fill('[name="title"]', 'Test Event')
    await page.fill('[name="description"]', 'Test Description')
    await page.fill('[type="datetime-local"]', '2024-12-31T19:00')
    await page.click('button:has-text("Create Event")')
    await expect(page.locator('text=Test Event')).toBeVisible()
  })

  test('should view revenue analytics', async ({ page }) => {
    await page.goto('/admin/billing')
    await expect(page.locator('text=Monthly Recurring Revenue')).toBeVisible()
    await expect(page.locator('text=Active Subscriptions')).toBeVisible()
    await expect(page.locator('text=LTV by Cohort')).toBeVisible()
  })

  test('should navigate through all admin pages', async ({ page }) => {
    const pages = [
      '/admin',
      '/admin/crm',
      '/admin/support',
      '/admin/trust',
      '/admin/growth',
      '/admin/events',
      '/admin/billing',
      '/admin/labs',
      '/admin/system',
    ]

    for (const url of pages) {
      await page.goto(url)
      await expect(page.locator('h1')).toBeVisible()
      await page.waitForTimeout(500)
    }
  })
})
