const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://118.31.4.12';
const OUT = 'C:/Users/chentao/Desktop/轻量化任务管理系统/ppt/screenshots/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Helper: login first, then screenshot
  async function screenshotLoggedIn(page, url, filename) {
    await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' });
    // Try logging in with a test account
    try {
      await page.fill('input[id="username"]', 'admin');
      await page.fill('input[id="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log('Login attempt:', e.message);
    }
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, filename), fullPage: false });
    console.log('Screenshot saved:', filename);
  }

  const page = await context.newPage();

  // 1. Login page
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '01_login.png'), fullPage: false });
  console.log('Screenshot saved: 01_login.png');

  // 2-5. Logged-in pages
  await screenshotLoggedIn(page, '/#/tasks', '02_tasks.png');
  await screenshotLoggedIn(page, '/#/dashboard', '03_dashboard.png');
  await screenshotLoggedIn(page, '/#/schedules', '04_schedules.png');

  await browser.close();
  console.log('All screenshots done!');
})().catch(err => { console.error(err); process.exit(1); });
