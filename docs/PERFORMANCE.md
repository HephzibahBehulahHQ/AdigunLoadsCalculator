# Engine performance evidence

Measured on 5 November 2026 against the implementation working tree. The integration owner records the final candidate commit and full release checks in `TEST_EVIDENCE.md`.

## Reproduce

```sh
npm ci
npx vitest run tests/engine.performance.test.ts --reporter=verbose --silent=false
```

The benchmark is an explicit analytical fixture, never customer data. It creates 1,000 independent 1 kW loads, each operating continuously, distributed across L1/L2/L3. It measures 30 individual rating edits and full engine recomputations, then simulates the 2026 calendar year in Europe/Berlin at 15-minute output resolution. Actual UTC instants preserve DST transitions. Expected energy is independently known: 1,000 kW × 8,760 elapsed hours = 8,760,000 kWh. Expected output length is 35,040 intervals.

## Environment

| Property | Observed value |
| --- | --- |
| Runtime | Node.js v24.22.1 |
| Operating system / architecture | Linux / x64 |
| Reported processor | Intel Xeon Platinum 8573C |
| Reported logical CPUs | 9 |
| Reported memory | Approximately 10 GiB |
| Test runner | Vitest 5.1.0 |

Other implementation tasks were active in the shared environment. Results are an observed run, not a guaranteed service-level commitment.

## Results

| Measurement | Before profile aggregation optimization | After optimization |
| --- | ---: | ---: |
| 1,000-load edit + recomputation, p95 | 229.66 ms | 37.17 ms |
| Full calendar-year simulation | 9,147 ms | 3,947 ms |
| Heap used after run minus before run | 69.30 MiB | 61.66 MiB |
| Output intervals | 35,040 | 35,040 |
| Energy verification | Passed | Passed |

The optimized profile builder adds complete operating windows using difference arrays and integrates fractional boundary bins exactly. Its aggregation work scales with the load count plus the output interval count. The calendar engine separately integrates actual elapsed minute slices and exposes 15-minute/hourly averages. Source values are not rounded to presentation precision before integration.

## Interpretation and limits

The observed engine edit p95 of 37.17 ms is below the 200 ms computation target on this setup. This is **Node engine computation**, not measured end-to-end browser input latency, UI rendering, IndexedDB save time, browser worker startup or a WCAG/performance certification. Browser interaction measurements belong in the browser evidence.

Heap difference is **not peak memory** and can vary with garbage collection. No peak-memory claim is made. The annual simulation runs synchronously inside its engine function; the application invokes it in a worker and cancellation terminates that worker. The measured run validates numerical totals and output cardinality, not a physical model beyond the declared electrical assumptions.

Do not compare this fixture with arbitrary installations without recording their load types, schedules, tariff complexity, browser and hardware. Phase-balancing optimization has a separate bounded search and is not included in this benchmark.
