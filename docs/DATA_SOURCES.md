# Data sources and assessment coverage

## Local project evidence

Each load records entered, measured, nameplate, datasheet or estimated provenance. A user-provided URL or reference is retained as evidence; entering a URL does not independently verify its contents. A new project has no customer equipment. Worked examples are opened explicitly and remain labelled analytical reference cases.

Electricity prices, carbon factors, PV profiles, battery efficiencies, cable impedances, ampacity and device ratings are entered inputs. Default planning assumptions are labelled in the project model. They are not live tariffs, measured telemetry, guaranteed manufacturer ratings or current statutory limits.

## Primary methodological references

These are engineering-guide references, not licensed normative datasets or automatic installation approvals:

- [Schneider Electric: calculation of voltage drop](https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions).
- [Schneider Electric: general cable-sizing method](https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing).
- [Schneider Electric: neutral conductor and harmonic considerations](https://www.electrical-installation.org/enwiki/Sizing_the_neutral_conductor).
- [Schneider Electric: induction motors](https://www.electrical-installation.org/enwiki/Induction_motors).
- [Schneider Electric: maximum demand estimation](https://www.electrical-installation.org/enwiki/Estimation_of_actual_maximum_kVA_demand).
- [Schneider Electric: short-circuit thermal withstand](https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions).

The specification identifies Germany/EU as the initial focus. No IEC or DIN VDE edition is silently selected, and no restricted normative table is reproduced. Results from manually entered criteria must identify those criteria. A missing cable, protective-device, loop-impedance, clearing-time or manufacturer datum cannot produce a pass for that check.

## What the application can establish

| Area | Evidence basis | Limit |
| --- | --- | --- |
| Electrical load and energy arithmetic | Entered ratings, connection, voltage, PF, efficiency and schedules | Supported model assumptions apply; no physical measurement is implied |
| Phase/neutral analysis | Connected load P/Q and phase assignments | Fundamental model under declared supply assumptions; unknown harmonic heating is not inferred |
| Voltage drop | Entered current and conductor impedance/length | Result applies to supplied conditions, not a cable installation certificate |
| Ampacity/protection worksheets | User-entered ratings, correction factors and fault criteria | No manufacturer discrimination/coordination approval without supplied evidence |
| PV/battery/EV planning | Entered or explicitly analytical profiles and constraints | No weather, charger, inverter or meter connection is implied |
| Customer estimates/invoices | Entered quantities, prices, tax, discount and party details | No measured quantities or legal/tax compliance is invented |
| Local assistant | Deterministic project outputs and implemented product actions | No connected generative provider is claimed without actual server configuration |

For individual toolbox inputs, formulas and boundaries, see `TOOL_METHODS.md`. For actual passing and unrun gates, see `TEST_EVIDENCE.md` and `ACCEPTANCE_MATRIX.md`.

## Accessibility and source rights

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) is the accessibility design target. Automated checks and a responsive UI do not independently establish conformance. Native-language review of Yoruba and Nigerian Pidgin remains distinct from string coverage. Logo/font provenance and licenses are in `REFERENCE_MANIFEST.md`.
