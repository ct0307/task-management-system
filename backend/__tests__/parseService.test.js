const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { parseFileWithEngine } = require('../services/tasks/parseService');

describe('parseService.parseFileWithEngine', () => {
  it('解析 Python 返回的 JSON stdout', async () => {
    const execFile = (bin, args, options, callback) => {
      assert.equal(bin, 'python-test');
      assert.deepEqual(args, ['/tmp/parse_engine.py', '/tmp/input.pdf']);
      assert.equal(options.timeout, 1000);
      callback(null, JSON.stringify({ full_text: '课程表' }), '');
    };

    const result = await parseFileWithEngine('/tmp/input.pdf', {
      execFile,
      config: {
        pythonBin: 'python-test',
        parseEnginePath: '/tmp/parse_engine.py',
        timeoutMs: 1000,
        maxBuffer: 1024
      }
    });

    assert.deepEqual(result, { full_text: '课程表' });
  });

  it('非 JSON stdout 包装为 full_text', async () => {
    const execFile = (bin, args, options, callback) => callback(null, 'plain text', '');
    const result = await parseFileWithEngine('/tmp/input.pdf', {
      execFile,
      config: {
        pythonBin: 'python-test',
        parseEnginePath: '/tmp/parse_engine.py',
        timeoutMs: 1000,
        maxBuffer: 1024
      }
    });

    assert.deepEqual(result, { full_text: 'plain text' });
  });

  it('Python 执行失败时抛出解析失败错误', async () => {
    const execFile = (bin, args, options, callback) => callback(new Error('exit 1'), '', 'bad file');

    await assert.rejects(
      () => parseFileWithEngine('/tmp/input.pdf', {
        execFile,
        config: {
          pythonBin: 'python-test',
          parseEnginePath: '/tmp/parse_engine.py',
          timeoutMs: 1000,
          maxBuffer: 1024
        }
      }),
      /解析失败: bad file/
    );
  });
});
