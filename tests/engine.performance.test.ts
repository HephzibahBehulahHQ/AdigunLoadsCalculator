import { expect, it } from 'vitest';
import { createLoad, createProject } from '../src/domain/project';
import { calculateProject } from '../src/engine/electrical';
import { simulateRange } from '../src/engine/simulation';
import type { Phase } from '../src/domain/types';

it('verifies a 1,000-row project and a calendar-year 15-minute energy simulation', () => {
  const project = createProject('Analytical performance fixture');
  project.loads = Array.from({ length: 1000 }, (_, index) => createLoad({ name: `Analytical 1 kW load ${index + 1}`, rating: 1, hoursPerDay: 24, startHour: 0, phase: (['L1', 'L2', 'L3'] as Phase[])[index % 3], source: { kind: 'estimate', reference: 'Independent constant-power performance fixture.' } }));
  const editingDurations: number[] = [];
  for (let index = 0; index < 30; index++) {
    project.loads[index].rating = 1 + index / 1000;
    const start = performance.now(); calculateProject(project); editingDurations.push(performance.now() - start);
    project.loads[index].rating = 1;
  }
  editingDurations.sort((a, b) => a - b);
  const heapBefore = process.memoryUsage().heapUsed;
  const start = performance.now();
  const result = simulateRange(project, { start: '2026-01-01T00:00:00+01:00', end: '2027-01-01T00:00:00+01:00', intervalMinutes: 15 });
  const elapsedMs = performance.now() - start;
  expect(result.points).toHaveLength(35040);
  expect(result.totalKWh).toBeCloseTo(8_760_000, 4);
  expect(result.elapsedHours).toBe(8760);
  console.info(JSON.stringify({ benchmark: '1000-loads-2026-15-minute', runtime: process.version, rows: 1000, intervals: result.points.length, elapsedMs: Math.round(elapsedMs), editP95Ms: Number(editingDurations[Math.ceil(editingDurations.length * 0.95) - 1].toFixed(2)), heapDeltaMiB: Number(((process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024).toFixed(2)), note: 'Node computation timing and heap delta only; not browser interaction latency or measured peak memory.' }));
}, 60000);
