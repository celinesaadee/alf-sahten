const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/onboarding.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports: exportsObject });
const { ONBOARDING_KEY, hasFinishedWelcome, finishWelcome, welcomeDestination } = exportsObject;

test('new visitors and damaged or outdated storage still receive the welcome', () => {
  for (const value of [null, '{broken', '{}', 'null', '{"version":2,"completed":true}', '{"version":1,"completed":"true"}']) {
    assert.equal(hasFinishedWelcome({ getItem: () => value }), false);
  }
});
test('completion persists the chosen goal and prevents repeat onboarding', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  finishWelcome(storage, 'pantry');
  assert.equal(hasFinishedWelcome(storage), true);
  assert.deepEqual(JSON.parse(values.get(ONBOARDING_KEY)), { version: 1, completed: true, goal: 'pantry' });
  finishWelcome(storage, null);
  assert.equal(hasFinishedWelcome(storage), true);
});
test('blocked browser storage cannot prevent entering the app', () => {
  assert.equal(hasFinishedWelcome({ getItem: () => { throw Error('blocked'); } }), false);
  assert.doesNotThrow(() => finishWelcome({ setItem: () => { throw Error('blocked'); } }, 'save'));
});
test('goals lead to existing visitor-accessible routes', () => {
  assert.equal(welcomeDestination('pantry'), '/kitchen');
  assert.equal(welcomeDestination('save'), '/saved');
  for (const goal of ['quick', 'explore', null]) assert.equal(welcomeDestination(goal), '/discover');
});
