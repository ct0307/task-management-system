const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const defaultParseEnginePath = path.join(projectRoot, 'parse_engine.py');

const pythonBin = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const parseEnginePath = path.resolve(process.env.PARSE_ENGINE_PATH || defaultParseEnginePath);
const timeoutMs = Number(process.env.PARSE_ENGINE_TIMEOUT_MS || 60_000);
const maxBufferMb = Number(process.env.PARSE_ENGINE_MAX_BUFFER_MB || 10);

module.exports = {
  pythonBin,
  parseEnginePath,
  timeoutMs,
  maxBuffer: maxBufferMb * 1024 * 1024
};
