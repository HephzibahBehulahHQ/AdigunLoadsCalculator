# Engineering toolbox methods

AdigunPowerLab implements **51 deterministic engineering worksheets** in `src/tools/`. The tools operate on entered values. They do not change a project, approve an installation, connect to equipment or call an online AI provider.

## Input and result contract

`src/tools/index.ts` exports `tools`, `toolCategories` and `getTool(id)`. Each tool provides typed input descriptors, explicit `exampleInputs`, and `calculate(values)`. Loading an example is an intentional user action: the reference values are analytical assumptions, not customer records, measurements or manufacturer claims. Numeric forms have no automatically seeded customer data.

Results include numeric/text values with units, a formula, model notes, warnings, source URLs and a calculation status. Profiles also expose a `series` array suitable for inspection or CSV export. Numerical inputs must be finite. Counts are integers where required. Profiles contain at most 4,096 intervals; mismatched lengths, empty entries and unsupported selections are rejected. Larger project simulations belong to the project engine.

`calculated` means the stated arithmetic completed. It is **not an electrical approval**. `incomplete` identifies missing user-entered evidence or compatibility information, while allowing review of the entered-data arithmetic. `unsupported` means the selected physical/ruleset model is outside the worksheet. Every evaluation returns a fresh result; removing evidence removes the previous completed assessment state.

Source fields record a reference supplied by the user; their mere presence does not independently verify a document or its applicability. No licensed IEC/DIN/VDE tables, manufacturer protection curves or assumed live resource data are embedded.

## Inventory and independently checked examples

All IDs have explicit example inputs and at least one independent fixture. Values below describe those deliberately opened examples, not a default installation.

| ID | Worksheet | Supported model and example evidence |
| --- | --- | --- |
| T01 | Ohm's law | Passive steady DC resistor; any independent input pair and consistency checking of additional values. 230 V / 23 Ω = 10 A. |
| T02 | DC power and energy | Identical steady loads. 24 V × 5 A × 2 loads × 3 h = 0.72 kWh. |
| T03 | Single-phase AC current | Sinusoidal terminal input, separate leading/lagging reactive sign. 2.3 kW at 230 V and PF 1 = 10 A. |
| T04 | Three-phase AC current | Balanced sinusoidal input at line-to-line voltage. 12 kW at 400 V and PF 1 = 17.320508 A per line. |
| T05 | Signed power triangle | Explicit signed P/Q, all quadrants and reactive-only values. 4 kW with −3 kvar has 5 kVA magnitude. |
| T06 | Resistance bank | All-series or all-parallel ideal resistors; no arbitrary-network solver. 10 Ω, 10 Ω and 20 Ω in parallel = 4 Ω. |
| T07 | Series RLC | Frequency-domain series branch. Zero capacitance means an omitted capacitor. A 100 mH inductor at 50 Hz has 31.415927 Ω reactance. |
| T08 | Units | Explicit scale/temperature pairs and voltage-dependent Ah↔Wh. 100 Ah at nominal 48 V ≈ 4,800 Wh. |
| T09 | Useful output/input | Separate motor efficiency and thermal COP. 7.5 kW shaft / 0.9 = 8.333333 kW electrical input. |
| T10 | Motor rating | Shaft-output basis, supplied efficiency/PF, balanced or single-phase current. 7.5 kW, η .9, PF .85, 400 V three phase ≈ 14.150742 A. |
| T11 | Torque/speed | Mechanical P = Tω. 100 N·m at 1,500 rpm = 15.707963 kW. |
| T12 | Slip | Even pole count and explicit frequency. 50 Hz / 4 poles gives 1,500 rpm; 1,440 rpm rotor gives 4% slip. |
| T13 | Star/delta | Equal fixed winding impedances with separately sourced voltage compatibility. A 20 Ω delta winding at 400 V draws 20 A; line current is 34.641016 A. |
| T14 | Start sequence | Separate starting/running PF and current, background P/Q, simultaneous or sequential identical motors. Two 3-second sequential starts take 6 seconds; currents use complex-power sums. |
| T15 | Conductor resistance | Entered resistivity, section, equal parallel paths and linear temperature coefficient. Analytical copper-like inputs in the example give 0.83755 Ω at 70 °C. |
| T16 | DC loop drop | Separate outgoing/return resistance. Two 0.4 Ω paths at 10 A give 8 V drop and 80 W conductor loss. |
| T17 | AC drop/rise | Single-phase equal paths or balanced three-phase small-drop approximation using one-way route length, R/X and signed phase angle. The resistive example gives 8 V. |
| T18 | Drop-based length/section | Unity-PF resistive route and user-entered criterion, with no ampacity conclusion. The worked 230 V / 3% case permits 38.333333 m at its entered conductor properties. |
| T19 | Conductor losses | Equal loaded conductors; energy duty affects energy only. Two 0.4 Ω conductors at 10 A lose 80 W on-state, or 0.32 kWh over 8 h at 50% duty. |
| T20 | Ampacity factors | Sourced base rating × applicable temperature/grouping/other factors. 30 A × .9 × .8 = 21.6 A; missing installation/table provenance remains incomplete. |
| T21 | Device checks | Separate Ib/In/Iz, entered conventional-operating-current relationship, and fault/breaking-capacity conditions. No combined installation approval. |
| T22 | Fault estimate | Stiff voltage plus series source/path R/X; single complete loop or balanced positive-sequence model. 230 V, 0.46 Ω and c .95 = 0.475 kA. |
| T23 | TN loop worksheet | Entered required-time Ia, minimum-voltage factor and matching clearing-time evidence. Example maximum Zs = 1.365625 Ω. TT/IT are explicitly outside this method. |
| T24 | Thermal withstand | Sourced let-through I²t compared with k²S²; ≤5-second adiabatic scope. k 115 and S 2.5 mm² give 82,656.25 A²s. |
| T25 | PE/bonding | PE thermal requirement plus applicable entered minimum, or a sourced bonding-minimum comparison. No unsourced universal conductor-size table. |
| T26 | Board real demand | One scalar coincidence factor, then distinct growth and added-capacity allowance. 10 kW × .8 × 1.1 × 1.2 = 10.56 kW target capacity. |
| T27 | Current imbalance | Maximum absolute deviation from mean, divided by mean. 10/20/30 A gives 50%; zero-mean state is not applicable. |
| T28 | Fundamental neutral | Vector sum of supplied fundamental current phasors. Three 10 A phasors 120° apart cancel; one 10 A phase gives 10 A neutral. |
| T29 | Transformer | Balanced rated/actual currents and supplied no-load + quadratic load-loss model. Example loading .8 gives 840 W loss. |
| T30 | Generator | Separate real/apparent steady limits, derating and a supplied start envelope. Example real-power headroom = 6 kW. No predicted voltage/frequency dip. |
| T31 | Inverter | Continuous P/S and transient P/S/duration limits; missing phase compatibility remains incomplete. No islanding or manufacturer curve is inferred. |
| T32 | UPS | Usable stored DC energy × efficiency / AC demand, plus rated-power feasibility. 2 kWh × .9 / 1 kW = 1.8 h energy-only runtime. |
| T33 | PF correction | Lagging fundamental displacement-PF correction. 10 kW from .8 to .95 needs 4.213159 kvar; useful-load energy is not automatically reduced. |
| T34 | Capacitors | Ideal single/star/delta element voltage and capacitance. 10 kvar, 400 V delta, 50 Hz gives 66.314560 µF per element. |
| T35 | Harmonic spectrum | Supplied RMS harmonic magnitudes, fundamental denominator. 10 A fundamental with 3 A and 4 A harmonics gives 50% THD. No phase spectrum is invented. |
| T36 | Battery capacity | One nominal SOC basis and once-applied discharge efficiency. 10 kWh, SOC 80%→20%, η .9 gives 5.4 kWh AC availability. |
| T37 | Battery time/rate | Constant power and entered stored-energy/power boundaries. Example has 5.4 h feasible runtime at 1 kW. No taper/discharge curve claim. |
| T38 | Storage dispatch | Chronological self-consumption, physical import/export, reserve, power limits, once-applied losses and per-step energy reconciliation. 5→6.8→4.3 kWh fixture verifies efficiencies. |
| T39 | PV yield | Separate daily peak-sun-hour estimate and supplied normalized profile with interval clipping. Daily example = 17.28 kWh AC before unresolved clipping. |
| T40 | PV string | Separate Voc/Vmp temperature coefficients, both voltage endpoints, MPPT and current checks. Example cold string Voc = 549 V; hot Vmp = 353.85 V. |
| T41 | Wind | Supplied power or linear interpolation within a supplied manufacturer curve. No extrapolation or invented curve. Example yields 3.6 kWh after an entered 10% extra loss. |
| T42 | EV session | Separate battery/AC energy and vehicle/charger/site limits. Example misses its deadline by 10.8 kWh battery energy. |
| T43 | Charging allocation | Input-order priority, fixed single-phase assignment, constant background and common time window. Example holds aggregate allocation at 10 kW and reports 12 kWh unmet battery energy. |
| T44 | Profile integration | Signed interval-average kW × actual elapsed duration. One 15-minute kW interval followed by 45 minutes at zero gives .25 kWh and .25 kW hour-average. |
| T45 | Load duration | Actual equal-interval load values sorted for the duration curve; .625 load factor for 1/2/3/4 kW. No chronological storage claim from the sorted curve. |
| T46 | Demand terminology | Explicit coincidence, diversity, demand-factor and utilization definitions at one consistent boundary. Coincidence example = .75. |
| T47 | Interval bill | Separate import/export, preassigned interval prices, aligned demand, fixed charges and explicit tax basis. 18.4 kWh × €0.30 = €5.52. |
| T48 | Replacement | Same 24-hour assumed-day active/standby service period. Example saves 21.12 kWh over 30 assumed days. |
| T49 | Carbon | Entered kg CO₂e/kWh with geography/period/method evidence. Example factor .4 is explicitly an analytical assumption, giving 400 kg for 1,000 kWh. |
| T50 | Payback | Constant undiscounted net savings. 5,000 investment / (1,200 saving − 200 maintenance) = 5 years. Nonpositive savings have no payback. |
| T51 | NPV | End-of-year cash flows, explicit escalation, fixed maintenance, residual and discount sensitivity. 1,000 investment and two 600 payments at 10% gives 41.322314 NPV. |

## Important model boundaries

Electrical input and useful mechanical/thermal output are distinct. Duty fractions do not reduce on-state cable current. Signed complex power is summed before magnitude; per-conductor thermal loading still requires its own currents. The toolbox provides no arbitrary AC network solution, floating-neutral solution, full standards-based fault study or hardware validation.

The storage worksheet uses actual equal elapsed intervals. It conserves energy at every interval, enforces reserve/capacity/power constraints and blocks grid-following operation during an outage without an explicitly entered island-capable configuration. No battery is silently precharged. The EV allocator is an inspectable priority heuristic for its stated constant-window model, not a claim of unrestricted optimization.

The tariff worksheet accepts prices already assigned to each interval. Its demand charge uses aligned interval averages; rolling windows, calendar tariff applicability and retailer-specific tax rules are not inferred. Currency choice does not perform exchange-rate conversion. Exact decimal products use integers with six input fractional digits; aggregate energy, demand, standing and tax lines each round half away from zero to two currency decimals. Summing the rounded monetary lines determines the final total. Physical energy/engineering values remain floating-point quantities with independent tolerances.

## Primary source registry

Reviewed 5 November 2026. These references support methods and limits, not universal compliance or authorization to reproduce standards tables.

- [Schneider Electric: voltage-drop calculation](https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions): single-phase/balanced-three-phase impedance formulas and explicit voltage/length bases for T17/T18. No table is copied.
- [Schneider Electric: general cable-sizing method](https://www.electrical-installation.org/enwiki/General_method_for_cable_sizing): installation-specific ratings and correction conditions relevant to T20. The implementation requires entered evidence.
- [Schneider Electric: overcurrent protection principles](https://www.electrical-installation.org/enwiki/Overcurrent_protection_principles): separation of load protection, conductor capacity and short-circuit thermal duty for T21/T24.
- [Schneider Electric: cable short-circuit withstand](https://www.electrical-installation.org/enwiki/Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions): adiabatic scope up to five seconds, k²S² and manufacturer let-through energy for T24. Material coefficients are entered, not selected from an embedded table.
- [Schneider Electric: protective-conductor sizing](https://www.electrical-installation.org/enwiki/Sizing_of_protective_earthing_conductor): adiabatic method and the separate need for appropriate minimums/material conditions for T25.
- [Schneider Electric: motor PF correction](https://www.electrical-installation.org/enwiki/Power_factor_correction_of_induction_motors): compensation does not remove equipment-specific motor/self-excitation/protection considerations in T33.
- [Schneider Electric: capacitor reactive power](https://www.electrical-installation.org/enwiki/Reactive_power_of_capacitors): passive reactive sign convention and leading-current voltage-rise implications for T05/T17/T34.
- [SMA: planning a PV generator](https://files.sma.de/downloads/DC-PL-en-11.pdf) and [SMA: PV-module input requirements](https://manuals.sma.de/SBSExx-US-50/en-US/12406857099.html): manufacturer-specific temperature-voltage, string and inverter constraints for T40. No SMA product ratings are silently preloaded.
- [Sandia PV Performance Modeling Collaborative: PVWatts](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/point-value-models/pvwatts/): a reference for distinguishing a resource/temperature model from T39's simpler entered-profile or daily-yield approximation. T39 is not labeled a PVWatts implementation.

The source code and analytical fixtures were written for this product. Reference prose, standards tables and manufacturer curves have not been copied into the app. Standard algebra, unit definitions and explicitly stated physical simplifications underpin the remaining worksheets.

## Verification

Run `npm test -- tests/tools.test.ts`. The suite covers all 51 inventory IDs, independent literal numerical expectations, non-finite and inconsistent inputs, pure reactive/leading cases, incomplete evidence invalidation, physical model boundaries, phase/neutral quantities, storage conservation, outage isolation, EV constraints, elapsed-time integration and decimal-safe money rounding. A passing numerical suite does not validate a manufacturer dataset, a live integration, statutory compliance or every browser interaction.

The form and method strings in this module are authored in English. Locale-specific rendering/review must be verified by the application integration; this module does not claim independently reviewed German, Yoruba or Nigerian Pidgin engineering terminology.
