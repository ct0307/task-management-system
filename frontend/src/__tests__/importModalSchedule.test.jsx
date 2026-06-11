import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ImportModal from '../component/ImportModal';

beforeAll(() => {
  window.matchMedia = window.matchMedia || vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  global.ResizeObserver = global.ResizeObserver || class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  HTMLElement.prototype.scrollIntoView = HTMLElement.prototype.scrollIntoView || vi.fn();
});

describe('ImportModal 课程表字段映射', () => {
  it('上传标准课程表 CSV 后自动映射课程表字段', async () => {
    render(
      <ImportModal
        open
        onClose={vi.fn()}
        onImport={vi.fn()}
        title="导入课程表"
        mode="schedule"
        extraFields={[
          { label: '📅 星期', value: 'weekday' },
          { label: '🕘 开始时间', value: 'start_time' },
          { label: '🕙 结束时间', value: 'end_time' },
          { label: '📍 地点', value: 'location' },
          { label: '👨‍🏫 教师', value: 'teacher' },
        ]}
      />
    );

    const csv = '星期,课程名,开始时间,结束时间,地点,教师\n周一,验证高等数学,08:00,09:40,A101,张老师\n';
    const file = new File([csv], 'schedule.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/6 字段已映射/)).toBeTruthy();
    });

    expect(screen.queryByText('请至少将一列映射为「📝 标题」')).toBeNull();
    expect(screen.getByRole('button', { name: /确认导入 1 条/ }).disabled).toBe(false);
  });
});
