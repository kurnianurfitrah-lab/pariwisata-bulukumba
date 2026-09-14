import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, getPagination } from '../server.js';

test('pagination is bounded and cannot inject SQL fragments', () => {
  assert.deepEqual(getPagination({ page: '-1', limit: '10 OFFSET 0' }), {
    page: 1,
    limit: 10,
    offset: 0,
  });
  assert.deepEqual(getPagination({ page: '2', limit: '5000' }), {
    page: 2,
    limit: 100,
    offset: 100,
  });
});

test('liveness endpoint works without querying the database', async () => {
  const response = await request(app).get('/api/health/live');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.match(response.headers['x-content-type-options'], /nosniff/i);
});

test('legacy root API routes are not exposed', async () => {
  const response = await request(app).get('/health/live');
  assert.equal(response.status, 404);
});

test('admin endpoints require an HttpOnly session cookie', async () => {
  const response = await request(app).get('/api/admin/session');
  assert.equal(response.status, 401);
});

test('state-changing requests reject an untrusted origin before database access', async () => {
  const response = await request(app)
    .post('/api/admin/login')
    .set('Origin', 'https://attacker.example')
    .send({ username: 'admin', password: 'not-a-real-password' });

  assert.equal(response.status, 403);
  assert.equal(response.body.message, 'Origin tidak diizinkan');
});

test('JSON request bodies are limited', async () => {
  const response = await request(app)
    .post('/api/reviews')
    .send({ komentar: 'x'.repeat(1024 * 1024 + 1) });

  assert.equal(response.status, 413);
});
