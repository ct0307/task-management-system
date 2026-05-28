import { describe, it, expect } from 'vitest';
import { STATUS_CONFIG, PRIORITY_CONFIG, STATUS_OPTIONS, PRIORITY_OPTIONS } from '../constant/task';

describe('任务常量', () => {
  it('STATUS_CONFIG 应有三种状态', () => {
    expect(Object.keys(STATUS_CONFIG)).toEqual(['pending', 'in_progress', 'completed']);
    expect(STATUS_CONFIG.pending.label).toBe('待处理');
    expect(STATUS_CONFIG.in_progress.label).toBe('进行中');
    expect(STATUS_CONFIG.completed.label).toBe('已完成');
  });

  it('PRIORITY_CONFIG 应有三种优先级', () => {
    expect(Object.keys(PRIORITY_CONFIG)).toEqual(['low', 'medium', 'high']);
    expect(PRIORITY_CONFIG.high.label).toBe('高');
    expect(PRIORITY_CONFIG.medium.label).toBe('中');
    expect(PRIORITY_CONFIG.low.label).toBe('低');
  });

  it('STATUS_OPTIONS 格式正确', () => {
    expect(STATUS_OPTIONS).toHaveLength(3);
    expect(STATUS_OPTIONS[0]).toHaveProperty('value');
    expect(STATUS_OPTIONS[0]).toHaveProperty('label');
  });

  it('PRIORITY_OPTIONS 格式正确', () => {
    expect(PRIORITY_OPTIONS).toHaveLength(3);
    expect(PRIORITY_OPTIONS[0]).toHaveProperty('value');
    expect(PRIORITY_OPTIONS[0]).toHaveProperty('label');
  });
});
