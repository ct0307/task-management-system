import importlib
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _server():
    sys.modules.pop("parse_mcp_server", None)
    return importlib.import_module("parse_mcp_server")


class McpServerTests(unittest.TestCase):
    def test_module_imports(self):
        self.assertIsNotNone(_server())

    def test_initialize_returns_protocol_and_server_information(self):
        response = _server().handle_request({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
        })

        self.assertEqual(response["jsonrpc"], "2.0")
        self.assertEqual(response["id"], 1)
        self.assertEqual(response["result"]["protocolVersion"], "2024-11-05")
        self.assertEqual(response["result"]["serverInfo"]["name"], "parse-engine")

    def test_tools_list_exposes_all_parser_tools(self):
        response = _server().handle_request({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
        })

        names = {tool["name"] for tool in response["result"]["tools"]}
        self.assertEqual(names, {"parse_file", "parse_pdf", "ocr_image", "parse_docx"})

    def test_missing_file_returns_readable_tool_result(self):
        response = _server().handle_request({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "parse_file",
                "arguments": {"filepath": "missing-file.pdf"},
            },
        })

        text = response["result"]["content"][0]["text"]
        self.assertIn("文件不存在", text)

    def test_unknown_method_returns_method_not_found(self):
        response = _server().handle_request({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "unknown/method",
        })

        self.assertEqual(response["error"]["code"], -32601)

    def test_initialized_notification_has_no_response(self):
        response = _server().handle_request({
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
        })

        self.assertIsNone(response)


if __name__ == "__main__":
    unittest.main()

