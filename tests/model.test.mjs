import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { aggregate, aggregateComponents, groupComparisons, comparison, segments, componentDefinitions } from '../docs/model.mjs';

const load = name => JSON.parse(fs.readFileSync(new URL(`../docs/${name}`, import.meta.url)));
const datasets = { primary: load('data.json'), eso: load('data-eso.json') };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} != ${expected}`);

for (const [stage, data] of Object.entries(datasets)) {
  test(`${stage}: filters match values independently verified against the source CSV`, () => {
    const selected = aggregate(data, 2025, { gender: 'D', area: 'Girona', category: 'Públic' });
    const reference = aggregate(data, 2025);
    assert.equal(selected[0].n, stage === 'primary' ? 2691 : 2946);
    close(selected[0].mean, stage === 'primary' ? 74.9470828688 : 77.005);
    assert.equal(reference[0].n, stage === 'primary' ? 66151 : 71962);
  });

  test(`${stage}: gender partitions preserve totals, sums and component counts for every year`, () => {
    for (const year of data.years) {
      const all = aggregate(data, year), girls = aggregate(data, year, { gender: 'D' }), boys = aggregate(data, year, { gender: 'H' });
      all.forEach((score, i) => {
        assert.equal(score.n, girls[i].n + boys[i].n);
        close(score.sum, girls[i].sum + boys[i].sum);
        assert.equal(score.bins.reduce((sum, n) => sum + n, 0), score.n);
        assert.ok(score.n === 0 ? score.mean === null : score.mean >= 0 && score.mean <= 100);
      });
      const components = aggregateComponents(data, year);
      const female = aggregateComponents(data, year, { gender: 'D' });
      const male = aggregateComponents(data, year, { gender: 'H' });
      for (const key of data.componentKeys) {
        assert.equal(components[key].n, female[key].n + male[key].n);
        close(components[key].sum, female[key].sum + male[key].sum);
      }
    }
  });

  test(`${stage}: peer comparisons override only their own filter`, () => {
    const filters = { gender: 'D', area: 'Girona', category: 'Públic' };
    const comparisons = groupComparisons(data, [2024, 2025], filters);
    for (const pair of comparisons) for (const row of pair.years) {
      assert.deepEqual(row.left, aggregate(data, row.year, { ...filters, [pair.key]: pair.left }));
      assert.deepEqual(row.right, aggregate(data, row.year, { ...filters, [pair.key]: pair.right }));
    }
    assert.deepEqual(groupComparisons(data, [2025], {}), []);
    assert.deepEqual(filters, { gender: 'D', area: 'Girona', category: 'Públic' });
  });

  test(`${stage}: nonexistent selections produce missing scores, never zero averages`, () => {
    for (const score of aggregate(data, 1900)) assert.deepEqual([score.n, score.mean], [0, null]);
    for (const score of Object.values(aggregateComponents(data, 2025, { area: 'Nonexistent' }))) {
      assert.deepEqual([score.n, score.mean], [0, null]);
    }
  });

  test(`${stage}: distributed data follows an aggregate-only schema`, () => {
    assert.deepEqual(Object.keys(data).sort(), ['subjects', 'years', 'areas', 'cells', 'sourceRows', 'exportDate', 'componentKeys', 'componentCells'].sort());
    for (const [year, gender, area, category, values] of data.cells) {
      assert.ok(data.years.includes(year));
      assert.ok(['D', 'H'].includes(gender));
      assert.equal(typeof area, 'string');
      assert.ok(['Públic', 'Privat'].includes(category));
      assert.equal(values.length, data.subjects.length);
      for (const [n, sum, bins] of values) {
        assert.ok(Number.isInteger(n) && n >= 0);
        assert.ok(sum >= 0 && sum <= 100 * n + 0.001);
        assert.equal(bins.length, 10);
      }
    }
  });
}

test('known coverage differences remain distinct between stages', () => {
  assert.ok(!datasets.primary.years.includes(2020));
  assert.ok(datasets.eso.years.includes(2020));
  assert.equal(aggregate(datasets.primary, 2009)[3].mean, null);
  assert.equal(aggregate(datasets.primary, 2017)[4].mean, null);
  assert.equal(aggregate(datasets.eso, 2015)[4].mean, null);
  assert.equal(componentDefinitions(datasets.primary, 'PMAT').length, 3);
  assert.equal(componentDefinitions(datasets.eso, 'PMAT').length, 4);
});

test('means weight records rather than averaging subgroup means', () => {
  const fixture = { subjects: ['PCAT'], cells: [
    [2025, 'D', 'A', 'Públic', [[1, 100, [0,0,0,0,0,0,0,0,0,1]]]],
    [2025, 'H', 'A', 'Públic', [[3, 0, [3,0,0,0,0,0,0,0,0,0]]]],
  ] };
  assert.equal(aggregate(fixture, 2025)[0].mean, 25);
});

test('comparisons retain direction and measure the absolute gap separately', () => {
  const score = mean => ({ n: 1, mean });
  const result = comparison(score(70), score(77), score(74), score(76));
  assert.equal(result.delta, 7);
  assert.equal(result.referenceDelta, 2);
  assert.equal(result.startGap, -4);
  assert.equal(result.endGap, 1);
  assert.equal(result.gapChange, -3);
  assert.equal(comparison({ n: 0 }, score(77), score(74), score(76)), null);
});

test('missing years split trend lines instead of interpolating across gaps', () => {
  assert.deepEqual(segments([{ mean: null }, { mean: 3 }, { mean: null }, { mean: 4 }, { mean: null }]), [[{ mean: 3 }], [{ mean: 4 }]]);
});
