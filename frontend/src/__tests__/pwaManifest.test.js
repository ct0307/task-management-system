import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..', '..');

describe('PWA 基础元数据', () => {
  it('应提供可安装应用所需的 manifest 和图标', () => {
    const manifestPath = resolve(root, 'public', 'manifest.webmanifest');
    const icon192Path = resolve(root, 'public', 'icon-192.svg');
    const icon512Path = resolve(root, 'public', 'icon-512.svg');

    expect(existsSync(manifestPath)).toBe(true);
    expect(existsSync(icon192Path)).toBe(true);
    expect(existsSync(icon512Path)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('轻量化任务管理系统');
    expect(manifest.short_name).toBe('任务管理');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#e85d3a');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }),
        expect.objectContaining({ src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }),
      ])
    );
  });

  it('首页 HTML 应引用 manifest 并声明移动端主题色', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf-8');

    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<meta name="theme-color" content="#e85d3a" />');
    expect(html).toContain('<meta name="mobile-web-app-capable" content="yes" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="任务管理" />');
  });
});
