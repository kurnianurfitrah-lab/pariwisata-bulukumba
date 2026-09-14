import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSessionCookieOptions,
  normalizeImageReference,
  normalizeMapEmbedUrl,
  normalizeOptionalHttpUrl,
} from '../security.js';
import { getSafeMapEmbedUrl } from '../../src/utils/mapEmbed.js';

test('normalizeMapEmbedUrl accepts a Google Maps embed URL', () => {
  const value = 'https://www.google.com/maps/embed?pb=test';
  assert.equal(normalizeMapEmbedUrl(value), value);
});

test('normalizeMapEmbedUrl extracts a safe URL from a legacy iframe', () => {
  const iframe = '<iframe src="https://www.google.com/maps/embed?pb=legacy"></iframe>';
  assert.equal(
    normalizeMapEmbedUrl(iframe),
    'https://www.google.com/maps/embed?pb=legacy'
  );
});

test('map helpers reject scripts, HTTP, and untrusted hosts', () => {
  assert.throws(() => normalizeMapEmbedUrl('javascript:alert(1)'));
  assert.throws(() => normalizeMapEmbedUrl('http://www.google.com/maps/embed?pb=x'));
  assert.throws(() => normalizeMapEmbedUrl('https://example.com/maps/embed'));
  assert.equal(getSafeMapEmbedUrl('https://example.com/maps/embed'), null);
});

test('normalizeImageReference only accepts safe local paths or HTTP URLs', () => {
  assert.equal(normalizeImageReference('/uploads/image-1.webp'), '/uploads/image-1.webp');
  assert.equal(normalizeImageReference('legacy-image.jpg'), '/uploads/legacy-image.jpg');
  assert.equal(normalizeImageReference('https://cdn.example.com/image.jpg'), 'https://cdn.example.com/image.jpg');
  assert.throws(() => normalizeImageReference('/uploads/../secret'));
  assert.throws(() => normalizeImageReference('data:text/html,test'));
});

test('normalizeOptionalHttpUrl rejects executable protocols', () => {
  assert.equal(normalizeOptionalHttpUrl(''), null);
  assert.throws(() => normalizeOptionalHttpUrl('javascript:alert(1)'));
});

test('production session cookies are HttpOnly, Secure, and SameSite Strict', () => {
  const options = getSessionCookieOptions({
    IS_PRODUCTION: true,
    SESSION_TTL_HOURS: 12,
  });
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'strict');
  assert.equal(options.path, '/api/admin');
});
