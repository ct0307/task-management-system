/**
 * 键盘快捷键 Hook
 * 支持全局快捷键绑定，自动跳过输入框内的冲突
 */
import { useEffect, useCallback, useRef } from 'react';

/**
 * 快捷键映射表
 */
export const SHORTCUTS = {
  NEW_TASK: { key: 'n', label: '新建任务' },
  SEARCH: { key: '/', label: '搜索' },
  EDIT: { key: 'e', label: '编辑' },
  DELETE: { key: 'Delete', label: '删除' },
  CLOSE: { key: 'Escape', label: '关闭' },
  UP: { key: 'ArrowUp', label: '上一项' },
  DOWN: { key: 'ArrowDown', label: '下一项' },
  SELECT_ALL: { key: 'a', ctrl: true, label: '全选' },
};

/**
 * 判断事件是否应被忽略（在输入框中时忽略单字母快捷键）
 */
const shouldIgnore = (e) => {
  const tag = e.target.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;

  // 在输入框中只允许 Escape 和 Ctrl 组合键
  if (isInput && !e.ctrlKey && !e.metaKey && e.key !== 'Escape') {
    return true;
  }
  return false;
};

/**
 * 将 handlers 统一转为映射表 { key: handler }
 * 支持两种格式:
 *   - 对象: { n: () => ..., '/': () => ... }
 *   - 数组: [{ key: 'n', handler: () => ..., description: '...' }]
 */
const normalizeHandlers = (handlers) => {
  if (Array.isArray(handlers)) {
    return handlers.reduce((acc, item) => {
      acc[item.key.toLowerCase()] = item.handler;
      return acc;
    }, {});
  }
  return handlers;
};

/**
 * 全局快捷键 Hook
 * @param {Object|Array} handlers - 快捷键处理器，对象 { key: handler } 或数组 [{ key, handler, description }]
 * @param {Array} deps - 依赖数组
 */
export const useKeyboardShortcuts = (handlers, deps = []) => {
  const normalized = normalizeHandlers(handlers);
  const handlersRef = useRef(normalized);
  handlersRef.current = normalized;

  const handleKeyDown = useCallback((e) => {
    if (shouldIgnore(e)) return;

    const map = handlersRef.current;

    // 构建组合键
    const keyParts = [];
    if (e.ctrlKey || e.metaKey) keyParts.push('ctrl');
    if (e.shiftKey) keyParts.push('shift');
    keyParts.push(e.key.toLowerCase());
    const combo = keyParts.join('+');

    // 组合键优先
    if (map[combo]) {
      e.preventDefault();
      map[combo]();
      return;
    }

    // 单键匹配
    const singleKey = e.key.toLowerCase();
    if (map[singleKey]) {
      e.preventDefault();
      map[singleKey]();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
