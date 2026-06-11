/**
 * 通用导入弹窗 — 支持 CSV / Excel / JSON / PDF / 图片(OCR)
 * 智能格式识别、列映射、解析/导入双阶段进度反馈
 */
import React, { useState, useCallback } from 'react';
import { Modal, Button, Table, Tag, Select, message, Upload, Space, Alert, Typography, Progress, Steps } from 'antd';
import { InboxOutlined, FileExcelOutlined, FileTextOutlined, FilePdfOutlined, FileImageOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import s from './index.module.less';

const { Text } = Typography;
const { Dragger } = Upload;

// ====== 智能列映射配置 ======

const FIELD_PATTERNS = {
  title:       ['标题','title','任务名','名称','name','task','任务','课程名','课程','科目','事项','项目','内容'],
  description: ['描述','description','详情','备注','desc','note','说明','摘要','简介','信息'],
  status:      ['状态','status','state','进度','完成状态'],
  priority:    ['优先级','priority','重要程度','level','紧急程度'],
  category:    ['分类','category','类别','type','类型','分组','标签'],
  due_date:    ['截止','due','deadline','日期','date','到期','截止日期','到期日','截止时间','deadline'],
  assignee:    ['负责人','assignee','责任人','处理人','owner','执行人'],
  weekday:     ['星期','周几','weekday','day','上课星期'],
  start_time:  ['开始时间','上课时间','start_time','start','开始','起始时间'],
  end_time:    ['结束时间','下课时间','end_time','end','结束'],
  location:    ['地点','教室','位置','location','场地','上课地点'],
  teacher:     ['教师','老师','任课老师','teacher','授课教师'],
};

const matchField = (colName) => {
  const lower = (colName || '').toLowerCase().trim();
  const best = { field: null, len: 0 };
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const p of patterns) {
      const pl = p.toLowerCase();
      if (lower === pl && pl.length > best.len) { best.field = field; best.len = pl.length; }
      if (lower.includes(pl) && pl.length > best.len) { best.field = field; best.len = pl.length; }
    }
  }
  return best.field;
};

const buildAutoMap = (nextHeaders = []) => {
  const map = {};
  nextHeaders.forEach(h => {
    const field = matchField(h);
    if (field) map[h] = field;
  });
  return map;
};

// ====== 文件类型嗅探（内容检测，不依赖扩展名） ======

const sniffFileType = (fileName, firstBytes) => {
  const ext = fileName.split('.').pop().toLowerCase();

  // 通过文件头魔数判断
  if (firstBytes) {
    const arr = new Uint8Array(firstBytes.slice(0, 8));
    // PDF: %PDF-
    if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) return 'pdf';
    // PNG: 89 50 4E 47
    if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) return 'png';
    // JPEG: FF D8 FF
    if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) return 'jpg';
    // WebP: RIFF....WEBP
    if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) return 'webp';
    // BMP: BM
    if (arr[0] === 0x42 && arr[1] === 0x4D) return 'bmp';
    // ZIP/DOCX magic (XLSX is ZIP-based): PK
    if (arr[0] === 0x50 && arr[1] === 0x4B) {
      if (ext === 'xlsx' || ext === 'xls' || fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xlsm')) return 'xlsx';
    }
  }

  // 回退到扩展名
  if (['csv'].includes(ext)) return 'csv';
  if (['xlsx', 'xls', 'xlsm'].includes(ext)) return 'xlsx';
  if (['json'].includes(ext)) return 'json';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) return 'image';

  return 'unknown';
};

// ====== 文件解析 ======

const parseFile = (file, opts = {}) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  // 先读前 8 字节嗅探文件类型
  const blob = file.slice(0, 8);
  const sniffReader = new FileReader();
  sniffReader.onload = () => {
    const fileType = sniffFileType(file.name, sniffReader.result);
    opts.onProgress?.(10);

    if (fileType === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          opts.onProgress?.(90);
          const fatal = (results.errors || []).filter(e => e.type !== 'FieldMismatch');
          if (fatal.length && results.data.length === 0) {
            reject(new Error(`CSV 解析错误: ${fatal[0].message}`));
            return;
          }
          const rows = results.data.filter(r => Object.values(r).some(v => v !== '' && v != null));
          resolve({ headers: results.meta.fields || [], rows });
          opts.onProgress?.(100);
        },
        error: (err) => reject(new Error(`CSV 解析失败: ${err.message}`)),
      });
    } else if (fileType === 'xlsx') {
      reader.onload = (e) => {
        try {
          opts.onProgress?.(30);
          const wb = XLSX.read(e.target.result, { type: 'array' });
          opts.onProgress?.(50);
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (json.length === 0) { reject(new Error('Excel 文件无数据行')); return; }
          opts.onProgress?.(90);
          const headers = Object.keys(json[0]);
          resolve({ headers, rows: json });
          opts.onProgress?.(100);
        } catch (err) { reject(new Error('Excel 解析失败: ' + (err?.message || String(err)))); }
      };
      reader.onerror = () => reject(new Error('Excel 读取失败'));
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'json') {
      reader.onload = (e) => {
        try {
          opts.onProgress?.(30);
          const data = JSON.parse(e.target.result);
          const arr = Array.isArray(data) ? data : (data.data || data.tasks || data.rows || data.items || []);
          if (arr.length === 0) { reject(new Error('JSON 中无可用数据，请确保是数组格式')); return; }
          opts.onProgress?.(90);
          const headers = Object.keys(arr[0]);
          resolve({ headers, rows: arr });
          opts.onProgress?.(100);
        } catch (err) { reject(new Error('JSON 解析失败: ' + (err?.message || String(err)))); }
      };
      reader.onerror = () => reject(new Error('JSON 读取失败'));
      reader.readAsText(file);
    } else if (fileType === 'pdf') {
      reader.onload = async (e) => {
        try {
          opts.onProgress?.(10);
          const pdfjsLib = await import('pdfjs-dist');
          // 从 npm 包加载 worker 路径（版本始终匹配）
          const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({
            data: typedArray,
            disableWorker: true,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
          }).promise;
          opts.onProgress?.(20);

          // 第一步：提取文字 + X 坐标用于列识别
          const allItems = []; // { x, y, str, page }
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            content.items.forEach(it => {
              allItems.push({
                x: Math.round(it.transform[4]),
                y: Math.round(it.transform[5]),
                str: it.str,
                page: i,
              });
            });
          }

          // 按 Y 降序排列（从上到下）
          allItems.sort((a, b) => b.y - a.y || a.x - b.x);

          // 检测课表列：找到 "周一"~"周日" 的 X 位置
          const dayMarkers = [];
          const WEEKDAY_LIST = ['周一','周二','周三','周四','周五','周六','周日'];
          allItems.forEach(it => {
            WEEKDAY_LIST.forEach((day, idx) => {
              if (it.str.includes(day)) dayMarkers.push({ x: it.x, day, idx });
            });
          });
          // 按 X 排序，去重得到列边界
          dayMarkers.sort((a, b) => a.x - b.x);
          const columns = [];
          const seen = new Set();
          dayMarkers.forEach(m => {
            if (!seen.has(m.day)) { seen.add(m.day); columns.push(m); }
          });

          // === 先按行合并文本 ===
          const textLines = [];
          const itemsByY = {};
          allItems.forEach(it => {
            if (!itemsByY[it.y]) itemsByY[it.y] = [];
            itemsByY[it.y].push({ x: it.x, str: it.str });
          });
          const ys = Object.keys(itemsByY).map(Number).sort((a, b) => b - a);
          ys.forEach(y => {
            const items = itemsByY[y].sort((a, b) => a.x - b.x);
            textLines.push({ y, text: items.map(it => it.str).join(' ').trim() });
          });

          // === 检测课表结构 ===
          let isSchedule = false;
          let scheduleLines = [];

          if (columns.length >= 3) {
            // 模式A：横排课表（星期头在同一行）
            isSchedule = true;
            const colRanges = columns.map((col, i) => ({
              day: col.day,
              minX: i > 0 ? Math.floor((columns[i-1].x + col.x) / 2) : 0,
              maxX: i < columns.length-1 ? Math.floor((col.x + columns[i+1].x) / 2) : 99999,
            }));
            const rowMap = {};
            allItems.forEach(it => {
              if (WEEKDAY_LIST.some(d => it.str.includes(d))) return;
              if (!rowMap[it.y]) rowMap[it.y] = [];
              rowMap[it.y].push(it);
            });
            const sortedYs = Object.keys(rowMap).map(Number).sort((a, b) => b - a);
            sortedYs.forEach(y => {
              const items = rowMap[y];
              colRanges.forEach(col => {
                const inCol = items
                  .filter(it => it.x >= col.minX && it.x < col.maxX)
                  .sort((a, b) => a.x - b.x).map(it => it.str).join(' ').trim();
                if (inCol) scheduleLines.push(col.day + ' ' + inCol);
              });
            });
          } else {
            // 模式B：竖排课表（每天一个区块，星期标题在行首）
            const tl = textLines.map(l => l.text).filter(Boolean);
            const WEEKDAY_MAP = { '星期一':'周一','星期二':'周二','星期三':'周三','星期四':'周四','星期五':'周五','星期六':'周六','星期日':'周日' };

            const blockLines = [];
            for (let i = 0; i < tl.length; i++) {
              const m = tl[i].match(/^(星期[一二三四五六日])/);
              if (m) {
                const day = WEEKDAY_MAP[m[1]] || m[1];
                let content = tl[i].replace(m[1], '').trim();
                let j = i + 1;
                while (j < tl.length && !tl[j].match(/^(星期[一二三四五六日])/)) {
                  content += ' ' + tl[j];
                  j++;
                }
                if (content.trim()) blockLines.push(day + ' ' + content.trim());
              }
            }
            console.log('=== 模式B 检测到', blockLines.length, '天 ===');
            blockLines.forEach(l => console.log(l.substring(0, 120)));
            if (blockLines.length >= 2) {
              isSchedule = true;
              scheduleLines = blockLines;
            }
          }

          if (isSchedule && scheduleLines.length > 0) {
            // 结构化解析课表
            console.log('=== 课表行 ===');
            scheduleLines.forEach(l => console.log(l.substring(0, 200)));
            const courses = parseScheduleLines(scheduleLines);
            console.log('=== 解析出', courses.length, '门课程 ===');

            if (courses.length > 0) {
              courses.forEach(c => console.log(c.day, c.courseName, c.startTime+'-'+c.endTime, c.location, c.teacher));
              const cleanLines = courses.map(c =>
                `${c.day} ${c.startTime}-${c.endTime} ${c.courseName} ${c.location ? '场地:'+c.location : ''} ${c.teacher ? '教师:'+c.teacher : ''}`.trim()
              );
              opts.onProgress?.(90);
              resolve({ headers: ['内容'], rows: cleanLines.map(l => ({ '内容': l })) });
              opts.onProgress?.(100);
              return;
            }
          }

          // === 非课表 / 解析失败 → 按行返回 ===
          if (textLines.length > 0) {
            const cleanLines = textLines.map(l => l.text).filter(Boolean);
            console.log('=== PDF 通用解析 ===');
            console.log(cleanLines.join('\n').substring(0, 500));
            opts.onProgress?.(85);
            resolve({ headers: ['内容'], rows: cleanLines.map(l => ({ '内容': l })) });
            opts.onProgress?.(100);
            return;
          }

          // 第二步：文字提取为空 → 渲染为图片做 OCR（扫描件）
          opts.onProgress?.(25);
          try {
            const { default: Tesseract } = await import('tesseract.js');
            const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
              langPath: '/tessdata',  // 本地语言包，不依赖 CDN
              logger: m => {
                if (m.status === 'loading tesseract core') opts.onProgress?.(26);
                else if (m.status === 'loading language traineddata') opts.onProgress?.(27);
                else if (m.status === 'initializing api') opts.onProgress?.(28);
              }
            });

            const allLines = [];
            const totalPages = Math.min(pdf.numPages, 10);

            for (let i = 1; i <= totalPages; i++) {
              const page = await pdf.getPage(i);
              const baseWidth = page.getViewport({ scale: 1 }).width;
              const scale = Math.max(1.5, Math.min(3, Math.floor(1800 / baseWidth)));
              const viewport = page.getViewport({ scale });

              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              await page.render({ canvasContext: ctx, viewport }).promise;

              try {
                const { data: { text } } = await worker.recognize(canvas);
                console.log('Page ' + i + ' OCR raw text length:', (text || '').length, 'preview:', (text || '').substring(0, 100));
                if (text && text.trim()) allLines.push(...text.split('\n').filter(Boolean));
                else console.warn('Page ' + i + ': no text from OCR');
              } catch (ocrErr) {
                console.warn('Page ' + i + ' OCR failed:', ocrErr?.message || ocrErr);
              }

              opts.onProgress?.(25 + Math.round((i / totalPages) * 70));
            }

            await worker.terminate();

            if (allLines.length === 0) { reject(new Error('PDF OCR 未识别到文字（共 ' + totalPages + ' 页）。请确认 PDF 包含清晰的文字。')); return; }
            opts.onProgress?.(95);
            const parsed = inferTableFromText(allLines);
            resolve(parsed);
            opts.onProgress?.(100);
          } catch (ocrErr) {
            reject(new Error('PDF OCR 识别失败: ' + (ocrErr?.message || String(ocrErr))));
          }
        } catch (err) { reject(new Error('PDF 解析失败: ' + (err?.message || String(err)))); }
      };
      reader.onerror = () => reject(new Error('PDF 读取失败'));
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'image') {
      (async () => {
        try {
          opts.onProgress?.(5);
          const { default: Tesseract } = await import('tesseract.js');
          const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
            langPath: '/tessdata',  // 本地语言包
            logger: (m) => {
              if (m.status === 'loading tesseract core') opts.onProgress?.(2);
              else if (m.status === 'initializing api') opts.onProgress?.(3);
              else if (m.status === 'loading language traineddata') opts.onProgress?.(5);
              else if (m.status === 'recognizing text' && m.progress) {
                opts.onProgress?.(5 + Math.round(m.progress * 90));
              }
            },
          });
          const { data: { text } } = await worker.recognize(file);
          await worker.terminate();
          opts.onProgress?.(95);
          if (!text || !text.trim()) { reject(new Error('图片中未识别到文字，请确认图片包含清晰的文字内容')); return; }
          opts.onProgress?.(95);
          const lines = text.split('\n').filter(Boolean);
          const parsed = inferTableFromText(lines);
          resolve(parsed);
          opts.onProgress?.(100);
        } catch (err) { reject(new Error('图片识别失败: ' + (err?.message || String(err)))); }
      })();
    } else {
      reject(new Error(`不支持的文件格式，请上传 CSV / Excel / JSON / PDF / 图片文件`));
    }
  };
  sniffReader.onerror = () => reject(new Error('文件读取失败'));
  sniffReader.readAsArrayBuffer(blob);
});

// ====== 增强文本表格推断 ======

// 课表课程项解析：提取课程名、时间、地点、教师
const addMinutes = (time, minutes) => {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const totalMinutes = Number(match[1]) * 60 + Number(match[2]) + minutes;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const parseCourseItem = (text) => {
  // 提取课程名（括号前的内容，去掉符号标记）
  const nameMatch = text.match(/^(.+?)[★●@\s]*\((\d+)-(\d+)节\)/);
  if (!nameMatch) return null;
  const courseName = nameMatch[1].replace(/[★●@]/g, '').trim();
  const startPeriod = parseInt(nameMatch[2]);
  const endPeriod = parseInt(nameMatch[3]);

  // 大学标准节次时间映射
  const PERIOD_TIMES = {
    1: '08:05', 2: '08:55', 3: '10:00', 4: '10:50',
    5: '13:30', 6: '14:25', 7: '15:20', 8: '16:10',
    9: '18:00', 10: '18:50', 11: '19:40', 12: '20:30',
  };
  const startTime = PERIOD_TIMES[startPeriod] || '';
  const endPeriodTime = PERIOD_TIMES[endPeriod + 1];
  // 结束时间 = 最后一节的下课时间，如果没映射就推算
  const endTime = endPeriodTime || (PERIOD_TIMES[endPeriod] ? addMinutes(PERIOD_TIMES[endPeriod], 45) : '');

  // 提取场地
  const locMatch = text.match(/场地[:：]([^/]+)/);
  const location = locMatch ? locMatch[1].trim() : '';

  // 提取教师
  const teacherMatch = text.match(/教师[:：]([^/]+)/);
  const teacher = teacherMatch ? teacherMatch[1].replace(/\s+/g, '').trim() : '';

  // 提取校区
  const campusMatch = text.match(/校区[:：]([^/]+)/);
  const campus = campusMatch ? campusMatch[1].trim() : '';

  // 提取周次
  const weeksMatch = text.match(/\((\d+)-(\d+)节\)(.+?)(\/校区|$)/);
  const weeks = weeksMatch ? weeksMatch[3].trim() : '';

  return { courseName, startPeriod, endPeriod, startTime, endTime, location, teacher, campus, weeks };
};

// 解析课表文本行，返回结构化数据
const parseScheduleLines = (lines) => {
  const courses = [];
  const WEEKDAYS_SHORT = ['周一','周二','周三','周四','周五','周六','周日'];
  const WEEKDAY_RE = /^(周[一二三四五六日])\s+(.+)/;
  for (const line of lines) {
    const dayMatch = line.match(WEEKDAY_RE);
    if (!dayMatch) continue;
    const day = dayMatch[1];
    const rest = dayMatch[2];

    // 一行可能有多个课程（同一单元格多门课），尝试按课程名分割
    // 匹配 "课程名  (X-X节)..." 模式
    const parts = rest.match(/[^★●@\s]+[★●@]?\s*\(\d+-\d+节\)[^(]*/g);
    if (parts) {
      parts.forEach(part => {
        const info = parseCourseItem(part);
        if (info) courses.push({ ...info, day });
      });
    } else {
      const info = parseCourseItem(rest);
      if (info) courses.push({ ...info, day });
    }
  }
  return courses;
};

const inferTableFromText = (lines) => {
  if (lines.length === 0) return { headers: ['内容'], rows: [] };

  // 过滤明显不是数据的行（太短、全是符号、页码等）
  const cleanLines = lines
    .map(l => l.trim())
    .filter(l => l.length > 1 && !/^(第\s*\d+\s*页|Page\s*\d+|\d+\s*\/\s*\d+)$/i.test(l))
    .filter(l => !/^[=\-—–_]{3,}$/.test(l)); // 去除分隔线

  if (cleanLines.length === 0) return { headers: ['内容'], rows: lines.map(l => ({ '内容': l.trim() })) };

  // 多策略检测分隔符
  const samples = cleanLines.slice(0, Math.min(20, cleanLines.length));

  const strategies = [
    { name: 'tab',     pattern: '\t',          isRegex: false },
    { name: 'pipe',    pattern: '|',           isRegex: false },
    { name: 'semicolon', pattern: ';',         isRegex: false },
    { name: 'chinese_comma', pattern: '，',    isRegex: false },
    { name: 'comma',   pattern: ',',           isRegex: false },
    { name: 'multi_space', pattern: /\s{2,}/,  isRegex: true },
  ];

  let bestDelimiter = null;
  let bestScore = 0;

  for (const strat of strategies) {
    let matchCount = 0;
    let colCounts = [];
    for (const line of samples) {
      let cols;
      if (strat.isRegex) {
        cols = line.split(strat.pattern).filter(Boolean);
      } else {
        cols = line.split(strat.pattern);
      }
      if (cols.length >= 2) {
        matchCount++;
        colCounts.push(cols.length);
      }
    }
    // 评分：匹配行数 + 列数一致性（标准差越小越好）
    if (matchCount >= 2) {
      const avg = colCounts.reduce((a, b) => a + b, 0) / colCounts.length;
      const variance = colCounts.reduce((s, c) => s + (c - avg) ** 2, 0) / colCounts.length;
      const consistency = Math.max(0, 1 - Math.sqrt(variance) / avg);
      const score = matchCount * consistency;
      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = strat;
      }
    }
  }

  if (bestDelimiter && bestScore > 1.0) {
    // 按分隔符解析
    const allRows = cleanLines.map(line => {
      if (bestDelimiter.isRegex) {
        return line.split(bestDelimiter).map(s => s.trim()).filter(Boolean);
      }
      return line.split(bestDelimiter).map(s => s.trim());
    });

    const maxCols = Math.max(...allRows.map(r => r.length));

    // 智能判断第一行是否为表头：短行、纯中文/英文、不含数字比例低
    const firstRow = allRows[0];
    const isHeader = firstRow.length >= 2
      && firstRow.every(c => c.length < 30)
      && firstRow.some(c => /[一-鿿]/.test(c) || /^[a-zA-Z_]+$/.test(c));

    const headers = isHeader
      ? firstRow
      : Array.from({ length: maxCols }, (_, i) => `列${i + 1}`);
    const dataRows = (isHeader ? allRows.slice(1) : allRows)
      .filter(r => r.some(c => c && c.trim()));

    const normalized = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
      return obj;
    });

    return { headers, rows: normalized };
  }

  // 无分隔符 → 每行作为单列
  const rows = cleanLines.map(line => ({ '内容': line.trim() }));
  return { headers: ['内容'], rows };
};

// ====== 组件 ======

const formatImportResult = (result, fallbackCount) => {
  if (!result || typeof result !== 'object') return `成功导入 ${fallbackCount} 条记录`;
  const parts = [];
  if (typeof result.ok === 'number') parts.push(`成功 ${result.ok} 条`);
  if (result.merged > 0) parts.push(`合并 ${result.merged} 条`);
  if (result.fail > 0) parts.push(`失败 ${result.fail} 条`);
  if (result.skipped > 0) parts.push(`跳过 ${result.skipped} 条`);
  return parts.length ? `导入完成：${parts.join('，')}` : `成功导入 ${fallbackCount} 条记录`;
};

const ImportModal = ({ open, onClose, onImport, title = '导入数据', extraFields = [], mode = 'task' }) => {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [error, setError] = useState('');
  const [parseProgress, setParseProgress] = useState(0);    // 解析进度
  const [parseActive, setParseActive] = useState(false);     // 是否正在解析
  const [parseStatus, setParseStatus] = useState('');        // 解析状态文字
  const [importProgress, setImportProgress] = useState(0);   // 导入进度
  const [importing, setImporting] = useState(false);

  // 文件选择 + 解析
  const handleFile = useCallback(async (file) => {
    setError('');
    setFile(file);
    setParseProgress(0);
    setParseActive(true);

    const ext = file.name.split('.').pop().toLowerCase();
    const isPdfOrImage = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext);
    setParseStatus(isPdfOrImage ? '正在提取文字...' : '正在解析文件...');

    try {
      const result = await parseFile(file, {
        onProgress: (p) => {
          const val = typeof p === 'number' ? p : (parseProgress + 1); // fallback for object calls
          setParseProgress(val);
          if (val < 20) setParseStatus('正在读取文件...');
          else if (val < 25) setParseStatus('检测到扫描件，正在渲染页面...');
          else if (val < 95) setParseStatus('正在 OCR 识别图片文字...');
          else setParseStatus('解析完成');
        },
      });
      setHeaders(result.headers);
      setRows(result.rows);
      setColumnMap(buildAutoMap(result.headers));
      setStep('preview');
    } catch (err) {
      setError(err.message);
    } finally {
      setParseActive(false);
      setParseProgress(100);
    }
    return false;
  }, []);

  const handleReset = () => {
    setStep('upload'); setFile(null);
    setHeaders([]); setRows([]); setColumnMap({});
    setError(''); setParseProgress(0); setParseActive(false);
    setImportProgress(0); setImporting(false);
  };

  const handleClose = () => { handleReset(); onClose(); };

  // 确认导入（带进度动画反馈）
  const handleConfirmImport = async () => {
    if (!rows.length) { message.warning('无数据可导入'); return; }

    const mapped = rows.map((row, idx) => {
      const item = {};
      headers.forEach(h => {
        const field = columnMap[h];
        if (field) item[field] = row[h];
      });
      return item;
    });

    setImporting(true);
    setImportProgress(0);

    // 平滑进度动画
    const progressTimer = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) return prev;
        // 越往后增速越慢
        const increment = Math.max(1, Math.round((90 - prev) / 8));
        return Math.min(90, prev + increment);
      });
    }, 300);

    try {
      const result = await onImport(mapped, rows, headers);
      clearInterval(progressTimer);
      setImportProgress(100);
      message.success(formatImportResult(result, mapped.length));
      setTimeout(() => handleClose(), 600);
    } catch (err) {
      clearInterval(progressTimer);
      message.error(err.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const mappedCount = Object.values(columnMap).filter(Boolean).length;
  const hasTitle = Object.values(columnMap).includes('title');
  const defaultFieldOptions = [
    { value: 'title', label: '📝 标题' },
    { value: 'description', label: '📄 描述' },
    { value: 'status', label: '📊 状态' },
    { value: 'priority', label: '🚩 优先级' },
    { value: 'category', label: '📁 分类' },
    { value: 'due_date', label: '📅 截止日期' },
    { value: 'assignee', label: '👤 负责人' },
  ];
  const scheduleFieldOptions = [
    { value: 'title', label: '📝 课程名' },
    { value: 'weekday', label: '📅 星期' },
    { value: 'start_time', label: '🕘 开始时间' },
    { value: 'end_time', label: '🕙 结束时间' },
    { value: 'location', label: '📍 地点' },
    { value: 'teacher', label: '👨‍🏫 教师' },
    { value: 'description', label: '📄 备注' },
  ];
  const fieldOptions = mode === 'schedule'
    ? scheduleFieldOptions
    : [...defaultFieldOptions, ...extraFields];

  const previewColumns = [
    { title: '#', dataIndex: '_idx', width: 40, render: (_, __, idx) => idx + 1 },
    ...headers.slice(0, 6).map(h => ({
      title: (
        <div className={s.colHeader}>
          <span className={s.colName}>{h}</span>
          <Select size="small" value={columnMap[h] || ''}
            onChange={(val) => setColumnMap(prev => ({ ...prev, [h]: val || undefined }))}
            placeholder="忽略" allowClear style={{ width: 90 }} className={s.colSelect}
          >
            {fieldOptions.map(f => <Select.Option key={f.value} value={f.value}>{f.label}</Select.Option>)}
          </Select>
        </div>
      ),
      dataIndex: h, key: h, ellipsis: true,
      render: (val) => <Text style={{ fontSize: 12 }}>{String(val ?? '')}</Text>,
    })),
  ];

  return (
    <Modal title={title} open={open} onCancel={handleClose} width={760}
      footer={
        (parseActive || importing) ? (
          <Button onClick={handleClose} danger>取消操作</Button>
        ) : step === 'preview' ? [
          <Button key="back" onClick={() => { setStep('upload'); setFile(null); setError(''); }}>重新选择</Button>,
          <Button key="import" type="primary" loading={importing} onClick={handleConfirmImport} disabled={!hasTitle}>
            确认导入 {rows.length} 条
          </Button>,
        ] : null
      }
      destroyOnHidden
    >
      {/* Step 1: 上传 */}
      {step === 'upload' && !parseActive && (
        <div className={s.uploadArea}>
          <Dragger
            beforeUpload={handleFile} showUploadList={false} multiple={false}>
            <p className={s.uploadIcon}><InboxOutlined /></p>
            <p className={s.uploadText}>点击或拖拽文件到此处</p>
            <div className={s.uploadHint}>
              <Tag icon={<FileTextOutlined />} color="blue">CSV</Tag>
              <Tag icon={<FileExcelOutlined />} color="green">Excel</Tag>
              <Tag icon={<FileOutlined />} color="orange">JSON</Tag>
              <Tag icon={<FilePdfOutlined />} color="red">PDF</Tag>
              <Tag icon={<FileImageOutlined />} color="purple">图片</Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
              自动识别文件类型（支持文件头魔数检测），PDF/图片需提取文字后转为表格
            </Text>
          </Dragger>
          {error && <Alert type="error" message={error} style={{ marginTop: 12 }} showIcon closable onClose={() => setError('')} />}
        </div>
      )}

      {/* 解析进度 */}
      {parseActive && (
        <div className={s.progressBlock}>
          <div className={s.progressIcon}><LoadingOutlined spin /></div>
          <Text strong style={{ fontSize: 15 }}>{parseStatus}</Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{file?.name}</Text>
          <Progress percent={parseProgress} strokeColor="#e85d3a" showInfo={false}
            style={{ marginTop: 16 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{parseProgress}%</Text>
        </div>
      )}

      {/* 导入进度 */}
      {importing && (
        <div className={s.progressBlock}>
          <div className={s.progressIcon}><LoadingOutlined spin /></div>
          <Text strong style={{ fontSize: 15 }}>正在导入数据...</Text>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {rows.length} 条记录
          </Text>
          <Progress percent={importProgress} strokeColor={{ '0%': '#e85d3a', '100%': '#3d8c5c' }}
            style={{ marginTop: 16 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{importProgress}%</Text>
        </div>
      )}

      {/* Step 2: 预览 */}
      {step === 'preview' && (
        <div>
          <div className={s.previewHeader}>
            <Space wrap>
              <Tag color="blue">{file?.name}</Tag>
              <Text type="secondary">{rows.length} 行 · {headers.length} 列 · {mappedCount} 字段已映射</Text>
              {bestDelimiterLabel(headers)}
            </Space>
            {!hasTitle && (
              <Alert type="warning" message="请至少将一列映射为「📝 标题」" style={{ marginTop: 8 }} showIcon />
            )}
          </div>
          <Table columns={previewColumns}
            dataSource={rows.slice(0, 10).map((r, i) => ({ ...r, _idx: i }))}
            rowKey="_idx" size="small" scroll={{ x: 'max-content' }}
            pagination={false} className={s.previewTable} />
          {rows.length > 10 && (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
              ... 还有 {rows.length - 10} 行未显示
            </Text>
          )}
        </div>
      )}
    </Modal>
  );
};

// 显示检测到的分隔符标签
const bestDelimiterLabel = (headers) => {
  if (headers.length <= 1) return null;
  if (headers[0] === '列1' && headers.length > 1) {
    return <Tag color="orange">自动提取表头</Tag>;
  }
  return <Tag color="green">表头已识别</Tag>;
};

export { matchField, parseFile };
export default ImportModal;
