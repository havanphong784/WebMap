import assert from 'node:assert/strict';
import test from 'node:test';
import { createOriginChecker } from '../src/config/corsPolicy.ts';

const check = (checker, origin) =>
  new Promise((resolve) => {
    checker(origin, (error, allowed) => resolve({ error, allowed }));
  });

test('allows configured web and Capacitor origins after trimming and deduplication', async () => {
  const checker = createOriginChecker({
    frontendOrigins: ' https://aether.example,https://aether.example ',
    capacitorOrigins: ' https://localhost ',
    isDev: false,
  });

  assert.deepEqual(await check(checker, 'https://aether.example'), { error: null, allowed: true });
  assert.deepEqual(await check(checker, 'https://localhost'), { error: null, allowed: true });
});

test('allows requests without an Origin header', async () => {
  const checker = createOriginChecker({ frontendOrigins: '', capacitorOrigins: '', isDev: false });
  assert.deepEqual(await check(checker, undefined), { error: null, allowed: true });
});

test('rejects unknown production origins', async () => {
  const checker = createOriginChecker({ frontendOrigins: '', capacitorOrigins: '', isDev: false });
  const result = await check(checker, 'https://evil.example');
  assert.equal(result.allowed, undefined);
  assert.match(result.error.message, /không được phép/);
});

test('retains allow-all origin behavior only for unconfigured development', async () => {
  const checker = createOriginChecker({ frontendOrigins: '', capacitorOrigins: '', isDev: true });
  assert.deepEqual(await check(checker, 'http://localhost:5173'), { error: null, allowed: true });
});
