import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryById } from '@/data/categories';
import { applyFilters, emptyFilters, facetOptions, filtersToQuery, queryToFilters, sortProducts } from '@/lib/catalog';
import { searchEntries, toSearchEntry } from '@/lib/search';
import { parseShared } from '@/lib/share';
import { cpu } from './helpers';

const config = categoryById.cpu;
const list = [
  cpu({ socket: 'AM5', cores: 6 }, 'Ryzen 5 7600'),
  cpu({ socket: 'AM5', cores: 8 }, 'Ryzen 7 7700'),
  cpu({ socket: 'LGA1700', cores: 14, memory: ['DDR4', 'DDR5'] }, 'Core i5-14600K'),
  cpu({ socket: 'AM4', cores: 6, boostClock: null }, 'Ryzen 5 5600'),
];
const noPrice = () => null;

test('facet options come from the data with counts', () => {
  const sockets = facetOptions(list, config.facets.find((f) => f.key === 'socket')!);
  assert.deepEqual(sockets[0], { value: 'AM5', count: 2 });
  assert.equal(sockets.length, 3);
});

test('enum and range filters combine', () => {
  const f = emptyFilters();
  f.enums.socket = ['AM5', 'LGA1700'];
  f.ranges.cores = { min: 8 };
  assert.deepEqual(applyFilters(list, config, f, noPrice).map((p) => p.name), ['Ryzen 7 7700', 'Core i5-14600K']);
});

test('filters survive the URL round trip', () => {
  const f = emptyFilters();
  f.enums.socket = ['AM5'];
  f.ranges.cores = { min: 6, max: 8 };
  const q = filtersToQuery(config, f, { key: 'boostClock', dir: 'desc' });
  const back = queryToFilters(config, q);
  assert.deepEqual(back.filters.enums.socket, ['AM5']);
  assert.deepEqual(back.filters.ranges.cores, { min: 6, max: 8 });
  assert.deepEqual(back.sort, { key: 'boostClock', dir: 'desc' });
});

test('unknown values sort last in both directions', () => {
  const withClock = list.map((p, i) => ({ ...p, specs: { ...p.specs, boostClock: p.specs.boostClock === null ? null : 4 + i } }));
  for (const dir of ['asc', 'desc'] as const) {
    const sorted = sortProducts(withClock, { key: 'boostClock', dir }, noPrice);
    assert.equal(sorted.at(-1)!.name, 'Ryzen 5 5600');
  }
});

test('search ranks a name match first', () => {
  const hits = searchEntries(list.map(toSearchEntry), '7600');
  assert.equal(hits[0]!.name, 'Ryzen 5 7600');
  assert.equal(searchEntries(list.map(toSearchEntry), 'nothing-like-this').length, 0);
});

test('shared links: unknown slots and odd slugs are ignored', () => {
  assert.deepEqual(parseShared('cpu:amd-ryzen-5-7600,gpu:x,bogus:y,ram:<script>'), { cpu: 'amd-ryzen-5-7600', gpu: 'x' });
  assert.equal(parseShared(''), null);
});
