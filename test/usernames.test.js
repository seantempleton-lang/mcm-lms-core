import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUsernameFromName, generateUniqueUsername } from '../src/utils/usernames.js';

test('buildUsernameFromName keeps only letters and numbers', () => {
  assert.equal(buildUsernameFromName(' Sean Templeton '), 'SeanTempleton');
  assert.equal(buildUsernameFromName('Tom-Lubbe_01'), 'TomLubbe01');
});

test('buildUsernameFromName falls back when no usable characters are present', () => {
  assert.equal(buildUsernameFromName(' --- '), 'User');
});

test('generateUniqueUsername appends a suffix after existing users', async () => {
  const existing = new Set(['SeanTempleton', 'SeanTempleton2']);
  const prisma = {
    user: {
      findFirst: async ({ where }) => existing.has(where.username) ? { id: 'existing-user' } : null,
    },
  };

  assert.equal(await generateUniqueUsername(prisma, 'Sean Templeton'), 'SeanTempleton3');
});

test('generateUniqueUsername can exclude the current user while editing', async () => {
  const prisma = {
    user: {
      findFirst: async ({ where }) => {
        assert.deepEqual(where, {
          username: 'SeanTempleton',
          NOT: { id: 'current-user' },
        });
        return null;
      },
    },
  };

  assert.equal(await generateUniqueUsername(prisma, 'Sean Templeton', 'current-user'), 'SeanTempleton');
});
