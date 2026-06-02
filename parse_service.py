"""
PDF/图片解析服务 — 使用 pytesseract + pdf2image 提取文字
POST /api/parse  { file: base64 | multipart }
返回: { text, lines }
运行时安装: python -m pip install pytesseract pdf2image Pillow
还需要安装 Tesseract-OCR: https://github.com/UB-Mannheim/tesseract/wiki
"""
import sys, os, io, json, base64, tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler

def parse_pdf(filepath):
    """PDF -> 图片 -> OCR"""
    try:
        from pdf2image import convert_from_path
        import pytesseract
    except ImportError:
        return {"error": "需要安装: python -m pip install pytesseract pdf2image Pillow"}

    try:
        images = convert_from_path(filepath, dpi=200)
    except Exception as e:
        return {"error": f"PDF 渲染失败: {e}\n需要安装 poppler: https://github.com/oschwartz10612/poppler-windows/releases"}

    all_lines = []
    for i, img in enumerate(images):
        text = pytesseract.image_to_string(img, lang='chi_sim+eng')
        all_lines.extend(text.split('\n'))
        print(f"  第{i+1}/{len(images)}页完成")

    return {"text": '\n'.join(all_lines), "lines": all_lines}

def parse_image(filepath):
    """图片 OCR"""
    try:
        from PIL import Image
        import pytesseract
    except ImportError:
        return {"error": "需要安装: python -m pip install pytesseract Pillow"}

    img = Image.open(filepath)
    text = pytesseract.image_to_string(img, lang='chi_sim+eng')
    lines = text.split('\n')
    return {"text": text, "lines": lines}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python parse_service.py <filepath> [type: pdf|image]")
        sys.exit(1)

    filepath = sys.argv[1]
    file_type = sys.argv[2] if len(sys.argv) > 2 else (
        'pdf' if filepath.lower().endswith('.pdf') else 'image'
    )

    if not os.path.exists(filepath):
        print(json.dumps({"error": f"文件不存在: {filepath}"}, ensure_ascii=False))
        sys.exit(1)

    print(f"解析中: {filepath} (类型: {file_type})")
    if file_type == 'pdf':
        result = parse_pdf(filepath)
    else:
        result = parse_image(filepath)

    if 'error' in result:
        print(json.dumps(result, ensure_ascii=False))
    else:
        # 只输出文本内容
        print('=== RESULT ===')
        print(result['text'])
        print('=== END ===')
