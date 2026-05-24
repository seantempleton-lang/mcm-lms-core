import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleCreateSchema } from '../src/validators.js';

const baseModule = {
  title: 'Example Module',
};

test('moduleCreateSchema accepts structured JSON contentBody data', () => {
  const parsed = moduleCreateSchema.safeParse({
    ...baseModule,
    contentBody: {
      title: 'Structured module',
      slides: [{ id: 'intro', type: 'hero' }],
    },
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.contentBody.slides[0].id, 'intro');
});

test('moduleCreateSchema parses legacy JSON string contentBody data', () => {
  const parsed = moduleCreateSchema.safeParse({
    ...baseModule,
    contentBody: JSON.stringify({
      title: 'Legacy string module',
      quiz: [{ id: 'q1' }],
    }),
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.contentBody.quiz[0].id, 'q1');
});

test('moduleCreateSchema rejects non-json contentBody strings', () => {
  const parsed = moduleCreateSchema.safeParse({
    ...baseModule,
    contentBody: 'not json',
  });

  assert.equal(parsed.success, false);
});
