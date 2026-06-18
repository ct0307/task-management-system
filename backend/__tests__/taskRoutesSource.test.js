const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const routePath = path.resolve(__dirname, '../routes/tasks.js');

describe('tasks route source', () => {
  it('不包含本机硬编码路径', () => {
    const source = fs.readFileSync(routePath, 'utf-8');
    const unixUserPath = ['C:', 'Users', 'chentao'].join('/');
    const windowsUserPath = ['C:', 'Users', 'chentao'].join('\\\\');
    assert.equal(source.includes(unixUserPath), false);
    assert.equal(source.includes(windowsUserPath), false);
  });

  it('不在路由层直接调用 child_process.execFile', () => {
    const source = fs.readFileSync(routePath, 'utf-8');
    assert.equal(source.includes("require('child_process')"), false);
    assert.equal(source.includes('require("child_process")'), false);
    assert.equal(source.includes('execFile('), false);
  });
});
