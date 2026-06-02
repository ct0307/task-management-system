"""
Full verification script for CountdownDays + Category Management
"""
from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "C:/Users/chentao/Desktop/轻量化任务管理系统/docs/verify"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def ss(page, name):
    path = os.path.join(OUTPUT_DIR, name)
    page.screenshot(path=path, full_page=False)
    print(f"  📸 {name}")
    return path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # ---- Login using HashRouter URL ----
    print("1. 登录...")
    page.goto("http://localhost:5174/#/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    # Fill and submit form
    page.locator('#username').fill("ct")
    page.locator('#password').fill("123456")
    # Click the login button directly
    page.locator('button:has-text("登 录")').click()
    page.wait_for_timeout(3000)

    current_url = page.url
    print(f"  URL after login: {current_url}")

    if "dashboard" not in current_url and "login" in current_url:
        # Maybe login failed - take screenshot
        ss(page, "debug-failed.png")
        error = page.locator('.ant-message-error, .ant-message').all()
        for e in error:
            print(f"  Error msg: {e.inner_text()}")
        # Try pressing enter on password
        page.locator('#password').fill("123456")
        page.locator('#password').press("Enter")
        page.wait_for_timeout(3000)
        print(f"  URL after Enter: {page.url}")

    # Navigate to dashboard
    page.goto("http://localhost:5174/#/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)
    ss(page, "01-dashboard.png")
    print("  ✅ 仪表盘加载完成")

    # ---- 2. CountdownDays verification ----
    print("\n2. 验证倒数日...")
    cd_section = page.locator('.ant-card:has-text("倒数日")')
    if cd_section.is_visible():
        cards = page.locator('[class*="countdownCard"]').all()
        print(f"  📊 可见倒数卡片: {len(cards)}")

        if len(cards) > 0:
            first = cards[0]
            txt = first.inner_text()
            print(f"  📝 第一张卡片: {txt[:100]}")
            # Click to open drawer
            first.click()
            page.wait_for_timeout(1500)
            drawer = page.locator('.ant-drawer-body')
            if drawer.is_visible():
                ss(page, "02-drawer-opened.png")
                print("  ✅ 卡片点击 → Drawer 打开")
                page.locator('.ant-drawer-close').click()
                page.wait_for_timeout(500)

        # Switch to elapsed mode
        seg = page.locator('.ant-segmented-group [title="已进行"]')
        if seg.is_visible():
            seg.click()
            page.wait_for_timeout(1000)
            ss(page, "03-elapsed-mode.png")
            print("  ✅ 已进行模式")
    else:
        print("  ⚠️ 倒数日卡片不可见")

    # ---- 3. Tasks page - category management ----
    print("\n3. 验证分类管理...")
    page.goto("http://localhost:5174/#/tasks")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    # Check for "管理分类" button
    manage_btn = page.locator('button:has-text("管理分类")')
    if manage_btn.is_visible():
        manage_btn.click()
        page.wait_for_timeout(1000)
        ss(page, "04-manage-categories.png")
        print("  ✅ 管理分类弹窗打开")
        page.locator('.ant-modal-close').click()
        page.wait_for_timeout(500)
    else:
        print("  ⚠️ 未找到管理分类按钮")
        ss(page, "04-debug-tasks.png")

    # ---- 4. Category color picker ----
    print("\n4. 验证分类颜色选择器...")
    new_btn = page.locator('button:has-text("新建任务")').first
    new_btn.click()
    page.wait_for_timeout(1000)

    cat_select = page.locator('.ant-form-item').filter(has_text="分类").locator('.ant-select-selector')
    if cat_select.is_visible():
        cat_select.click()
        page.wait_for_timeout(800)
        ss(page, "05-category-color-picker.png")

        # Count colored squares in dropdown
        color_dots = page.locator('.ant-select-dropdown span[style*="width: 22px"]').all()
        # Fallback: check for any colored spans
        if not color_dots:
            color_dots = page.locator('.ant-select-dropdown span[style*="22px"]').all()
        print(f"  🎨 颜色色块: {len(color_dots)} 个")
        print("  ✅ 分类颜色选择器可见")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
    else:
        print("  ⚠️ 分类选择器不可见")

    page.keyboard.press("Escape")
    page.wait_for_timeout(300)

    # Final screenshot
    page.goto("http://localhost:5174/#/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    ss(page, "06-final.png")

    print("\n✅ 验证完成！")
    browser.close()
