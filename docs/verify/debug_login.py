"""
Quick login test
"""
from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "C:/Users/chentao/Desktop/轻量化任务管理系统/docs/verify"
os.makedirs(OUTPUT_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    page.goto("http://localhost:5174/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(OUTPUT_DIR, "debug-login-start.png"))

    page.locator('#username').fill("ct")
    page.locator('#password').fill("123456")
    page.screenshot(path=os.path.join(OUTPUT_DIR, "debug-login-filled.png"))

    # Try pressing Enter instead
    page.locator('#password').press("Enter")
    page.wait_for_timeout(3000)
    print("Current URL:", page.url)
    page.screenshot(path=os.path.join(OUTPUT_DIR, "debug-login-after.png"))
    print("Page title:", page.title())
    print("Body text snippet:", page.locator("body").inner_text()[:200])

    browser.close()
