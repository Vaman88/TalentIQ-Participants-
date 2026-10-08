const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validateScanText } = require('../lib/scanValidation.ts');

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
