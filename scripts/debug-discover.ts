// @ts-nocheck
import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  page.on('console', (msg: any) => {
    console.log(`BROWSER CONSOLE [${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err: any) => {
    console.error('PAGE ERROR:', err?.message ?? err)
  })

  page.on('requestfailed', (request: any) => {
    console.warn('REQUEST FAILED', request.url(), request.failure?.()?.errorText)
  })

  try {
    console.log('Navigating to /discover')
    
    const res = await page.goto('http://localhost:3000/discover', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log('Navigation status:', res?.status())

    await page.waitForTimeout(3000)

    const html = await page.content()
    console.log('PAGE HTML SNIPPET:\n', html.slice(0, 2000))
  } catch (err) {
    console.error('Debug navigation failed:', err)
  } finally {
    await browser.close()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
