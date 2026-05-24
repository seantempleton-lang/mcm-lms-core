import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomPassword, hashPassword, verifyPassword } from '../src/utils/password.js';

test('generateRandomPassword returns alphanumeric passwords at the requested length', () => {
  const password = generateRandomPassword(16);

  assert.equal(password.length, 16);
  assert.match(password, /^[A-Za-z0-9]+$/);
});

test('hashPassword and verifyPassword accept the original password only', async () => {
  const hash = await hashPassword('correct horse battery staple');

  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
});
