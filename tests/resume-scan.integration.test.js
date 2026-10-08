// Run with: node --conditions=react-server --test tests/resume-scan.integration.test.js
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const sharp = require('sharp');

// Compile the actual server module with local imports for standalone Node testing.
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { extractResumeScan } = require('../lib/resumeScan.ts');
const photo = bytes => new File([bytes], 'resume.png', { type: 'image/png' });

test('real OCR converts a readable resume to a searchable PDF', { timeout: 90000 }, async () => {
  const lines = [
    'JANE EXAMPLE', 'jane@example.com | 555-0100', 'EDUCATION',
    'Bachelor of Science in Computer Science', 'University of Arkansas | Graduation May 2027',
    'EXPERIENCE', 'Software Engineering Intern | Example Company',
    'Developed Python services and SQL reporting tools.',
    'Worked with engineers to improve database performance.',
    'Built automated tests for reliable software releases.',
    'Collaborated with operations teams on supply chain data.',
    'PROJECTS', 'Created a logistics dashboard using JavaScript and React.',
    'Analyzed delivery data to identify process improvements.',
    'Presented project results to faculty and student teams.',
    'SKILLS', 'Python, JavaScript, SQL, React, Git, data analysis.',
    'Strong communication, teamwork, and problem solving.',
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1800"><rect width="100%" height="100%" fill="white"/>${lines.map((line, i) => `<text x="90" y="${100 + i * 80}" font-family="Arial" font-size="32" fill="black">${line}</text>`).join('')}</svg>`;
  const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
  const result = await extractResumeScan(photo(bytes));
  assert.match(result.text, /Python/);
  assert.match(result.text, /EDUCATION/);
  assert.ok(result.confidence >= 70);
  assert.equal(result.pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(result.pdf.length < 8 * 1024 * 1024);
  // Confirm the PDF includes a text layer, not just a raster image.
  assert.match(result.pdf.toString('latin1'), /GlyphLessFont/);
  const blurred = await sharp(bytes).blur(14).png().toBuffer();
  await assert.rejects(extractResumeScan(photo(blurred)), /text|contrast|clear/i);
  // An OCR service/worker failure must never produce a PDF or approval.
  const tesseract = require('tesseract.js');
  const originalWorker = tesseract.createWorker;
  let terminated = false;
  tesseract.createWorker = async () => ({
    recognize: async () => { throw new Error('OCR engine offline'); },
    terminate: async () => { terminated = true; },
  });
  try {
    await assert.rejects(extractResumeScan(photo(bytes)), /Text extraction failed/);
    assert.equal(terminated, true);
  } finally {
    tesseract.createWorker = originalWorker;
  }
});

test('blank, dark, low-resolution, malformed, and oversized photos are rejected', async () => {
  const blank = await sharp({ create: { width: 1400, height: 1800, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(extractResumeScan(photo(blank)), /contrast/);
  const dark = await sharp({ create: { width: 1400, height: 1800, channels: 3, background: 'black' } }).png().toBuffer();
  await assert.rejects(extractResumeScan(photo(dark)), /dark/);
  const small = await sharp({ create: { width: 400, height: 500, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(extractResumeScan(photo(small)), /resolution/);
  await assert.rejects(extractResumeScan(photo(Buffer.from('not an image'))));
  await assert.rejects(extractResumeScan(photo(Buffer.alloc(8 * 1024 * 1024 + 1))), /8 MB/);
});
