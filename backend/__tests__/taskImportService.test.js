const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeTaskRows,
  parseUploadedTaskFile,
  importTaskRows
} = require('../services/tasks/taskImportService');

describe('taskImportService.normalizeTaskRows', () => {
  it('把中文状态和优先级映射为数据库枚举，并过滤空标题', () => {
    const rows = [
      { title: '完成实验报告', status: '进行中', priority: '高', description: '数据库实验', due_date: '2026-06-20' },
      { title: '', status: '待处理', priority: '低' },
      { title: '复习数学', status: 'pending', priority: 'medium' }
    ];

    const normalized = normalizeTaskRows(rows, { id: 7 });

    assert.deepEqual(normalized, [
      ['完成实验报告', '数据库实验', 'in_progress', 'high', null, '2026-06-20', null, 7],
      ['复习数学', '', 'pending', 'medium', null, null, null, 7]
    ]);
  });

  it('没有有效标题时返回空数组', () => {
    assert.deepEqual(normalizeTaskRows([{ title: '   ' }, { description: 'no title' }], { id: 1 }), []);
  });
});

describe('taskImportService.parseUploadedTaskFile', () => {
  it('解析 CSV 文件并保留非空行', () => {
    const file = {
      originalname: 'tasks.csv',
      buffer: Buffer.from('标题,状态,优先级\n写代码,待处理,高\n', 'utf-8')
    };

    const rows = parseUploadedTaskFile(file);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]['标题'], '写代码');
  });

  it('拒绝不支持的文件格式', () => {
    const file = { originalname: 'tasks.txt', buffer: Buffer.from('x') };
    assert.throws(() => parseUploadedTaskFile(file), /不支持的文件格式/);
  });
});

describe('taskImportService.importTaskRows', () => {
  it('按 100 条分批插入有效任务', async () => {
    const calls = [];
    const fakePool = {
      query: async (sql, params) => {
        calls.push({ sql, params });
        return [{ affectedRows: 1 }];
      }
    };

    const rows = Array.from({ length: 101 }, (_, index) => ({ title: `任务${index + 1}` }));
    const result = await importTaskRows(rows, { id: 3 }, fakePool);

    assert.equal(result.imported, 101);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].params.length, 100 * 8);
    assert.equal(calls[1].params.length, 1 * 8);
  });

  it('无有效数据时报错', async () => {
    await assert.rejects(
      () => importTaskRows([{ title: '' }], { id: 3 }, { query: async () => [] }),
      /无有效数据/
    );
  });
});
