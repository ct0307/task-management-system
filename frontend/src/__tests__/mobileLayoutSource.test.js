import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf-8');

describe('移动端全局布局与导航', () => {
  it('App 应使用响应式内容区样式', () => {
    const app = read('App.jsx');
    expect(app).toContain('import "./styles/responsive-layout.less";');
    expect(app).toContain('<Content className="app-content">');
    expect(existsSync(resolve(root, 'styles', 'responsive-layout.less'))).toBe(true);
  });

  it('Nav 移动端菜单应使用 Drawer 并提供移动端菜单类名', () => {
    const nav = read('component/Nav/index.jsx');
    const style = read('component/Nav/index.module.less');

    expect(nav).toContain('Drawer');
    expect(nav).toContain('className={s.mobileDrawer}');
    expect(nav).toContain('className={s.notificationPanel}');
    expect(style).toContain('.mobileDrawer');
    expect(style).toContain('.mobileMenuList');
    expect(style).toContain('.notificationPanel');
  });
});
