const Papa = require('papaparse');
const XLSX = require('xlsx');

const statusMap = { '待处理': 'pending', '进行中': 'in_progress', '已完成': 'completed' };
const priorityMap = { '高': 'high', '中': 'medium', '低': 'low' };

const fieldMap = {
  title: ['标题', 'title', '任务名', '名称', 'name', 'task'],
  description: ['描述', 'description', '详情', '备注', 'desc', 'note'],
  status: ['状态', 'status'],
  priority: ['优先级', 'priority'],
  due_date: ['截止', 'due', 'deadline', '日期', 'date', '到期', '截止日期'],
  category_id: ['分类', 'category', '类别'],
  assignee_id: ['负责人', 'assignee', '责任人', 'owner']
};

function getDefaultPool() {
  return require('../../db').pool;
}

function getFileExt(filename = '') {
  return filename.split('.').pop().toLowerCase();
}

function mapUploadedRows(rows) {
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const columnByField = {};

  for (const [field, patterns] of Object.entries(fieldMap)) {
    const header = headers.find((name) => patterns.some((pattern) => name.toLowerCase().includes(pattern.toLowerCase())));
    if (header) columnByField[field] = header;
  }

  return rows.map((row) => ({
    title: row[columnByField.title],
    description: row[columnByField.description],
    status: row[columnByField.status],
    priority: row[columnByField.priority],
    due_date: row[columnByField.due_date],
    category_id: row[columnByField.category_id],
    assignee_id: row[columnByField.assignee_id]
  }));
}

function parseUploadedTaskFile(file) {
  const ext = getFileExt(file.originalname);

  if (ext === 'csv') {
    const result = Papa.parse(file.buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    return result.data.filter((row) => Object.values(row).some((value) => value));
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  if (ext === 'json') {
    const data = JSON.parse(file.buffer.toString('utf-8'));
    return Array.isArray(data) ? data : (data.data || data.tasks || data.rows || []);
  }

  throw new Error(`不支持的文件格式: .${ext}`);
}

function normalizeTaskRows(rows, user = null) {
  return rows.reduce((batch, row) => {
    const title = typeof row.title === 'string' ? row.title.trim() : row.title;
    if (!title) return batch;

    batch.push([
      title,
      row.description || '',
      statusMap[row.status] || row.status || 'pending',
      priorityMap[row.priority] || row.priority || 'medium',
      row.category_id || null,
      row.due_date || null,
      row.assignee_id || null,
      user?.id || null
    ]);
    return batch;
  }, []);
}

async function insertTaskBatch(batch, dbPool = getDefaultPool()) {
  const batchSize = 100;
  for (let index = 0; index < batch.length; index += batchSize) {
    const chunk = batch.slice(index, index + batchSize);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    await dbPool.query(
      `INSERT INTO tasks (title, description, status, priority, category_id, due_date, assignee_id, created_by) VALUES ${placeholders}`,
      chunk.flat()
    );
  }
}

async function importTaskRows(rows, user, dbPool = getDefaultPool()) {
  const batch = normalizeTaskRows(rows, user);
  if (batch.length === 0) {
    throw new Error('无有效数据：所有行缺少标题');
  }

  await insertTaskBatch(batch, dbPool);
  return { imported: batch.length };
}

async function importUploadedTaskFile(file, user, dbPool = getDefaultPool()) {
  const parsedRows = parseUploadedTaskFile(file);
  if (parsedRows.length === 0) throw new Error('文件中无可用数据');
  return importTaskRows(mapUploadedRows(parsedRows), user, dbPool);
}

module.exports = {
  normalizeTaskRows,
  parseUploadedTaskFile,
  importTaskRows,
  importUploadedTaskFile
};
