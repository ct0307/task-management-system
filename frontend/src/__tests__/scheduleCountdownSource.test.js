import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf-8');

describe('倒数日和日程页状态源码结构', () => {
  it('倒数日没有数据时应显示 Empty 空状态', () => {
    const countdown = read('component/CountdownDays/index.jsx');
    const style = read('component/CountdownDays/index.module.less');

    expect(countdown).toContain("Spin, Empty");
    expect(countdown).toContain('暂无即将到期的任务');
    expect(countdown).toContain('className={s.emptyWrap}');
    expect(style).toContain('.emptyWrap');
  });

  it('日程页应显示错误提示并为周视图提供横向滚动容器', () => {
    const schedules = read('app/schedules/index.jsx');
    const style = read('app/schedules/index.module.less');

    expect(schedules).toContain("const [error, setError] = useState('');");
    expect(schedules).toContain('<Alert');
    expect(schedules).toContain('className={s.errorAlert}');
    expect(schedules).toContain('className={s.weekScroll}');
    expect(schedules).toContain('暂无日程，先添加一门课程吧');
    expect(style).toContain('.weekScroll');
    expect(style).toContain('.errorAlert');
  });
});
