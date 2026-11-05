import type { EngineeringTool } from "./types";
import {
  defineTool,
  evidence,
  fraction,
  GUIDE,
  integer,
  n,
  numberInput as N,
  outcome,
  positive,
  result,
  row,
  selectInput as S,
  sourceInput,
  SQRT3,
} from "./helpers";

const category = "Cables & protection";
const noCertification =
  "This is a scoped entered-data check, not installation certification or automatic cable selection.";
const dropSource =
  GUIDE + "Calculation_of_voltage_drop_in_steady_load_conditions";
const thermalSource =
  GUIDE +
  "Verification_of_the_withstand_capabilities_of_cables_under_short-circuit_conditions";
export const cables: EngineeringTool[] = [
  defineTool({
    id: "T15",
    title: "Conductor resistance & temperature",
    category,
    description:
      "Linear temperature correction from entered resistivity and coefficient; parallel equal conductors only.",
    inputs: [
      N("resistivity", "Resistivity at reference temperature", "Ω·mm²/m", 0),
      N("length", "One conductor length", "m", 0),
      N("section", "Cross-section per conductor", "mm²", 0),
      N("parallel", "Equal parallel conductors", "", 1),
      N("alpha", "Temperature coefficient at reference temperature", "1/K"),
      N("referenceTemperature", "Reference temperature", "°C", -273.15),
      N("temperature", "Operating temperature", "°C", -273.15),
      sourceInput(),
    ],
    exampleInputs: {
      resistivity: 0.0175,
      length: 100,
      section: 2.5,
      parallel: 1,
      alpha: 0.00393,
      referenceTemperature: 20,
      temperature: 70,
    },
    calculate(v) {
      const ratio =
        1 +
        n(v, "alpha") * (n(v, "temperature") - n(v, "referenceTemperature"));
      if (ratio <= 0)
        throw new Error(
          "The linear temperature model gives non-positive resistivity. Check its applicable temperature range.",
        );
      const rho = positive(v, "resistivity"),
        section = positive(v, "section"),
        count = integer(v, "parallel"),
        rt = (rho * ratio) / (section * count);
      return result(
        [
          row(
            "Resistance at reference temperature",
            (rho * n(v, "length", 0)) / (section * count),
            "Ω",
          ),
          row(
            "Resistance at operating temperature",
            rt * n(v, "length", 0),
            "Ω",
          ),
          row("Equivalent resistance per kilometre", rt * 1000, "Ω/km"),
        ],
        "Rθ = ρref × L/(S × n) × [1 + αref(θ − θref)]",
        [
          "All parallel paths have equal length, material, section and temperature. Current sharing and installation derating need separate checks.",
          String(v.source ?? "").trim()
            ? `Entered property source: ${v.source}`
            : "Properties are user assumptions until their source and valid temperature range are recorded.",
        ],
      );
    },
  }),
  defineTool({
    id: "T16",
    title: "DC complete-loop voltage drop",
    category,
    description:
      "Separate outgoing and return conductor resistances; current is the actual on-state circuit current.",
    inputs: [
      N("voltage", "Supply voltage", "V", 0),
      N("current", "On-state current", "A", 0),
      N("outgoing", "Outgoing conductor resistance", "Ω", 0),
      N("return", "Return conductor resistance", "Ω", 0),
    ],
    exampleInputs: { voltage: 230, current: 10, outgoing: 0.4, return: 0.4 },
    calculate(v) {
      const voltage = positive(v, "voltage"),
        current = n(v, "current", 0),
        loop = n(v, "outgoing", 0) + n(v, "return", 0),
        drop = current * loop;
      return result(
        [
          row("Complete loop resistance", loop, "Ω"),
          row("Voltage drop", drop, "V"),
          row("Voltage drop", (100 * drop) / voltage, "%"),
          row("Receiving voltage estimate", voltage - drop, "V"),
          row("Loop conductor loss", current * current * loop, "W"),
        ],
        "ΔV = I(Rout + Rreturn); Ploss = I²(Rout + Rreturn)",
        [
          "A specified-current resistive model. The load operating point may change when voltage drops.",
          noCertification,
        ],
        drop >= voltage
          ? [
              "Drop equals or exceeds supply voltage: the specified current/load operating point is not physically feasible under this source model.",
            ]
          : [],
      );
    },
  }),
  defineTool({
    id: "T17",
    title: "AC voltage drop / rise",
    category,
    description:
      "One-way route length and per-conductor impedance; single-phase two-wire or balanced three-phase approximation.",
    inputs: [
      S("connection", "Connection", [
        ["single", "Single phase, equal outgoing/return"],
        ["three", "Balanced three phase"],
      ]),
      N("voltage", "Terminal / line-to-line voltage", "V", 0),
      N("current", "On-state current", "A", 0),
      N("length", "One-way route length", "m", 0),
      N("resistance", "Conductor resistance", "Ω/km", 0),
      N("reactance", "Conductor inductive reactance", "Ω/km", 0),
      N("pf", "Displacement PF", "", 0, 1),
      S("reactive", "Reactive behavior", [
        ["lagging", "Lagging"],
        ["leading", "Leading"],
      ]),
    ],
    exampleInputs: {
      connection: "single",
      voltage: 230,
      current: 10,
      length: 100,
      resistance: 4,
      reactance: 0,
      pf: 1,
      reactive: "lagging",
    },
    calculate(v) {
      const voltage = positive(v, "voltage"),
        current = n(v, "current", 0),
        km = n(v, "length", 0) / 1000,
        pf = n(v, "pf", 0, 1),
        sine =
          (v.reactive === "leading" ? -1 : 1) *
          Math.sqrt(Math.max(0, 1 - pf * pf)),
        r = n(v, "resistance", 0),
        x = n(v, "reactance", 0),
        f = v.connection === "three" ? SQRT3 : 2,
        drop = f * current * km * (r * pf + x * sine);
      return result(
        [
          row("Signed voltage drop", drop, "V"),
          row("Signed voltage drop", (100 * drop) / voltage, "%"),
          row("Receiving-voltage estimate", voltage - drop, "V"),
          row(
            "Conductor losses",
            (v.connection === "three" ? 3 : 2) * current * current * km * r,
            "W",
          ),
        ],
        "ΔV = kIL(R cosφ + X sinφ), k = 2 single phase or √3 balanced three phase",
        [
          "Negative drop denotes voltage rise in this approximation.",
          "Use conductor data at the actual operating temperature. This result covers this segment only; include upstream segments separately.",
          noCertification,
        ],
        Math.abs(drop) >= voltage * 0.2
          ? [
              "Large relative voltage change: validate with a suitable full circuit model.",
            ]
          : [],
        [dropSource],
      );
    },
  }),
  defineTool({
    id: "T18",
    title: "Route length / cross-section by drop",
    category,
    description:
      "Explicit voltage-change criterion under a unity-PF resistive model. Ampacity and protection remain separate.",
    inputs: [
      S("solve", "Calculate", [
        ["length", "Maximum one-way route length"],
        ["section", "Minimum calculated cross-section"],
      ]),
      S("connection", "Connection", [
        ["single", "DC / single phase, equal return"],
        ["three", "Balanced three phase"],
      ]),
      N("voltage", "Terminal / line-to-line voltage", "V", 0),
      N("current", "On-state current", "A", 0),
      N("limit", "User-entered maximum voltage change", "%", 0, 100),
      N("resistivity", "Resistivity at operating temperature", "Ω·mm²/m", 0),
      N(
        "section",
        "Candidate cross-section (length mode)",
        "mm²",
        0,
        undefined,
        false,
      ),
      N(
        "length",
        "One-way route length (section mode)",
        "m",
        0,
        undefined,
        false,
      ),
    ],
    exampleInputs: {
      solve: "length",
      connection: "single",
      voltage: 230,
      current: 10,
      limit: 3,
      resistivity: 0.0225,
      section: 2.5,
    },
    calculate(v) {
      const allowed = (positive(v, "voltage") * positive(v, "limit")) / 100,
        denom =
          (v.connection === "three" ? SQRT3 : 2) *
          positive(v, "current") *
          positive(v, "resistivity");
      return result(
        [
          row(
            v.solve === "length"
              ? "Maximum one-way route length"
              : "Minimum mathematical cross-section",
            v.solve === "length"
              ? (allowed * positive(v, "section")) / denom
              : (denom * n(v, "length", 0)) / allowed,
            v.solve === "length" ? "m" : "mm²",
          ),
          row("Allowed voltage change", allowed, "V"),
        ],
        "ΔV = kIρL/S; Lmax = ΔVlimit S/(kIρ); Smin = kIρL/ΔVlimit",
        [
          "Unity PF, negligible reactance, equal path conductors. Resistivity must represent the selected temperature.",
          "A calculated section is not an available cable size; choose a real sourced candidate and assess it.",
          noCertification,
        ],
        [],
        [dropSource],
      );
    },
  }),
  defineTool({
    id: "T19",
    title: "Conductor loss & loss energy",
    category,
    description:
      "Identical loaded conductors at an entered resistance and on-state current.",
    inputs: [
      N("current", "On-state conductor current", "A", 0),
      N("resistance", "Resistance per loaded conductor", "Ω", 0),
      N("conductors", "Equal loaded conductor count", "", 1),
      N("hours", "Elapsed assessment window", "h", 0),
      N("duty", "On-state energy duty fraction", "", 0, 1),
    ],
    exampleInputs: {
      current: 10,
      resistance: 0.4,
      conductors: 2,
      hours: 8,
      duty: 0.5,
    },
    calculate(v) {
      const loss =
        n(v, "current", 0) ** 2 *
        n(v, "resistance", 0) *
        integer(v, "conductors");
      return result(
        [
          row("On-state conductor loss", loss, "W"),
          row(
            "Window loss energy",
            (loss * n(v, "hours", 0) * n(v, "duty", 0, 1)) / 1000,
            "kWh",
          ),
        ],
        "Ploss = nI²R; Eloss = Ploss × elapsed hours × duty / 1000",
        [
          "Duty changes loss energy only; it does not reduce on-state current or on-state heating.",
          "For unequal phase/neutral currents, calculate each conductor separately and sum.",
        ],
      );
    },
  }),
  defineTool({
    id: "T20",
    title: "Cable ampacity correction worksheet",
    category,
    description:
      "Multiply a sourced base rating by applicable entered correction factors, without invented standards tables.",
    inputs: [
      N("base", "Base current-carrying capacity", "A", 0),
      N("temperatureFactor", "Temperature factor", "", 0),
      N("groupingFactor", "Grouping factor", "", 0),
      N("otherFactor", "Other applicable combined factor", "", 0),
      N("designCurrent", "Design on-state current", "A", 0),
      sourceInput("source", "Rating / factor tables, edition and conditions"),
      sourceInput(
        "installation",
        "Installation method, insulation and loaded conductors",
      ),
    ],
    exampleInputs: {
      base: 30,
      temperatureFactor: 0.9,
      groupingFactor: 0.8,
      otherFactor: 1,
      designCurrent: 20,
    },
    calculate(v) {
      const capacity =
          positive(v, "base") *
          positive(v, "temperatureFactor") *
          positive(v, "groupingFactor") *
          positive(v, "otherFactor"),
        demand = n(v, "designCurrent", 0);
      return evidence(
        result(
          [
            row("Corrected current-carrying capacity", capacity, "A"),
            row("Capacity minus design current", capacity - demand, "A"),
            row(
              "Design-current comparison",
              outcome(demand <= capacity, "entered corrected-capacity limit"),
            ),
          ],
          "Iz = Ibase × ktemperature × kgrouping × kother",
          [
            noCertification,
            "Factors must apply to the same installation, conductor, temperature and loaded-conductor basis.",
          ],
          [],
          [GUIDE + "General_method_for_cable_sizing"],
        ),
        v,
        ["source", "installation"],
      );
    },
  }),
  defineTool({
    id: "T21",
    title: "Device, load & cable checks",
    category,
    description:
      "Separate numerical overload and breaking-capacity checks against entered requirements and device data.",
    inputs: [
      N("designCurrent", "Design current Ib", "A", 0),
      N("deviceRating", "Device rating / setting In", "A", 0),
      N("capacity", "Corrected cable capacity Iz", "A", 0),
      N("operatingCurrent", "Conventional operating current I₂", "A", 0),
      N("thermalMultiplier", "Permitted I₂ / Iz from applicable rule", "", 0),
      N("fault", "Prospective fault current", "kA", 0),
      N("breaking", "Device breaking capacity at applicable voltage", "kA", 0),
      sourceInput("ruleSource", "Applicable overload rule and scope"),
      sourceInput(
        "deviceSource",
        "Device datasheet / voltage / AC-DC / characteristics",
      ),
      sourceInput("cableSource", "Cable corrected-capacity evidence"),
    ],
    exampleInputs: {
      designCurrent: 20,
      deviceRating: 25,
      capacity: 28,
      operatingCurrent: 36.25,
      thermalMultiplier: 1.45,
      fault: 4,
      breaking: 6,
    },
    calculate(v) {
      const ib = n(v, "designCurrent", 0),
        rating = positive(v, "deviceRating"),
        iz = positive(v, "capacity"),
        i2 = positive(v, "operatingCurrent"),
        multiplier = positive(v, "thermalMultiplier");
      if (i2 < rating)
        throw new Error(
          "Conventional operating current must not be below the device rating / setting.",
        );
      positive(v, "breaking");
      return evidence(
        result(
          [
            row("Ib ≤ In", outcome(ib <= rating, "device rating")),
            row("In ≤ Iz", outcome(rating <= iz, "cable capacity")),
            row(
              "I₂ ≤ entered multiple × Iz",
              outcome(i2 <= multiplier * iz, "entered thermal relationship"),
            ),
            row(
              "Fault ≤ breaking capacity",
              outcome(
                n(v, "fault", 0) <= n(v, "breaking", 0),
                "entered breaking capacity",
              ),
            ),
          ],
          "Ib ≤ In ≤ Iz; I₂ ≤ entered multiplier × Iz; fault duty ≤ breaking capacity",
          [
            noCertification,
            "Disconnection, selectivity, backup protection, RCD compatibility and physical testing are separate. The multiplier is not an automatic universal rule.",
          ],
          [],
          [GUIDE + "Overcurrent_protection_principles"],
        ),
        v,
        ["ruleSource", "deviceSource", "cableSource"],
      );
    },
  }),
  defineTool({
    id: "T22",
    title: "Simplified prospective fault current",
    category,
    description:
      "Stiff-voltage source plus entered series R/X; balanced three-phase or single-phase loop RMS estimate.",
    inputs: [
      S("connection", "Fault model", [
        ["single", "Single-phase complete loop"],
        ["three", "Balanced three-phase, positive-sequence path"],
      ]),
      N("voltage", "Terminal / line-to-line voltage", "V", 0),
      N("sourceR", "Source resistance", "Ω", 0),
      N("sourceX", "Source reactance", "Ω"),
      N("pathR", "Complete model path resistance", "Ω", 0),
      N("pathX", "Complete model path reactance", "Ω"),
      N("minimumFactor", "Entered minimum voltage factor", "", 0),
      N("maximumFactor", "Entered maximum voltage factor", "", 0),
      sourceInput(),
    ],
    exampleInputs: {
      connection: "single",
      voltage: 230,
      sourceR: 0.1,
      sourceX: 0,
      pathR: 0.36,
      pathX: 0,
      minimumFactor: 0.95,
      maximumFactor: 1.05,
    },
    calculate(v) {
      const z = Math.hypot(
        n(v, "sourceR", 0) + n(v, "pathR", 0),
        n(v, "sourceX") + n(v, "pathX"),
      );
      if (!z)
        throw new Error(
          "Total source/path impedance must be greater than zero.",
        );
      const lo = positive(v, "minimumFactor"),
        hi = positive(v, "maximumFactor");
      if (lo > hi)
        throw new Error("Minimum voltage factor must not exceed maximum.");
      const base =
        positive(v, "voltage") / (v.connection === "three" ? SQRT3 : 1) / z;
      return evidence(
        result(
          [
            row("Model impedance magnitude", z, "Ω"),
            row("Minimum-factor RMS estimate", (lo * base) / 1000, "kA"),
            row("Maximum-factor RMS estimate", (hi * base) / 1000, "kA"),
          ],
          "Isc = cV/|Z| (single loop); Isc = cVLL/(√3|Z₁|) (balanced three phase)",
          [
            "The two estimates vary voltage factor only; temperature/path changes must be entered as separate cases.",
            "No asymmetric peak/DC offset, meshed-network, generator or inverter fault model.",
            noCertification,
          ],
        ),
        v,
      );
    },
  }),
  defineTool({
    id: "T23",
    title: "Loop impedance & disconnection",
    category,
    description:
      "TN-loop worksheet using entered required operating current and manufacturer clearing-time evidence.",
    inputs: [
      S("earthing", "Earthing model", [
        ["TN", "TN, stated loop model"],
        ["TT", "TT — requires a different touch-voltage/RCD method"],
        ["IT", "IT — requires a different fault model"],
      ]),
      N("voltage", "Nominal line-to-earth voltage", "V", 0),
      N("factor", "Applicable minimum voltage factor", "", 0),
      N("impedance", "Complete fault-loop impedance", "Ω", 0),
      N(
        "operatingCurrent",
        "Device current Ia for required disconnection time",
        "A",
        0,
      ),
      N("requiredTime", "Required disconnection time", "s", 0),
      N(
        "actualTime",
        "Documented clearing time at calculated fault current",
        "s",
        0,
      ),
      sourceInput("ruleSource", "Earthing rule / required-time source"),
      sourceInput(
        "deviceSource",
        "Device curve and temperature / current evidence",
      ),
    ],
    exampleInputs: {
      earthing: "TN",
      voltage: 230,
      factor: 0.95,
      impedance: 1,
      operatingCurrent: 160,
      requiredTime: 0.4,
      actualTime: 0.1,
    },
    calculate(v) {
      if (v.earthing !== "TN")
        return {
          ...result(
            [],
            "No TN-loop rule applied to a different earthing arrangement.",
            [],
            [
              "Enter a supported TN-loop case; TT/IT require their own applicable protection method.",
            ],
          ),
          status: "unsupported",
        };
      const u = positive(v, "voltage") * positive(v, "factor"),
        z = positive(v, "impedance"),
        maximum = u / positive(v, "operatingCurrent");
      return evidence(
        result(
          [
            row("Calculated fault-loop current", u / z, "A"),
            row("Maximum impedance for entered Ia", maximum, "Ω"),
            row("Loop-impedance condition", outcome(z <= maximum)),
            row(
              "Entered clearing-time condition",
              outcome(positive(v, "actualTime") <= positive(v, "requiredTime")),
            ),
          ],
          "Zs ≤ cU₀/Ia; If = cU₀/Zs",
          [
            "Device clearing-time evidence must correspond to the calculated fault current, tolerances and operating conditions.",
            noCertification,
          ],
        ),
        v,
        ["ruleSource", "deviceSource"],
      );
    },
  }),
  defineTool({
    id: "T24",
    title: "Cable adiabatic withstand",
    category,
    description:
      "Compare manufacturer let-through fault energy with entered conductor thermal withstand.",
    inputs: [
      N("section", "Conductor cross-section", "mm²", 0),
      N("coefficient", "Sourced adiabatic coefficient k", "A√s/mm²", 0),
      N("faultEnergy", "Applicable manufacturer let-through I²t", "A²s", 0),
      N("duration", "Fault clearing duration", "s", 0),
      N("initialTemperature", "Initial conductor temperature", "°C", -273.15),
      N(
        "finalTemperature",
        "Permitted final temperature for chosen k",
        "°C",
        -273.15,
      ),
      sourceInput(
        "coefficientSource",
        "k source / material / insulation / temperatures",
      ),
      sourceInput(
        "energySource",
        "Let-through curve / voltage / prospective current",
      ),
    ],
    exampleInputs: {
      section: 2.5,
      coefficient: 115,
      faultEnergy: 50000,
      duration: 0.1,
      initialTemperature: 70,
      finalTemperature: 160,
    },
    calculate(v) {
      const section = positive(v, "section"),
        k = positive(v, "coefficient"),
        energy = n(v, "faultEnergy", 0),
        duration = positive(v, "duration");
      if (n(v, "initialTemperature") >= n(v, "finalTemperature"))
        throw new Error(
          "Permitted final temperature must exceed initial temperature.",
        );
      const out = evidence(
        result(
          [
            row("Conductor thermal withstand", (k * section) ** 2, "A²s"),
            row("Minimum thermal section", Math.sqrt(energy) / k, "mm²"),
            row(
              "Entered energy condition",
              outcome(energy <= (k * section) ** 2, "adiabatic energy limit"),
            ),
          ],
          "I²t ≤ k²S²; Smin = √(I²t)/k",
          [
            "Manufacturer let-through energy is used directly; prospective fault current is not assumed to persist unchanged through a current-limiting device.",
            noCertification,
          ],
          [],
          [thermalSource],
        ),
        v,
        ["coefficientSource", "energySource"],
      );
      if (duration > 5) {
        out.status = "unsupported";
        out.values = out.values.filter(
          (entry) => entry.label !== "Entered energy condition",
        );
        out.warnings.push(
          "Clearing duration exceeds the five-second boundary of this adiabatic worksheet; no pass/fail assessment is issued.",
        );
      }
      return out;
    },
  }),
  defineTool({
    id: "T25",
    title: "Protective conductor / bonding worksheet",
    category,
    description:
      "PE adiabatic thermal requirement plus an entered mechanical minimum, or a sourced bonding minimum comparison.",
    inputs: [
      S("method", "Applicable method", [
        ["PE", "PE: adiabatic + entered mechanical minimum"],
        ["bonding", "Bonding: entered applicable minimum"],
      ]),
      N("section", "Proposed cross-section", "mm²", 0),
      N("minimum", "Applicable mechanical / bonding minimum", "mm²", 0),
      N(
        "faultEnergy",
        "Applicable let-through I²t (PE only)",
        "A²s",
        0,
        undefined,
        false,
      ),
      N(
        "coefficient",
        "Applicable k (PE only)",
        "A√s/mm²",
        0,
        undefined,
        false,
      ),
      N("duration", "Fault duration (PE only, ≤5 s)", "s", 0, undefined, false),
      sourceInput(
        "source",
        "Applicable method, minimum, material and coefficient evidence",
      ),
    ],
    exampleInputs: {
      method: "PE",
      section: 4,
      minimum: 2.5,
      faultEnergy: 50000,
      coefficient: 115,
      duration: 0.1,
    },
    calculate(v) {
      const pe = v.method === "PE";
      if (pe && positive(v, "duration") > 5)
        throw new Error(
          "This PE adiabatic worksheet supports a fault duration of at most five seconds.",
        );
      const thermal = pe
          ? Math.sqrt(n(v, "faultEnergy", 0)) / positive(v, "coefficient")
          : 0,
        required = Math.max(thermal, n(v, "minimum", 0)),
        section = positive(v, "section");
      return evidence(
        result(
          [
            row(
              "Thermal minimum",
              pe ? thermal : "Not applicable to entered-minimum method",
              "mm²",
            ),
            row("Controlling entered requirement", required, "mm²"),
            row(
              "Proposed section comparison",
              outcome(section >= required, "entered section requirement"),
            ),
          ],
          pe
            ? "Srequired = max[√(I²t)/k, entered mechanical minimum]"
            : "Sproposed ≥ sourced applicable bonding minimum",
          [
            "No universal conductor-size table is embedded. Loop impedance, continuity, termination and local material requirements remain separate.",
            noCertification,
          ],
          [],
          [GUIDE + "Sizing_of_protective_earthing_conductor"],
        ),
        v,
      );
    },
  }),
];
