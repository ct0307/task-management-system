const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

async function parse() {
  const pdfPath = 'C:\\Users\\chentao\\Desktop\\陈涛(2025-2026-2)课表 (2).pdf';
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data, disableWorker: true }).promise;

  console.log('页数:', pdf.numPages);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    console.log('\n--- 第', i, '页 ---');
    const lineMap = {};
    content.items.forEach(it => {
      const y = Math.round(it.transform[5]);
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push({ x: it.transform[4], str: it.str });
    });
    const sortedYs = Object.keys(lineMap).map(Number).sort((a, b) => b - a);
    sortedYs.forEach(y => {
      const items = lineMap[y].sort((a, b) => a.x - b.x);
      console.log(items.map(it => it.str).join('  '));
    });
  }
}
parse().catch(e => console.error(e.message || e));
