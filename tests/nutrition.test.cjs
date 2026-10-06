const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, context = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, ...context }, { filename: file });
  return exports;
}
const core = load('src/lib/nutrition.ts');
const foods = load('supabase/functions/nutrition-foods/foods.ts');
const food = { id: 1, description: 'Test food', portions: [], nutrients: {
  calories: 200, protein: 10, carbohydrates: 20, fat: 5, fiber: 2, sugar: 3, sodium: 100,
} };

test('parses decimals, fractions, mixed fractions and Arabic quantities; rejects ambiguity', () => {
  for (const [input, expected] of [['1/2', .5], ['1 1/2', 1.5], ['1½', 1.5], ['¾', .75], ['١٢٫٥', 12.5], ['۲,۵', 2.5], ['.5', .5]]) {
    assert.equal(core.parseNutritionQuantity(input), expected, input);
  }
  for (const input of ['', '0', '-1', '1/0', '1-2', 'to taste', 'a handful', 'Infinity', '2 cups']) {
    assert.equal(core.parseNutritionQuantity(input), null, input);
  }
});
test('converts mass units but never invents volume or item weights', () => {
  const ingredient = { ingredient: 'flour', quantity: '1/2', unit: 'kg' };
  assert.equal(core.ingredientGrams(ingredient), 500);
  assert.equal(core.ingredientGrams({ ...ingredient, quantity: '٢', unit: 'غرام' }), 2);
  assert.equal(core.ingredientGrams({ ...ingredient, quantity: '1', unit: 'lb' }), 453.59237);
  assert.equal(core.ingredientGrams({ ...ingredient, unit: 'ml' }, food), null);
  assert.equal(core.ingredientGrams({ ...ingredient, unit: '' }, food), null);
  assert.equal(core.ingredientGrams({ ...ingredient, quantity: '1', unit: 'tbsp' }, {
    ...food, portions: [{ label: '1 tbsp', amount: 1, grams: 14 }],
  }), 14);
  const portionFood = { ...food, portions: [{ label: '2 cup', amount: 2, grams: 240 }] };
  assert.equal(core.ingredientGrams({ ...ingredient, quantity: '1.5', unit: 'كوب' }, portionFood), 180);
  assert.equal(core.ingredientGrams({ ...ingredient, unit: 'cup' }, {
    ...portionFood, portions: [...portionFood.portions, { label: '1 cup chopped', amount: 1, grams: 150 }],
  }), null);
});
test('totals all nutrients per serving; absent nutrient remains unknown while zero remains zero', () => {
  const result = core.calculateNutrition([{ food, grams: 200 }, { food, grams: 100 }], 3);
  for (const key of core.nutrientKeys) assert.equal(result[key], food.nutrients[key]);
  const missing = { ...food, nutrients: { ...food.nutrients, sugar: undefined, sodium: 0 } };
  const partial = core.calculateNutrition([{ food: missing, grams: 100 }], 2);
  assert.equal(partial.sugar, undefined);
  assert.equal(partial.sodium, 0);
  assert.equal(partial.protein, 5);
  assert.throws(() => core.calculateNutrition([{ food, grams: -1 }], 1));
  assert.throws(() => core.calculateNutrition([{ food, grams: 10 }], 0));
  assert.throws(() => core.calculateNutrition([], 1));
});
test('estimate basis ignores empty rows and changes with amounts and servings', () => {
  const ingredient = { ingredient: ' rice ', quantity: '100', unit: 'g' };
  const basis = core.nutritionBasis([ingredient], '2');
  assert.equal(basis, core.nutritionBasis([ingredient, { ingredient: '', quantity: '', unit: '' }], 2));
  assert.notEqual(basis, core.nutritionBasis([ingredient], 4));
  assert.notEqual(basis, core.nutritionBasis([{ ...ingredient, quantity: '200' }], 2));
  assert.equal(core.nutritionSearchTerm('زيت زيتون'), 'olive oil');
  assert.equal(core.nutritionSearchTerm('riz'), 'rice');
  assert.equal(core.nutritionSearchTerm('cooked chicken breast'), 'cooked chicken breast');
});
test('USDA normalization respects units, energy priority, missing data and portion weights', () => {
  const normalized = foods.normalizeFood({ fdcId: 123, description: 'Rice', foodNutrients: [
    { nutrient: { id: 1008, unitName: 'kJ' }, amount: 800 },
    { nutrient: { id: 2048, unitName: 'kcal' }, amount: 190 },
    { nutrient: { id: 1003, unitName: 'g' }, amount: 4 },
    { nutrient: { id: 1093, unitName: 'mg' }, amount: 0 },
    { nutrient: { id: 1079, unitName: 'g' }, amount: -1 },
  ], foodPortions: [
    { amount: 1, gramWeight: 158, modifier: 'cup', measureUnit: { name: 'undetermined' } },
    { amount: 0, gramWeight: 100 },
  ] });
  assert.equal(normalized.nutrients.calories, 190);
  assert.equal(normalized.nutrients.protein, 4);
  assert.equal(normalized.nutrients.sodium, 0);
  assert.equal(normalized.nutrients.fiber, undefined);
  assert.equal(normalized.nutrients.sugar, undefined);
  assert.equal(normalized.portions.length, 1);
  assert.equal(normalized.portions[0].label, '1 cup');
});

test('real USDA cooked-rice data produces complete per-serving nutrition and cup conversion', () => {
  const sample = require('./fixtures/usda-rice.json');
  const normalized = foods.normalizeFood(sample);
  const values = core.calculateNutrition([{ food: normalized, grams: 200 }], 2);
  assert.equal(values.calories, 130);
  assert.equal(values.protein, 2.7);
  assert.equal(values.carbohydrates, 28.2);
  assert.equal(values.fat, .3);
  assert.equal(values.fiber, .4);
  assert.equal(values.sugar, .1);
  assert.equal(values.sodium, 1);
  assert.equal(core.ingredientGrams({ ingredient: 'cooked rice', quantity: '1', unit: 'cup' }, normalized), 158);
});

function server({ apiKey = 'test-only-key', user = { id: 'cook-1' }, fetchImpl } = {}) {
  let handler;
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-publishable', USDA_FDC_API_KEY: apiKey };
  load('supabase/functions/nutrition-foods/index.ts', {
    Request, Response, AbortSignal, Error, console: { warn() {} },
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } },
    fetch: fetchImpl ?? (() => { throw new Error('Unexpected upstream call'); }),
    require: spec => spec === './foods.ts' ? foods : spec.startsWith('npm:') ? {
      createClient: () => ({ auth: { getUser: async () => ({ data: { user }, error: user ? null : new Error('invalid') }) } }),
    } : {},
  });
  return (body = { query: 'rice' }, token = 'Bearer valid-test-token', method = 'POST') => handler(new Request('https://example.test', {
    method, headers: token ? { Authorization: token } : {},
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  }));
}
test('lookup requires a real user, validates payloads and reports missing setup safely', async () => {
  assert.equal((await server()({}, '')).status, 401);
  assert.equal((await server({ user: null })()).status, 401);
  assert.equal((await server({ user: { id: 'anonymous', is_anonymous: true } })()).status, 401);
  assert.equal((await server()({}, 'Bearer token', 'OPTIONS')).status, 200);
  assert.equal((await server()({}, 'Bearer token', 'GET')).status, 405);
  for (const payload of [null, {}, { query: 'a' }, { query: 'x'.repeat(121) }, '{malformed']) {
    assert.equal((await server()(payload)).status, 400);
  }
  const missing = await server({ apiKey: '' })();
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).code, 'notConfigured');
});
test('search fetches full food details, caches responses and translates upstream failures', async () => {
  const calls = [];
  const lookup = server({ fetchImpl: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return Response.json(url.includes('foods/search') ? { foods: [{ fdcId: 123 }] } : [{
      fdcId: 123, description: 'Rice', foodNutrients: [{ nutrient: { id: 1008, unitName: 'KCAL' }, amount: 130 }],
    }]);
  } });
  const result = await (await lookup()).json();
  assert.equal(result.foods[0].nutrients.calories, 130);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.format, 'full');
  assert.equal(calls[1].body.fdcIds[0], 123);
  await lookup();
  assert.equal(calls.length, 2);
  const limited = await server({ fetchImpl: async () => new Response('', { status: 429 }) })();
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).code, 'rateLimited');
  const failed = await server({ fetchImpl: async () => new Response('key must not leak', { status: 403 }) })();
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).code, 'invalidApiKey');
});

test('trims secret whitespace and reports provider timeouts and outages distinctly', async () => {
  let upstreamUrl;
  const lookup = server({ apiKey: '  test-only-key\n', fetchImpl: async url => {
    upstreamUrl = url;
    return Response.json({ foods: [] });
  } });
  assert.equal((await lookup()).status, 200);
  assert.equal(new URL(upstreamUrl).searchParams.get('api_key'), 'test-only-key');
  const timeout = await server({ fetchImpl: async () => {
    const error = new Error('URL must not leak'); error.name = 'TimeoutError'; throw error;
  } })();
  assert.equal((await timeout.json()).code, 'providerTimeout');
  const outage = await server({ fetchImpl: async () => new Response('', { status: 503 }) })();
  assert.equal((await outage.json()).code, 'providerUnavailable');
});
