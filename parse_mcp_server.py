"""
文件解析 MCP Server
让 Claude Code 能直接调用 PDF/图片/Word 解析能力
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parse_engine import parse_pdf, ocr_image, parse_docx, parse

# MCP 协议：stdio 通信
def handle_request(request):
    method = request.get('method', '')
    req_id = request.get('id')

    if method == 'initialize':
        return {
            'jsonrpc': '2.0', 'id': req_id,
            'result': {
                'protocolVersion': '2024-11-05',
                'capabilities': {'tools': {}},
                'serverInfo': {'name': 'parse-engine', 'version': '1.0.0'}
            }
        }

    if method == 'tools/list':
        return {
            'jsonrpc': '2.0', 'id': req_id,
            'result': {'tools': [
                {
                    'name': 'parse_file',
                    'description': '解析任意文件（PDF/图片/Word），自动识别类型并提取文字。支持中文。对于扫描件 PDF 会自动降级为 OCR。',
                    'inputSchema': {
                        'type': 'object',
                        'properties': {
                            'filepath': {'type': 'string', 'description': '文件的绝对路径'}
                        },
                        'required': ['filepath']
                    }
                },
                {
                    'name': 'parse_pdf',
                    'description': '解析 PDF 文件，提取文字内容。先尝试文字层提取，失败则 OCR。',
                    'inputSchema': {
                        'type': 'object',
                        'properties': {
                            'filepath': {'type': 'string', 'description': 'PDF 文件的绝对路径'}
                        },
                        'required': ['filepath']
                    }
                },
                {
                    'name': 'ocr_image',
                    'description': '对图片进行 OCR 识别，提取中文和英文文字。',
                    'inputSchema': {
                        'type': 'object',
                        'properties': {
                            'filepath': {'type': 'string', 'description': '图片文件的绝对路径'}
                        },
                        'required': ['filepath']
                    }
                },
                {
                    'name': 'parse_docx',
                    'description': '解析 Word (.docx) 文件，提取段落和表格。',
                    'inputSchema': {
                        'type': 'object',
                        'properties': {
                            'filepath': {'type': 'string', 'description': '.docx 文件的绝对路径'}
                        },
                        'required': ['filepath']
                    }
                }
            ]}
        }

    if method == 'tools/call':
        tool_name = request['params']['name']
        args = request['params']['arguments']
        filepath = args.get('filepath', '')

        if not os.path.exists(filepath):
            text = f'错误: 文件不存在 - {filepath}'
        else:
            try:
                if tool_name == 'parse_pdf':
                    result = parse_pdf(filepath)
                elif tool_name == 'ocr_image':
                    result = ocr_image(filepath)
                elif tool_name == 'parse_docx':
                    result = parse_docx(filepath)
                else:
                    result = parse(filepath)

                if 'error' in result and result.get('pages') is None:
                    text = f'解析失败: {result["error"]}'
                elif 'error' in result:
                    text = f'部分成功: {result["error"]}\n\n{result.get("full_text", "")}'
                else:
                    text = result.get('full_text', result.get('text', json.dumps(result, ensure_ascii=False)))
                    if not text:
                        text = json.dumps(result, ensure_ascii=False, indent=2)
            except Exception as e:
                text = f'解析异常: {str(e)}'

        return {
            'jsonrpc': '2.0', 'id': req_id,
            'result': {
                'content': [{'type': 'text', 'text': text}]
            }
        }

    if method == 'notifications/initialized':
        return None  # 无需响应

    return {'jsonrpc': '2.0', 'id': req_id, 'error': {'code': -32601, 'message': f'Unknown method: {method}'}}

if __name__ == '__main__':
    import io
    # 确保 stdout 使用 utf-8
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    while True:
        try:
            line = sys.stdin.readline()
            if not line: break
            request = json.loads(line)
            response = handle_request(request)
            if response:
                sys.stdout.write(json.dumps(response, ensure_ascii=False) + '\n')
                sys.stdout.flush()
        except json.JSONDecodeError:
            continue
        except BrokenPipeError:
            break
