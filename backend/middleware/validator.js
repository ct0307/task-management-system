/**
 * 参数校验中间件（示例）
 * 使用方式：
 *   router.post("/example", validate({ name: "required", age: "number" }), handler)
 */

const { AppError } = require("./errorHandler");

const TITLE_MAX_LENGTH = 100;

const validators = {
  required: (value, field) => {
    if (value === undefined || value === null || value === "") {
      throw new AppError(`字段 ${field} 不能为空`);
    }
  },
  string: (value, field) => {
    if (value !== undefined && typeof value !== "string") {
      throw new AppError(`字段 ${field} 必须为字符串`);
    }
    if (value !== undefined && value.length > TITLE_MAX_LENGTH && field === 'title') {
      throw new AppError(`字段 ${field} 长度不能超过 ${TITLE_MAX_LENGTH} 个字符`);
    }
  },
  number: (value, field) => {
    if (value !== undefined && isNaN(Number(value))) {
      throw new AppError(`字段 ${field} 必须为数字`);
    }
  },
  email: (value, field) => {
    if (value !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new AppError(`字段 ${field} 格式不正确`);
    }
  },
  priority: (value, field) => {
    if (value !== undefined && !['high', 'medium', 'low'].includes(value)) {
      throw new AppError(`字段 ${field} 必须为 high/medium/low`);
    }
  },
  status: (value, field) => {
    if (value !== undefined && !['pending', 'in_progress', 'completed'].includes(value)) {
      throw new AppError(`字段 ${field} 必须为 pending/in_progress/completed`);
    }
  }
};

const validate = (rules) => {
  return (req, res, next) => {
    try {
      for (const [field, ruleStr] of Object.entries(rules)) {
        const ruleList = ruleStr.split("|");
        for (const rule of ruleList) {
          if (validators[rule]) {
            validators[rule](req.body[field], field);
          }
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { validate };
