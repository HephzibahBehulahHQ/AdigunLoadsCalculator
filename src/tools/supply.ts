import type { EngineeringTool } from "./types";
import {
  connectionInput,
  defineTool,
  evidence,
  factor,
  fraction,
  GUIDE,
  list,
  n,
  numberInput as N,
  outcome,
  positive,
  result,
  row,
  selectInput as S,
  sourceInput,
  SQRT3,
  sum,
  textInput as T,
} from "./helpers";

const category = "Distribution & supply";
export const supply: EngineeringTool[] = [
  defineTool({
    id: "T26",
    title: "Connected & coincident demand",
    category,
    description:
      "Aggregate entered electrical input ratings and apply each distinct design assumption once.",
    inputs: [
      T("powers", "Individual electrical input ratings", "Comma-separated kW."),
      N("coincidence", "Coincidence factor for this boundary", "", 0, 1),
      N("growth", "Future demand growth allowance", "%", 0),
      N("reserve", "Capacity allowance added to demand", "%", 0),
    ],
    exampleInputs: {
      powers: "2, 3, 5",
      coincidence: 0.8,
      growth: 10,
      reserve: 20,
    },
    calculate(v) {
      const connected = sum(list(v, "powers", 0)),
        coincident = connected * n(v, "coincidence", 0, 1),
        future = coincident * (1 + n(v, "growth", 0) / 100);
      return result(
        [
          row("Connected electrical input", connected, "kW"),
          row("Coincident demand", coincident, "kW"),
          row("Demand including growth", future, "kW"),
          row(
            "Target capacity including added allowance",
            future * (1 + n(v, "reserve", 0) / 100),
            "kW",
          ),
        ],
        "Pdemand = ΣP × coincidence; Pfuture = Pdemand(1 + growth); capacity = Pfuture(1 + added allowance)",
        [
          "A scalar real-power demand worksheet; phase currents and signed reactive power require their own aggregation.",
          "The capacity allowance is a percentage added to demand, not a percentage of installed capacity left unused.",
          "Energy duty is not an extra current reduction.",
        ],
      );
    },
  }),
  defineTool({
    id: "T27",
    title: "Phase-current imbalance",
    category,
    description:
      "Compare entered line-current RMS magnitudes using a visible current-imbalance definition.",
    inputs: [
      N("l1", "L1 RMS current", "A", 0),
      N("l2", "L2 RMS current", "A", 0),
      N("l3", "L3 RMS current", "A", 0),
    ],
    exampleInputs: { l1: 10, l2: 20, l3: 30 },
    calculate(v) {
      const currents = ["l1", "l2", "l3"].map((key) => n(v, key, 0)),
        mean = sum(currents) / 3;
      return result(
        [
          row("Mean phase current", mean, "A"),
          row("Maximum phase current", Math.max(...currents), "A"),
          row(
            "Maximum deviation from mean / mean",
            mean
              ? (Math.max(...currents.map((i) => Math.abs(i - mean))) / mean) *
                  100
              : "Not applicable (all currents zero)",
            "%",
          ),
        ],
        "Imbalance = 100 × max(|Ii − Imean|)/Imean",
        [
          "This is a current-magnitude metric. It is not negative-sequence voltage imbalance and does not determine neutral current.",
        ],
      );
    },
  }),
  defineTool({
    id: "T28",
    title: "Fundamental neutral current",
    category,
    description:
      "Vector sum of three supplied fundamental current phasors at one common boundary.",
    inputs: [
      N("l1", "L1 fundamental RMS current", "A", 0),
      N("angle1", "L1 current phase angle", "°"),
      N("l2", "L2 fundamental RMS current", "A", 0),
      N("angle2", "L2 current phase angle", "°"),
      N("l3", "L3 fundamental RMS current", "A", 0),
      N("angle3", "L3 current phase angle", "°"),
    ],
    exampleInputs: {
      l1: 10,
      angle1: 0,
      l2: 10,
      angle2: -120,
      l3: 10,
      angle3: 120,
    },
    calculate(v) {
      let re = 0,
        im = 0;
      for (let i = 1; i <= 3; i++) {
        const current = n(v, `l${i}`, 0),
          angle = (n(v, `angle${i}`) * Math.PI) / 180;
        re += current * Math.cos(angle);
        im += current * Math.sin(angle);
      }
      return result(
        [
          row("Fundamental neutral RMS magnitude", Math.hypot(re, im), "A"),
          row("Sum real current component", re, "A"),
          row("Sum imaginary current component", im, "A"),
        ],
        "IN = |IL1 + IL2 + IL3| using complex current phasors",
        [
          "Phasor angles share one reference. The neutral return direction is opposite the summed phase-current vector.",
          "Harmonics, including triplen components, are excluded. No floating-neutral voltage solution is implied.",
        ],
      );
    },
  }),
  defineTool({
    id: "T29",
    title: "Transformer current, loading & losses",
    category,
    description:
      "Balanced three-phase transformer with entered no-load and rated-load loss data.",
    inputs: [
      N("rating", "Transformer rating", "kVA", 0),
      N("primaryVoltage", "Primary line-to-line voltage", "V", 0),
      N("secondaryVoltage", "Secondary line-to-line voltage", "V", 0),
      N("load", "Load real power", "kW", 0),
      N("pf", "Load displacement PF", "", 0, 1),
      N("noLoadLoss", "No-load loss", "W", 0),
      N("ratedLoadLoss", "Load-dependent loss at rated current", "W", 0),
      N("hours", "Energized elapsed time", "h", 0),
    ],
    exampleInputs: {
      rating: 100,
      primaryVoltage: 11000,
      secondaryVoltage: 400,
      load: 72,
      pf: 0.9,
      noLoadLoss: 200,
      ratedLoadLoss: 1000,
      hours: 24,
    },
    calculate(v) {
      const rated = positive(v, "rating"),
        load = n(v, "load", 0),
        kva = load / fraction(v, "pf"),
        x = kva / rated,
        losses = n(v, "noLoadLoss", 0) + n(v, "ratedLoadLoss", 0) * x * x;
      return result(
        [
          row(
            "Rated primary current",
            (rated * 1000) / (SQRT3 * positive(v, "primaryVoltage")),
            "A",
          ),
          row(
            "Rated secondary current",
            (rated * 1000) / (SQRT3 * positive(v, "secondaryVoltage")),
            "A",
          ),
          row(
            "Actual secondary current",
            (kva * 1000) / (SQRT3 * n(v, "secondaryVoltage")),
            "A",
          ),
          row("Loading", x * 100, "%"),
          row("Entered-model loss", losses, "W"),
          row("Loss energy", (losses * n(v, "hours", 0)) / 1000, "kWh"),
          row(
            "Operating-point efficiency",
            load * 1000 + losses
              ? ((load * 1000) / (load * 1000 + losses)) * 100
              : "Not applicable",
            "%",
          ),
        ],
        "Irated = 1000S/(√3VLL); Ploss = P₀ + Pload,rated × (Sload/Srated)²",
        [
          "Assumes constant voltage, sinusoidal balanced load and loss-data conditions matching this operating point. Harmonic and thermal derating are separate.",
        ],
        x > 1 ? ["Load apparent power exceeds the entered rating."] : [],
      );
    },
  }),
  defineTool({
    id: "T30",
    title: "Generator capacity worksheet",
    category,
    description:
      "Independent steady kW/kVA limits and an entered start-capacity duration envelope.",
    inputs: [
      N(
        "ratedKW",
        "Applicable continuous / standby real-power rating",
        "kW",
        0,
      ),
      N("ratedKVA", "Applicable apparent-power rating", "kVA", 0),
      N("derating", "Applicable operating-condition multiplier", "", 0, 1),
      N("loadKW", "Steady load real power", "kW", 0),
      N("loadPF", "Steady load PF", "", 0, 1),
      N(
        "startKVA",
        "Total start-stage demand including existing loads",
        "kVA",
        0,
      ),
      N(
        "allowedStartKVA",
        "Sourced permissible start-stage apparent demand",
        "kVA",
        0,
      ),
      N("startDuration", "Start-stage duration", "s", 0),
      N("allowedDuration", "Sourced permitted duration", "s", 0),
      sourceInput(),
    ],
    exampleInputs: {
      ratedKW: 40,
      ratedKVA: 50,
      derating: 0.9,
      loadKW: 30,
      loadPF: 0.8,
      startKVA: 70,
      allowedStartKVA: 80,
      startDuration: 3,
      allowedDuration: 5,
    },
    calculate(v) {
      const mult = fraction(v, "derating"),
        realLimit = positive(v, "ratedKW") * mult,
        apparentLimit = positive(v, "ratedKVA") * mult,
        load = n(v, "loadKW", 0),
        apparent = load / fraction(v, "loadPF");
      return evidence(
        result(
          [
            row("Real-power headroom", realLimit - load, "kW"),
            row("Apparent-power headroom", apparentLimit - apparent, "kVA"),
            row("Steady real-power check", outcome(load <= realLimit)),
            row(
              "Steady apparent-power check",
              outcome(apparent <= apparentLimit),
            ),
            row(
              "Entered start envelope",
              outcome(
                n(v, "startKVA", 0) <= n(v, "allowedStartKVA", 0) &&
                  n(v, "startDuration", 0) <= n(v, "allowedDuration", 0),
              ),
            ),
          ],
          "Check load kW and kVA separately; compare start demand and duration with entered capability",
          [
            "Rating basis, altitude, temperature, fuel and permissible step changes need actual applicable manufacturer data.",
            "Voltage/frequency dip, speed governor and alternator transient dynamics are not predicted.",
          ],
        ),
        v,
      );
    },
  }),
  defineTool({
    id: "T31",
    title: "Inverter & overload envelope",
    category,
    description:
      "Compare continuous and transient real/apparent limits with explicit phase compatibility.",
    inputs: [
      N("ratedKW", "Continuous real-power limit", "kW", 0),
      N("ratedKVA", "Continuous apparent-power limit", "kVA", 0),
      N("loadKW", "Continuous load real power", "kW", 0),
      N("loadPF", "Continuous load PF", "", 0, 1),
      N("peakKW", "Transient real demand", "kW", 0),
      N("peakKVA", "Transient apparent demand", "kVA", 0),
      N("limitKW", "Sourced transient real-power limit", "kW", 0),
      N("limitKVA", "Sourced transient apparent-power limit", "kVA", 0),
      N("duration", "Demand transient duration", "s", 0),
      N("permittedDuration", "Sourced permitted duration", "s", 0),
      S("phases", "Phase / operating-mode compatibility", [
        ["unknown", "Not established"],
        ["confirmed", "Confirmed by entered source"],
        ["incompatible", "Incompatible"],
      ]),
      sourceInput(),
    ],
    exampleInputs: {
      ratedKW: 5,
      ratedKVA: 5,
      loadKW: 3,
      loadPF: 0.9,
      peakKW: 6,
      peakKVA: 7,
      limitKW: 8,
      limitKVA: 8,
      duration: 2,
      permittedDuration: 5,
      phases: "unknown",
    },
    calculate(v) {
      const load = n(v, "loadKW", 0),
        apparent = load / fraction(v, "loadPF"),
        peakP = n(v, "peakKW", 0),
        peakS = n(v, "peakKVA", 0);
      if (peakS < peakP)
        throw new Error(
          "Transient apparent demand cannot be smaller than real demand.",
        );
      const out = evidence(
        result(
          [
            row(
              "Continuous real-power headroom",
              positive(v, "ratedKW") - load,
              "kW",
            ),
            row(
              "Continuous apparent-power headroom",
              positive(v, "ratedKVA") - apparent,
              "kVA",
            ),
            row(
              "Transient envelope",
              outcome(
                peakP <= n(v, "limitKW", 0) &&
                  peakS <= n(v, "limitKVA", 0) &&
                  n(v, "duration", 0) <= n(v, "permittedDuration", 0),
              ),
            ),
            row("Phase / operating-mode evidence", String(v.phases)),
          ],
          "Continuous P and S limits; transient P, S and duration limits checked independently",
          [
            "DC voltage/current, battery BMS, per-phase limits, islanding and transfer arrangements require separate manufacturer checks.",
          ],
        ),
        v,
      );
      if (v.phases === "unknown") {
        out.status = "incomplete";
        out.warnings.push(
          "Confirm actual phase and operating-mode compatibility.",
        );
      }
      if (v.phases === "incompatible")
        out.warnings.push(
          "The selected inverter configuration is incompatible with this load.",
        );
      return out;
    },
  }),
  defineTool({
    id: "T32",
    title: "UPS energy-based runtime",
    category,
    description:
      "Constant usable DC energy and entered conversion efficiency; no manufacturer discharge-curve claim.",
    inputs: [
      N("ratedKW", "UPS real-power rating", "kW", 0),
      N("ratedKVA", "UPS apparent-power rating", "kVA", 0),
      N("loadKW", "Load real power", "kW", 0),
      N("loadPF", "Load power factor", "", 0, 1),
      N("usableEnergy", "Usable stored DC energy above cutoff", "kWh", 0),
      N("efficiency", "DC-to-AC efficiency", "", 0, 1),
      N("auxiliary", "Additional AC-side auxiliary demand", "W", 0),
    ],
    exampleInputs: {
      ratedKW: 3,
      ratedKVA: 3,
      loadKW: 1,
      loadPF: 0.9,
      usableEnergy: 2,
      efficiency: 0.9,
      auxiliary: 0,
    },
    calculate(v) {
      const load = n(v, "loadKW", 0),
        auxiliary = n(v, "auxiliary", 0) / 1000,
        demand = load + auxiliary,
        s = load / fraction(v, "loadPF") + auxiliary,
        feasible =
          demand <= positive(v, "ratedKW") && s <= positive(v, "ratedKVA"),
        energy = n(v, "usableEnergy", 0) * fraction(v, "efficiency");
      return result(
        [
          row("Available AC energy", energy, "kWh"),
          row("Combined real demand", demand, "kW"),
          row("Combined apparent demand assumption", s, "kVA"),
          row(
            "Energy-only runtime",
            demand ? energy / demand : "No load: runtime not defined",
            "h",
          ),
          row("Rated-power feasibility", outcome(feasible)),
        ],
        "Runtime ≈ usable DC kWh × η / (load kW + auxiliary kW)",
        [
          "Auxiliary demand is assumed unity PF and the apparent demands are conservatively added.",
          "No-load consumption, battery aging, temperature, Peukert behavior and manufacturer discharge curves are not inferred.",
        ],
        feasible
          ? []
          : [
              "Power limit exceeded: the energy-only runtime cannot be treated as a feasible backed-up operating time.",
            ],
      );
    },
  }),
];

export const powerQuality: EngineeringTool[] = [
  defineTool({
    id: "T33",
    title: "Power-factor correction",
    category: "Power quality",
    description:
      "Fundamental lagging compensation from the initial to a higher displacement PF.",
    inputs: [
      N("power", "Real load input", "kW", 0),
      N("initialPF", "Initial displacement PF", "", 0, 1),
      N("targetPF", "Target displacement PF", "", 0, 1),
      N("voltage", "Terminal / line-to-line voltage", "V", 0),
      connectionInput(),
    ],
    exampleInputs: {
      power: 10,
      initialPF: 0.8,
      targetPF: 0.95,
      voltage: 400,
      connection: "three",
    },
    calculate(v) {
      const p = n(v, "power", 0),
        initial = fraction(v, "initialPF"),
        target = fraction(v, "targetPF"),
        scale = factor(v) * positive(v, "voltage");
      if (target < initial)
        throw new Error(
          "Target PF must be at least the initial PF for this correction worksheet.",
        );
      return result(
        [
          row(
            "Capacitive compensation magnitude",
            p * (Math.tan(Math.acos(initial)) - Math.tan(Math.acos(target))),
            "kvar",
          ),
          row("Before apparent power", p / initial, "kVA"),
          row("After apparent power", p / target, "kVA"),
          row("Before supply current", (p * 1000) / (scale * initial), "A"),
          row("After supply current", (p * 1000) / (scale * target), "A"),
        ],
        "Qc = P[tan(acos(PFinitial)) − tan(acos(PFtarget))]",
        [
          "Useful-load kWh is not automatically reduced by displacement-PF correction.",
          "Capacitor switching, harmonic resonance, VFD compatibility and motor self-excitation need separate equipment-specific assessment.",
        ],
        [],
        [GUIDE + "Power_factor_correction_of_induction_motors"],
      );
    },
  }),
  defineTool({
    id: "T34",
    title: "Capacitor element sizing",
    category: "Power quality",
    description:
      "Ideal sinusoidal capacitor elements for single-phase, three-phase star or delta connection.",
    inputs: [
      N("compensation", "Total compensation magnitude", "kvar", 0),
      N("voltage", "Terminal voltage (line-to-line for star/delta)", "V", 0),
      N("frequency", "Frequency", "Hz", 0),
      S("connection", "Capacitor connection", [
        ["single", "One single-phase element"],
        ["star", "Three equal star elements"],
        ["delta", "Three equal delta elements"],
      ]),
    ],
    exampleInputs: {
      compensation: 10,
      voltage: 400,
      frequency: 50,
      connection: "delta",
    },
    calculate(v) {
      const q = n(v, "compensation", 0) * 1000,
        voltage = positive(v, "voltage"),
        count = v.connection === "single" ? 1 : 3,
        elementV = v.connection === "star" ? voltage / SQRT3 : voltage,
        capacitance =
          q /
          (count *
            2 *
            Math.PI *
            positive(v, "frequency") *
            elementV *
            elementV);
      return result(
        [
          row("Voltage per element", elementV, "V"),
          row("Capacitance per element", capacitance * 1e6, "µF"),
          row("Number of equal elements", count),
          row(
            "Supply line current magnitude",
            q / ((count === 1 ? 1 : SQRT3) * voltage),
            "A",
          ),
        ],
        "Qc = n × 2πf × Celement × Velement²",
        [
          "Ideal sizing only. Select actual voltage/duty ratings, protection, discharge and harmonic compatibility separately.",
        ],
        [],
        [GUIDE + "Reactive_power_of_capacitors"],
      );
    },
  }),
  defineTool({
    id: "T35",
    title: "Harmonic RMS & THD",
    category: "Power quality",
    description:
      "Compute total RMS and THD from an explicitly supplied harmonic spectrum; fundamental is the THD denominator.",
    inputs: [
      S("quantity", "Spectrum quantity", [
        ["A", "Current (A RMS)"],
        ["V", "Voltage (V RMS)"],
      ]),
      N("fundamental", "Fundamental RMS magnitude", "", 0),
      T(
        "harmonics",
        "Harmonic RMS magnitudes h2, h3, …",
        "Comma-separated non-negative values. Enter 0 for an absent harmonic.",
      ),
    ],
    exampleInputs: { quantity: "A", fundamental: 10, harmonics: "0, 3, 0, 4" },
    calculate(v) {
      const fundamental = n(v, "fundamental", 0),
        harmonics = list(v, "harmonics", 0),
        harmonicRms = Math.hypot(...harmonics);
      const out = result(
        [
          row("Combined harmonic RMS", harmonicRms, String(v.quantity)),
          row(
            "Total RMS including fundamental",
            Math.hypot(fundamental, harmonicRms),
            String(v.quantity),
          ),
          row(
            "THD relative to fundamental",
            fundamental
              ? (harmonicRms / fundamental) * 100
              : "Undefined: zero fundamental",
            "%",
          ),
        ],
        "THDF = √(Σh≥2 Xh²) / X₁; XRMS = √(X₁² + Σh≥2 Xh²)",
        [
          "Spectral bins are RMS magnitudes at integer harmonics of one common fundamental. DC and interharmonics are excluded.",
          "Harmonic phase angles are not supplied; no time waveform or three-phase harmonic-neutral current is inferred.",
        ],
      );
      out.series = [
        { harmonic: 1, rms: fundamental },
        ...harmonics.map((rms, index) => ({ harmonic: index + 2, rms })),
      ];
      return out;
    },
  }),
];
