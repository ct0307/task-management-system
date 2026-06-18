const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const MODULE_PATH = '../config/parseEngine';
const ORIGINAL_ENV = { ...process.env };

function reloadConfig() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

describe('parseEngine config', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PARSE_ENGINE_PATH;
    delete process.env.PYTHON_BIN;
    delete process.env.PARSE_ENGINE_TIMEOUT_MS;
    delete process.env.PARSE_ENGINE_MAX_BUFFER_MB;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete require.cache[require.resolve(MODULE_PATH)];
  });

  it('默认使用项目根目录下的 parse_engine.py，不包含本机绝对路径', () => {
    const config = reloadConfig();
    assert.equal(config.pythonBin, process.platform === 'win32' ? 'python' : 'python3');
    assert.equal(config.parseEnginePath, path.resolve(__dirname, '../../parse_engine.py'));
    assert.equal(config.parseEnginePath.includes('C:/Users/chentao'), false);
    assert.equal(config.timeoutMs, 60_000);
    assert.equal(config.maxBuffer, 10 * 1024 * 1024);
  });

  it('允许通过环境变量覆盖 Python 命令、脚本路径、超时和缓冲区', () => {
    process.env.PYTHON_BIN = 'python3.11';
    process.env.PARSE_ENGINE_PATH = '/opt/task-manager/parse_engine.py';
    process.env.PARSE_ENGINE_TIMEOUT_MS = '120000';
    process.env.PARSE_ENGINE_MAX_BUFFER_MB = '20';

    const config = reloadConfig();
    assert.equal(config.pythonBin, 'python3.11');
    assert.equal(config.parseEnginePath, path.resolve('/opt/task-manager/parse_engine.py'));
    assert.equal(config.timeoutMs, 120_000);
    assert.equal(config.maxBuffer, 20 * 1024 * 1024);
  });
});
