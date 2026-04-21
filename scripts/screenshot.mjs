import { chromium } from 'playwright'

const negocio = process.argv[2]
const outDir = process.argv[3]

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
await page.screenshot({ path: `${outDir}/${negocio}-landing.png`, fullPage: false })

await page.goto('http://localhost:3000/reservar', { waitUntil: 'networkidle' })
await page.screenshot({ path: `${outDir}/${negocio}-reservar.png`, fullPage: false })

await browser.close()
console.log(`✓ ${negocio} screenshots guardados`)
