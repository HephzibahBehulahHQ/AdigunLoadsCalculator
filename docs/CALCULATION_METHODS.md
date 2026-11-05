# Calculation methods and boundaries

## Units and result trace

Project input retains its explicit entry mode and engineering units. Electrical power is represented in kW, apparent power in kVA, reactive power in kvar, current in A, voltage in V, energy in kWh and time in hours or elapsed instants. The deterministic engine records the project revision, engine version, method, assumptions, source references and assessment state. Presentation rounding must not change engineering calculations.

Installed rating, on-state operating demand, coincident design demand, starting demand and integrated energy are separate quantities. A cycling duty fraction changes average energy within the scheduled window; it does not reduce equipment on-state current. Efficiency converts a motor's shaft output to electrical input only when shaft-output entry is selected.

## Electrical input

- DC: `P = VI`.
- Single-phase sinusoidal AC: `P = VI × PF`.
- Balanced three-phase sinusoidal AC: `P = √3 × VLL × I × PF`.
- Shaft-output motor: `Pin = Pshaft / efficiency`.
- Displacement reactive power: `Q = ±P × tan(acos(PF))`; the sign is explicitly leading or lagging.
- Compatible power at one boundary: sum real power and signed reactive power, then calculate `S = sqrt(P² + Q²)`.
- True PF alone does not establish a fundamental phase angle or harmonic spectrum.

Loads retain individual currents even when reactive powers cancel at the boundary. Phase assignments are preserved; a three-phase total is not used as a fictitious identical current for an unbalanced board. Explicit line-to-line and complex-power entries have their own validation. The engine's trace is the authoritative supported-model statement for a result.

## Schedules, storage and tariffs

Energy is integrated as `Σ(Pinterval × elapsed hours)`. A quick daily or 30-day planning estimate is distinct from a calendar simulation. Calendar-aware operations must use actual elapsed instants and declared timezone behavior; a DST day is not assumed to be 24 hours.

Physical PV import/export and battery conversion are calculated before tariff billing. Stored battery energy increases by accepted AC charge energy times charge efficiency; delivering AC energy consumes stored energy divided by discharge efficiency. Minimum/maximum SOC and power limits remain separate constraints. PV without an island-capable supply does not automatically serve isolated loads.

User-entered tariffs are planning assumptions unless supported by a recorded applicable tariff source. Energy, standing charges, demand charges, export credits and tax should remain inspectable. Model limits, missing inputs and failed checks appear in the issue register and trace; a partial result is not an installation approval.

## Customer billing: exact decimal arithmetic

`src/import-export/reports.ts` uses integer arithmetic with `BigInt`. User decimal strings are parsed before arithmetic; non-finite, negative, excessive-precision and excessively large values are rejected for exports.

1. Currency minor-unit precision comes from `Intl.NumberFormat`; EUR uses two decimals, JPY zero and KWD three.
2. Quantity supports at most three decimal places. Unit price supports the selected currency precision.
3. Each line is quantity × unit price, rounded half-up to the currency minor unit.
4. Subtotal is the exact sum of rounded line amounts.
5. Discount is the entered percentage of subtotal, rounded half-up.
6. Net is subtotal minus discount.
7. Tax is the entered percentage of net, rounded half-up.
8. Total is net plus tax.

Example: `2.5 × EUR 19.99 = EUR 49.975`, giving a line subtotal of EUR 49.98. A 10% discount gives EUR 5.00; net is EUR 44.98. Tax at 19% gives EUR 8.55; the final amount is EUR 53.53. This is an independent numerical fixture, not a customer bill or a tax recommendation.

Drafts may retain incomplete input so work can be recovered. PDF/CSV issue actions require valid dates, supplier, customer, document number, descriptions and priced items. PDF generation freezes the document snapshot, embeds DejaVu Sans for Unicode text, paginates tables and adds page numbers. CSV neutralizes formula-looking text fields; JSON preserves stable line IDs and entered decimal strings.

Tool-specific formulas and manufacturer/manual-data boundaries are documented in `TOOL_METHODS.md`. Actual fixture results belong in `TEST_EVIDENCE.md`; this method description does not assert that every specification gate has passed.
