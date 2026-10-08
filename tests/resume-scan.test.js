const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateScanText } = require('../lib/scanValidation.ts');
const { signScan, verifyScan } = require('../lib/scanReceipt.ts');

const resume = 'EDUCATION Computer Science University. EXPERIENCE Software engineering internship. SKILLS Python SQL JavaScript. ' +
  'Developed applications and collaborated with teams to deliver reliable software and improve operational efficiency. '.repeat(8);

test('readable resume text passes; blank, partial, and unreliable OCR are blocked', () => {
  assert.equal(validateScanText(resume, 92, Array(100).fill(92)), null);
  assert.match(validateScanText('', 95, []), /Too little/);
  assert.match(validateScanText('EDUCATION Jane Smith', 95, [95, 95, 95]), /Too little/);
  assert.match(validateScanText(resume, 55, Array(100).fill(55)), /not clear/);
  assert.match(validateScanText(resume, NaN, Array(100).fill(90)), /not clear/);
  assert.match(validateScanText(resume, 90, [...Array(50).fill(90), ...Array(50).fill(20)]), /not clear/);
  assert.match(validateScanText('A shopping list with groceries and other household products. '.repeat(30), 95, Array(100).fill(95)), /resume content/);
});

test('scan proof is bound to exact PDF bytes, server key, and expiration', () => {
  const pdf = Buffer.from('%PDF-1.4 synthetic searchable resume');
  const now = 1791378000000;
  const proof = signScan(pdf, 'test-key', now);
  assert.equal(verifyScan(pdf, proof, 'test-key', now + 1000), true);
  assert.equal(verifyScan(Buffer.from('modified resume'), proof, 'test-key', now), false);
  assert.equal(verifyScan(pdf, proof, 'different-key', now), false);
  assert.equal(verifyScan(pdf, proof, 'test-key', now + 30 * 60 * 1000), false);
  assert.equal(verifyScan(pdf, 'not-a-proof', 'test-key', now), false);
  assert.equal(verifyScan(pdf, proof, '', now), false);
  assert.throws(() => signScan(pdf, ''), /unavailable/);
});
