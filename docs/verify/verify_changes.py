"""
Verify CountdownDays and Category Management changes
App: http://localhost:5174, Backend: http://localhost:3000
"""
from playwright.sync_api import sync_playwright
import os

OUTPUT_DIR = "C:/Users/chentao/Desktop/轻量化任务管理系统/docs/verify"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def screenshot(page, name):
    path = os.path.join(OUTPUT_DIR, name)
    page.screenshot(path=path, full_page=False)
    print(f"  📸 {name}")
    return path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # ---- Login ----
    print("1. 登录...")
    page.goto("http://localhost:5174/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    # Ant Design Form.Item name="username" → input id="username"
    page.locator('#username').fill("ct")
    page.locator('#password').fill("123456")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**", timeout=10000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)  # Wait for async data
    screenshot(page, "01-dashboard-overview.png")
    print("  ✅ 登录成功，进入仪表盘")

    # ---- Verify CountdownDays ----
    print("\n2. 验证倒数日组件...")
    cd_cards = page.locator('[class*="countdownCard"]').all()
    print(f"  📊 倒数日卡片数量: {len(cd_cards)}")

    # Check cards are clickable (have cursor pointer via class)
    first_card = page.locator('[class*="countdownCard"]').first
    if first_card.is_visible():
        # Check card content includes task title (not empty)
        card_text = first_card.inner_text()
        print(f"  📝 第一张卡片内容: {card_text[:80]}...")
        # Click it to open drawer
        first_card.click()
        page.wait_for_timeout(1000)
        drawer = page.locator('.ant-drawer')
        if drawer.is_visible():
            screenshot(page, "02-countdown-click-drawer.png")
            print("  ✅ 点击卡片 → Drawer 侧滑打开")
            # Close drawer
            page.locator('.ant-drawer-close').click()
            page.wait_for_timeout(500)
        else:
            print("  ⚠️ Drawer 未出现")

    # Switch to "elapsed" mode
    elapsed_btn = page.locator('.ant-segmented-group label:has-text("已进行")')
    if elapsed_btn.is_visible():
        elapsed_btn.click()
        page.wait_for_timeout(800)
        screenshot(page, "03-countdown-elapsed.png")
        print("  ✅ 切换到「已进行」模式")

    # Switch back to countdown mode
    countdown_btn = page.locator('.ant-segmented-group label:has-text("剩余天数")')
    if countdown_btn.is_visible():
        countdown_btn.click()
        page.wait_for_timeout(500)

    screenshot(page, "04-dashboard-countdown-detail.png")
    print("  ✅ 倒数日验证完成")

    # ---- Verify Tasks Page - Category Management ----
    print("\n3. 验证任务页分类管理...")
    page.goto("http://localhost:5174/tasks")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "05-tasks-page.png")

    # Open "管理分类" modal
    manage_btn = page.locator('button:has-text("管理分类")')
    if manage_btn.is_visible():
        manage_btn.click()
        page.wait_for_timeout(800)
        screenshot(page, "06-manage-categories-modal.png")
        print("  ✅ 「管理分类」弹窗已打开")

        # Check category list items
        cat_items = page.locator('.ant-modal-body > div > div').all()
        print(f"  📊 分类数量: {len(cat_items)}")

        # Close modal
        page.locator('.ant-modal-close').click()
        page.wait_for_timeout(500)
    else:
        print("  ⚠️ 未找到「管理分类」按钮")

    # ---- Verify Category Color Picker in Create Task Modal ----
    print("\n4. 验证创建任务分类颜色选择器...")
    # Open create task modal
    new_btn = page.locator('button:has-text("新建任务")').first
    new_btn.click()
    page.wait_for_timeout(800)

    # Open category dropdown
    cat_select = page.locator('.ant-form-item:has-text("分类") .ant-select-selector')
    if cat_select.is_visible():
        cat_select.click()
        page.wait_for_timeout(600)
        screenshot(page, "07-category-color-picker.png")
        print("  ✅ 分类下拉打开 → 颜色选择器可见")

        # Count color blocks
        color_blocks = page.locator('.ant-select-dropdown:visible span[style*="width: 22px"]').all()
        print(f"  🎨 颜色色块数量: {len(color_blocks)}")

    # Close dropdown and modal
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)

    # ---- Take final dashboard screenshot ----
    print("\n5. 回到仪表盘全景...")
    page.goto("http://localhost:5174/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    screenshot(page, "08-final-dashboard.png")

    print("\n✅ 全部验证完成")
    browser.close()
