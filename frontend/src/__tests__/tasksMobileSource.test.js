import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf-8');

describe('任务页移动端优化源码结构', () => {
  it('任务页头部应为管理员查看开关提供响应式类名', () => {
    const tasksPage = read('app/tasks/index.jsx');
    const pageStyle = read('app/tasks/index.module.less');

    expect(tasksPage).toContain('className={s.viewAllSwitch}');
    expect(pageStyle).toContain('.viewAllSwitch');
  });

  it('筛选区和操作栏应提供移动端可控类名', () => {
    const filter = read('app/tasks/components/FilterSection.jsx');
    const list = read('app/tasks/components/TaskListOptimized.jsx');
    const style = read('app/tasks/components/index.module.less');

    expect(filter).toContain('className={s.filterSelect}');
    expect(list).toContain('className={s.primaryActions}');
    expect(list).toContain('className={s.batchActions}');
    expect(list).toContain('className={s.formTwoCols}');
    expect(style).toContain('.filterSelect');
    expect(style).toContain('.primaryActions');
    expect(style).toContain('.batchActions');
    expect(style).toContain('.formTwoCols');
  });
});
