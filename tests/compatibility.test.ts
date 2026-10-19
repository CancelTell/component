import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessCandidate, estimatePower, runChecks, type Build, type CheckStatus } from '@/lib/compatibility';
import { board, cooler, cpu, gpu, pcCase, psu, ram, ssd } from './helpers';

const status = (build: Build, id: string): CheckStatus => runChecks(build).find((c) => c.id === id)!.status;

test('empty build: every check waits for parts', () => {
  assert.ok(runChecks({}).every((c) => c.status === 'pending'));
});

test('socket must match', () => {
  assert.equal(status({ cpu: cpu(), motherboard: board() }, 'cpu-mb'), 'ok');
  assert.equal(status({ cpu: cpu(), motherboard: board({ socket: 'AM4', chipset: 'B550' }) }, 'cpu-mb'), 'fail');
});

test('Ryzen 9000 on a 600-series board asks for a BIOS update', () => {
  const build = { cpu: cpu({}, 'Ryzen 7 9700X'), motherboard: board({ chipset: 'B650' }) };
  const check = runChecks(build).find((c) => c.id === 'cpu-mb')!;
  assert.equal(check.status, 'warn');
  assert.match(check.message, /BIOS/);
  assert.ok(check.details);
});

test('memory generation and slot count', () => {
  assert.equal(status({ cpu: cpu(), ram: ram({ memType: 'DDR4' }) }, 'cpu-ram'), 'fail');
  assert.equal(status({ motherboard: board({ memSlots: 2 }), ram: ram({ modules: 4 }) }, 'mb-ram'), 'fail');
  assert.equal(status({ motherboard: board(), ram: ram() }, 'mb-ram'), 'ok');
});

test('power: margin, borderline and not enough', () => {
  const base = { cpu: cpu({ tdp: 120 }), gpu: gpu({ tdp: 300, recPsu: 750 }) };
  assert.equal(estimatePower(base).draw, 495);
  assert.equal(status({ ...base, psu: psu({ wattage: 850 }) }, 'psu'), 'ok');
  assert.equal(status({ ...base, psu: psu({ wattage: 550 }) }, 'psu'), 'warn');
  assert.equal(status({ ...base, psu: psu({ wattage: 450 }) }, 'psu'), 'fail');
});

test('big cards: 12V-2x6 known / missing / unknown', () => {
  const big = gpu({ tdp: 320 });
  assert.equal(status({ gpu: big, psu: psu({ highPower: true }) }, 'psu-gpu'), 'ok');
  assert.equal(status({ gpu: big, psu: psu({ highPower: false }) }, 'psu-gpu'), 'warn');
  assert.equal(status({ gpu: big, psu: psu() }, 'psu-gpu'), 'unknown');
  assert.equal(status({ gpu: gpu({ tdp: 200 }), psu: psu() }, 'psu-gpu'), 'ok');
});

test('cooler: mount, power, height, radiator', () => {
  assert.equal(status({ cooling: cooler({ sockets: ['LGA1700'] }), cpu: cpu() }, 'cooler-cpu'), 'fail');
  assert.equal(status({ cooling: cooler({ maxTdp: 150 }), cpu: cpu({ tdp: 170 }) }, 'cooler-cpu'), 'warn');
  assert.equal(status({ cooling: cooler({ height: 170 }), case: pcCase() }, 'cooler-case'), 'fail');
  assert.equal(status({ cooling: cooler({ type: 'СЖО', height: null, radiator: 360 }), case: pcCase({ maxRadiator: 280 }) }, 'cooler-case'), 'fail');
  assert.equal(status({ cooling: cooler(), case: pcCase(), ram: ram({ height: 56 }) }, 'cooler-case'), 'warn');
});

test('two NVMe drives need two M.2 slots', () => {
  assert.equal(status({ storage: ssd(), storage2: ssd(), motherboard: board({ m2: 2 }) }, 'storage'), 'ok');
  assert.equal(status({ storage: ssd(), storage2: ssd(), motherboard: board({ m2: 1 }) }, 'storage'), 'fail');
  assert.equal(status({ storage: ssd({ type: 'SATA' }), motherboard: board({ m2: 0 }) }, 'storage'), 'ok');
});

test('case: board size and card length (unknown length is not «fits»)', () => {
  assert.equal(status({ case: pcCase({ boards: ['mATX'] }), motherboard: board() }, 'case-mb'), 'fail');
  assert.equal(status({ case: pcCase(), gpu: gpu({ length: 300 }) }, 'case-gpu'), 'ok');
  assert.equal(status({ case: pcCase(), gpu: gpu({ length: 400 }) }, 'case-gpu'), 'fail');
  assert.equal(status({ case: pcCase(), gpu: gpu() }, 'case-gpu'), 'unknown');
});

test('candidate assessment returns the worst relevant check', () => {
  const r = assessCandidate({ cpu: cpu() }, 'motherboard', board({ socket: 'AM4' }));
  assert.equal(r?.status, 'fail');
  assert.equal(assessCandidate({}, 'motherboard', board()), null);
});
