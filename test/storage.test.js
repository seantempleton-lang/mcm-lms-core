import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFilename } from '../src/utils/storage.js';

test('validateFilename accepts simple document names', () => {
  assert.equal(validateFilename('jsa-marine-floating-barge-drilling.pdf'), 'jsa-marine-floating-barge-drilling.pdf');
});

test('validateFilename rejects path traversal and nested paths', () => {
  assert.throws(() => validateFilename('../secret.pdf'), /Invalid document name/);
  assert.throws(() => validateFilename('folder/secret.pdf'), /Invalid document name/);
  assert.throws(() => validateFilename(''), /Invalid document name/);
});
