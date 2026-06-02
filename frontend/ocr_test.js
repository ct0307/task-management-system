const Tesseract = require('tesseract.js').default;

(async () => {
  const imgPath = 'C:\\Users\\chentao\\Desktop\\135c639c-b70a-4572-a24b-b6c1ee3a3a66.png';
  console.log('正在 OCR 识别...');
  const { data: { text } } = await Tesseract.recognize(imgPath, 'chi_sim+eng', {
    logger: m => { if (m.status === 'recognizing text') process.stdout.write(`\r进度: ${Math.round(m.progress*100)}%`); }
  });
  console.log('\n\n=== 识别结果 ===\n');
  console.log(text);
})();
