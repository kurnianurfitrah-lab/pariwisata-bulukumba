import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWebsiteInput } from '../../src/utils/websiteUrl.js';

test('restaurant website input adds HTTPS to common bare URLs', () => {
  assert.equal(
    normalizeWebsiteInput('restoran.example/menu'),
    'https://restoran.example/menu'
  );
  assert.equal(
    normalizeWebsiteInput('  www.restoran.example  '),
    'https://www.restoran.example'
  );
});

test('restaurant website input preserves explicit schemes for backend validation', () => {
  assert.equal(
    normalizeWebsiteInput('http://restoran.example'),
    'http://restoran.example'
  );
  assert.equal(
    normalizeWebsiteInput('javascript:alert(1)'),
    'javascript:alert(1)'
  );
  assert.equal(normalizeWebsiteInput('   '), '');
});
