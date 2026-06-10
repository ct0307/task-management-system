import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf-8');

describe('仪表盘状态与响应式源码结构', () => {
  it('仪表盘应有错误提示状态和可重试提示', () => {
    const dashboard = read('app/dashboard/index.jsx');
    const style = read('app/dashboard/index.module.less');

    expect(dashboard).toContain("const [error, setError] = useState('');");
    expect(dashboard).toContain('<Alert');
    expect(dashboard).toContain('className={s.errorAlert}');
    expect(dashboard).toContain('仪表盘数据加载失败');
    expect(style).toContain('.errorAlert');
  });

  it('趋势图区域应在无数据时显示 Empty，而不是整个区块消失', () => {
    const dashboard = read('app/dashboard/index.jsx');

    expect(dashboard).toContain('暂无完成趋势数据');
    expect(dashboard).toContain('trend.length > 0 ?');
  });
});
