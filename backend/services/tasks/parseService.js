const childProcess = require('node:child_process');
const parseEngineConfig = require('../../config/parseEngine');

function parseFileWithEngine(filepath, options = {}) {
  const execFile = options.execFile || childProcess.execFile;
  const config = options.config || parseEngineConfig;

  return new Promise((resolve, reject) => {
    execFile(
      config.pythonBin,
      [config.parseEnginePath, filepath],
      { timeout: config.timeoutMs, maxBuffer: config.maxBuffer },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`解析失败: ${stderr || err.message}`));
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve({ full_text: stdout });
        }
      }
    );
  });
}

module.exports = { parseFileWithEngine };
