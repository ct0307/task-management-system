# 本地文件解析服务设计

## 目标

提供一个本地 Python 服务，统一处理 PDF / 图片 / Word 的解析，通过两种方式调用：
1. **MCP Server** → Claude Code 编程时直接调用
2. **HTTP API** → 项目后端调用，供前端 ImportModal 使用

## 架构

```
┌─────────────────┐     MCP协议      ┌──────────────┐
│  Claude Code     │ ───────────────→ │  parse-mcp   │
│  (编程时)        │                  │  (stdio)     │
└─────────────────┘                  │              │
                                     │  ┌─────────┐ │
┌─────────────────┐   HTTP POST      │  │ Python  │ │
│  项目后端        │ ───────────────→ │  │ 解析引擎 │ │
│  localhost:3000  │  /api/parse      │  └─────────┘ │
└─────────────────┘                  └──────────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                      pdfplumber     pytesseract     python-docx
                      (PDF文字)      (图片OCR)       (Word)
```

## 解析引擎能力

| 函数 | 输入 | 输出 | 依赖 |
|------|------|------|------|
| `parse_pdf(filepath)` | .pdf | {text, pages} | pdfplumber |
| `ocr_pdf(filepath)` | .pdf (扫描件) | {text, pages} | pdf2image + pytesseract |
| `ocr_image(filepath)` | .png .jpg .webp | {text} | pytesseract + Pillow |
| `parse_docx(filepath)` | .docx | {text, paragraphs} | python-docx |

## MCP Server 暴露的工具

- `parse_file(filepath)` — 自动识别类型，返回解析文本
- `parse_pdf_to_table(filepath)` — PDF 表格提取

## HTTP API

- `POST /api/parse` — 接收文件，返回解析结果（JSON）

## 部署步骤

1. 安装 Python 包：pip install pdfplumber pytesseract pdf2image python-docx Pillow mcp
2. 安装系统工具：Tesseract-OCR + poppler (Windows)
3. 配置 MCP：在 `~/.claude/mcp.json` 注册
4. 在项目后端添加 `/api/parse` 路由调用 Python 脚本
