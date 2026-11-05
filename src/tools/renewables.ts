import type { EngineeringTool } from "./types";
import {
  defineTool,
  evidence,
  expand,
  fraction,
  integer,
  list,
  n,
  numberInput as N,
  outcome,
  positive,
  result,
  row,
  selectInput as S,
  sourceInput,
  sum,
  textInput as T,
} from "./helpers";

const category = "Renewables & storage";
export const renewables: EngineeringTool[] = [
  defineTool({
    id: "T36",
    title: "Battery capacity & usable energy",
    category,
    description:
      "SOC percentages refer to one nominal stored-energy capacity; reserve is applied once.",
    inputs: [
      N("voltage", "Nominal battery voltage", "V", 0),
      N("capacityAh", "Nominal charge capacity", "Ah", 0),
      N("initialSOC", "Initial SOC", "%", 0, 100),
      N("minimumSOC", "Minimum operating SOC / reserve boundary", "%", 0, 100),
      N("maximumSOC", "Maximum operating SOC", "%", 0, 100),
      N("efficiency", "Discharge DC-to-AC efficiency", "", 0, 1),
    ],
    exampleInputs: {
      voltage: 100,
      capacityAh: 100,
      initialSOC: 80,
      minimumSOC: 20,
      maximumSOC: 100,
      efficiency: 0.9,
    },
    calculate(v) {
      const nominal = (positive(v, "voltage") * n(v, "capacityAh", 0)) / 1000,
        initial = n(v, "initialSOC", 0, 100),
        min = n(v, "minimumSOC", 0, 100),
        max = n(v, "maximumSOC", 0, 100);
      if (min > initial || initial > max)
        throw new Error("SOC must satisfy minimum ≤ initial ≤ maximum.");
      return result(
        [
          row("Nominal stored-energy approximation", nominal, "kWh"),
          row(
            "Usable stored-energy window",
            (nominal * (max - min)) / 100,
            "kWh",
          ),
          row("Initial stored energy", (nominal * initial) / 100, "kWh"),
          row(
            "Available AC energy above reserve",
            ((nominal * (initial - min)) / 100) * fraction(v, "efficiency"),
            "kWh",
          ),
        ],
        "Enom ≈ Vnom × Ah / 1000; Eavailable,AC = Enom(SOCinitial − SOCmin)η",
        [
          "Fixed nominal-voltage energy approximation. Actual discharge capacity, temperature, aging and BMS limits require manufacturer data.",
          "Energy availability does not establish output-power or island/backup compatibility.",
        ],
      );
    },
  }),
  defineTool({
    id: "T37",
    title: "Battery rates & constrained runtime",
    category,
    description:
      "Constant-power charge/discharge estimates within stated stored-energy and power limits.",
    inputs: [
      N("capacity", "Nominal stored energy", "kWh", 0),
      N("initialSOC", "Initial SOC", "%", 0, 100),
      N("minimumSOC", "Lower SOC / reserve", "%", 0, 100),
      N("targetSOC", "Charge target SOC", "%", 0, 100),
      N("chargePower", "Requested AC charging power", "kW", 0),
      N("chargeLimit", "Maximum permitted AC charge power", "kW", 0),
      N("dischargePower", "Required AC load power", "kW", 0),
      N("dischargeLimit", "Maximum permitted AC discharge power", "kW", 0),
      N("chargeEfficiency", "AC-to-stored charge efficiency", "", 0, 1),
      N("dischargeEfficiency", "Stored-to-AC discharge efficiency", "", 0, 1),
    ],
    exampleInputs: {
      capacity: 10,
      initialSOC: 80,
      minimumSOC: 20,
      targetSOC: 100,
      chargePower: 2,
      chargeLimit: 3,
      dischargePower: 1,
      dischargeLimit: 3,
      chargeEfficiency: 0.9,
      dischargeEfficiency: 0.9,
    },
    calculate(v) {
      const capacity = positive(v, "capacity"),
        initial = n(v, "initialSOC", 0, 100),
        min = n(v, "minimumSOC", 0, 100),
        target = n(v, "targetSOC", 0, 100);
      if (min > initial || initial > target)
        throw new Error("SOC must satisfy lower ≤ initial ≤ charge target.");
      const pc = Math.min(n(v, "chargePower", 0), n(v, "chargeLimit", 0)),
        pd = n(v, "dischargePower", 0),
        etaC = fraction(v, "chargeEfficiency"),
        etaD = fraction(v, "dischargeEfficiency"),
        available = ((capacity * (initial - min)) / 100) * etaD,
        feasible = pd <= n(v, "dischargeLimit", 0);
      return result(
        [
          row("Accepted AC charging power", pc, "kW"),
          row(
            "Stored-energy charge rate / nominal energy",
            (pc * etaC) / capacity,
            "h⁻¹",
          ),
          row(
            "Stored-energy discharge rate / nominal energy",
            pd / etaD / capacity,
            "h⁻¹",
          ),
          row(
            "Charge duration to target",
            target === initial
              ? 0
              : pc
                ? (capacity * (target - initial)) / 100 / (pc * etaC)
                : "Not achievable at zero charging power",
            "h",
          ),
          row("Available AC energy", available, "kWh"),
          row(
            "Feasible constant-load runtime",
            !feasible
              ? "Not feasible: load exceeds discharge limit"
              : pd
                ? available / pd
                : "Not applicable: zero load",
            "h",
          ),
        ],
        "tcharge = ΔEstored/(PAC,charge ηcharge); tdischarge = ΔEstored ηdischarge/PAC,load",
        [
          "Energy-normalized rates equal approximate C-rates only under a fixed nominal-voltage assumption.",
          "Charge and discharge are separate scenarios. Constant-power estimates omit taper, no-load loss, temperature and battery discharge curves.",
        ],
        feasible
          ? []
          : [
              "Output power is insufficient even if stored energy is available.",
            ],
      );
    },
  }),
  defineTool({
    id: "T38",
    title: "Chronological battery dispatch",
    category,
    description:
      "Reconcile physical flows per equal elapsed-time interval with explicit grid and islanding state.",
    inputs: [
      T(
        "loads",
        "Load power profile",
        "Comma-separated kW per elapsed interval.",
      ),
      T(
        "generation",
        "Available generation power profile",
        "One value or one kW value per interval.",
      ),
      N("hours", "Actual elapsed interval duration", "h", 0),
      N("capacity", "Maximum stored energy", "kWh", 0),
      N("initial", "Initial stored energy", "kWh", 0),
      N("reserve", "Minimum stored energy / reserve", "kWh", 0),
      N("chargeLimit", "Maximum AC charge power", "kW", 0),
      N("dischargeLimit", "Maximum AC discharge power", "kW", 0),
      N("chargeEfficiency", "AC-to-stored charging efficiency", "", 0, 1),
      N("dischargeEfficiency", "Stored-to-AC discharging efficiency", "", 0, 1),
      S("grid", "Grid state for this profile", [
        ["connected", "Grid available"],
        ["outage", "Grid outage"],
      ]),
      S("island", "Confirmed island-capable source / transfer arrangement", [
        ["no", "No"],
        ["yes", "Yes, entered verified configuration"],
      ]),
    ],
    exampleInputs: {
      loads: "0, 2",
      generation: "2, 0",
      hours: 1,
      capacity: 10,
      initial: 5,
      reserve: 0,
      chargeLimit: 5,
      dischargeLimit: 5,
      chargeEfficiency: 0.9,
      dischargeEfficiency: 0.8,
      grid: "connected",
      island: "no",
    },
    calculate(v) {
      const loads = list(v, "loads", 0),
        generation = expand(
          list(v, "generation", 0),
          loads.length,
          "Generation profile",
        ),
        dt = positive(v, "hours"),
        capacity = n(v, "capacity", 0),
        initial = n(v, "initial", 0),
        reserve = n(v, "reserve", 0);
      if (reserve > initial || initial > capacity)
        throw new Error(
          "Stored energy must satisfy reserve ≤ initial ≤ maximum capacity.",
        );
      const ec = fraction(v, "chargeEfficiency"),
        ed = fraction(v, "dischargeEfficiency"),
        chargeLimit = n(v, "chargeLimit", 0),
        dischargeLimit = n(v, "dischargeLimit", 0),
        grid = v.grid === "connected",
        energized = grid || v.island === "yes";
      let stored = initial,
        importKWh = 0,
        exportKWh = 0,
        chargeKWh = 0,
        dischargeKWh = 0,
        lossKWh = 0,
        unservedKWh = 0,
        curtailedKWh = 0,
        availableGenerationKWh = 0,
        maxResidual = 0;
      const series: Array<Record<string, number | string>> = [];
      for (let i = 0; i < loads.length; i++) {
        const before = stored,
          gen = energized ? generation[i] : 0,
          direct = Math.min(loads[i], gen),
          surplus = gen - direct;
        const charge = energized
          ? Math.min(
              surplus,
              chargeLimit,
              Math.max(0, capacity - stored) / (ec * dt),
            )
          : 0;
        stored += charge * ec * dt;
        const deficit = loads[i] - direct,
          discharge = energized
            ? Math.min(
                deficit,
                dischargeLimit,
                (Math.max(0, stored - reserve) * ed) / dt,
              )
            : 0;
        stored -= (discharge / ed) * dt;
        const remaining = Math.max(0, deficit - discharge),
          imported = grid ? remaining : 0,
          unserved = grid ? 0 : remaining,
          extra = Math.max(0, surplus - charge),
          exported = grid ? extra : 0,
          curtailed = grid ? 0 : extra;
        const loss = (charge * (1 - ec) + discharge * (1 / ed - 1)) * dt;
        const residual =
          gen * dt +
          imported * dt +
          before -
          stored -
          (loads[i] - unserved) * dt -
          exported * dt -
          curtailed * dt -
          loss;
        maxResidual = Math.max(maxResidual, Math.abs(residual));
        importKWh += imported * dt;
        exportKWh += exported * dt;
        chargeKWh += charge * dt;
        dischargeKWh += discharge * dt;
        lossKWh += loss;
        unservedKWh += unserved * dt;
        curtailedKWh += curtailed * dt;
        availableGenerationKWh += gen * dt;
        series.push({
          interval: i + 1,
          elapsedHours: (i + 1) * dt,
          loadKW: loads[i],
          generationKW: gen,
          chargeKW: charge,
          dischargeKW: discharge,
          importKW: imported,
          exportKW: exported,
          unservedKW: unserved,
          curtailedKW: curtailed,
          storedKWh: stored,
          lossKWh: loss,
          balanceResidualKWh: residual,
        });
      }
      const out = result(
        [
          row("Load demand", sum(loads) * dt, "kWh"),
          row("Available generation", availableGenerationKWh, "kWh"),
          row("Physical grid import", importKWh, "kWh"),
          row("Physical grid export", exportKWh, "kWh"),
          row("AC battery charge energy", chargeKWh, "kWh"),
          row("AC battery discharge energy", dischargeKWh, "kWh"),
          row("Conversion losses", lossKWh, "kWh"),
          row("Final stored energy", stored, "kWh"),
          row("Unserved load", unservedKWh, "kWh"),
          row("Curtailed available generation", curtailedKWh, "kWh"),
          row("Maximum interval energy-balance residual", maxResidual, "kWh"),
        ],
        "Generation + grid import + starting stored energy = served load + grid export + curtailment + losses + ending stored energy",
        [
          "Greedy self-consumption dispatch with fixed reserve; no simultaneous charging and discharging.",
          "Elapsed durations are explicit; this worksheet does not reinterpret calendar dates or daylight saving.",
          "An outage begins at the entered initial stored energy. No free precharging is introduced.",
          "Grid-following generation and battery output are unavailable during outage without the stated island-capable arrangement.",
        ],
        !energized
          ? [
              "Outage without a supported island source: generation and battery discharge are unavailable; load is unserved.",
            ]
          : [],
      );
      out.series = series;
      return out;
    },
  }),
  defineTool({
    id: "T39",
    title: "PV yield / inverter clipping",
    category,
    description:
      "Entered peak-sun-hour estimate or supplied normalized DC profile with chronological clipping.",
    inputs: [
      S("mode", "Input basis", [
        ["daily", "Daily peak-sun-hour estimate"],
        ["profile", "Supplied DC profile"],
      ]),
      N("capacity", "Installed DC nameplate capacity", "kWp", 0),
      N("loss", "DC-side loss fraction", "", 0, 1),
      N("efficiency", "Inverter efficiency assumption", "", 0, 1),
      N("sunHours", "Peak sun hours (daily mode)", "h", 0, undefined, false),
      T(
        "profile",
        "Normalized DC profile (profile mode)",
        "Comma-separated DC kW per installed kWp.",
        false,
      ),
      N(
        "interval",
        "Elapsed interval duration (profile mode)",
        "h",
        0,
        undefined,
        false,
      ),
      N(
        "inverterLimit",
        "AC inverter output limit (profile mode)",
        "kW",
        0,
        undefined,
        false,
      ),
      sourceInput(
        "source",
        "Irradiance / generation profile source and period",
      ),
    ],
    exampleInputs: {
      mode: "daily",
      capacity: 5,
      loss: 0.1,
      efficiency: 0.96,
      sunHours: 4,
    },
    calculate(v) {
      const capacity = n(v, "capacity", 0),
        loss = n(v, "loss", 0, 1),
        eta = fraction(v, "efficiency"),
        notes = [
          "Entered resource/profile assumptions; no live weather, location yield or orientation model is implied.",
          String(v.source ?? "").trim()
            ? `Resource source: ${v.source}`
            : "Resource provenance is an unverified user assumption.",
        ];
      if (v.mode === "daily") {
        const dc = capacity * n(v, "sunHours", 0) * (1 - loss);
        return result(
          [
            row("Daily DC energy after stated losses", dc, "kWh/day"),
            row("Daily AC energy before clipping", dc * eta, "kWh/day"),
          ],
          "EAC ≈ kWp × peak-sun hours × (1 − losses) × ηinverter",
          notes,
          [
            "Daily totals cannot resolve inverter clipping or self-consumption; use a chronological profile for those checks.",
          ],
        );
      }
      const profile = list(v, "profile", 0),
        dt = positive(v, "interval"),
        limit = n(v, "inverterLimit", 0);
      const series = profile.map((value, index) => {
        const before = value * capacity * (1 - loss) * eta;
        return {
          interval: index + 1,
          availableACKW: before,
          deliveredACKW: Math.min(limit, before),
          clippedKW: Math.max(0, before - limit),
        };
      });
      const out = result(
        [
          row(
            "Delivered AC energy",
            sum(series.map((s) => s.deliveredACKW)) * dt,
            "kWh",
          ),
          row(
            "AC-equivalent clipped energy",
            sum(series.map((s) => s.clippedKW)) * dt,
            "kWh",
          ),
          row(
            "Peak delivered AC output",
            Math.max(...series.map((s) => s.deliveredACKW)),
            "kW",
          ),
        ],
        "PAC,t = min(PDC,normalized,t × kWp × (1 − losses) × η, inverter limit)",
        notes,
      );
      out.series = series;
      return out;
    },
  }),
  defineTool({
    id: "T40",
    title: "PV string voltage & current",
    category,
    description:
      "Manufacturer-input temperature-voltage worksheet with separate MPPT, absolute-voltage and current comparisons.",
    inputs: [
      N("voc", "Module open-circuit voltage at reference temperature", "V", 0),
      N("vmp", "Module maximum-power voltage at reference temperature", "V", 0),
      N("vocCoefficient", "Voc temperature coefficient", "%/°C"),
      N("vmpCoefficient", "Vmp temperature coefficient", "%/°C"),
      N(
        "referenceTemperature",
        "Datasheet reference temperature",
        "°C",
        -273.15,
      ),
      N("coldTemperature", "Design minimum cell temperature", "°C", -273.15),
      N("hotTemperature", "Design maximum cell temperature", "°C", -273.15),
      N("series", "Modules in series per string", "", 1),
      N("parallel", "Equal parallel strings on this MPPT", "", 1),
      N("isc", "Module short-circuit current", "A", 0),
      N("imp", "Module maximum-power current", "A", 0),
      N("currentFactor", "Applicable maximum-current adjustment factor", "", 0),
      N("maximumVoltage", "Inverter absolute maximum DC voltage", "V", 0),
      N("mpptMinimum", "Applicable MPPT voltage minimum", "V", 0),
      N("mpptMaximum", "Applicable MPPT voltage maximum", "V", 0),
      N("maximumCurrent", "MPPT maximum operating current", "A", 0),
      N("maximumShortCircuit", "MPPT maximum short-circuit current", "A", 0),
      sourceInput(
        "moduleSource",
        "Module datasheet and coefficient conditions",
      ),
      sourceInput(
        "inverterSource",
        "Inverter datasheet and design-condition evidence",
      ),
    ],
    exampleInputs: {
      voc: 50,
      vmp: 42,
      vocCoefficient: -0.28,
      vmpCoefficient: -0.35,
      referenceTemperature: 25,
      coldTemperature: -10,
      hotTemperature: 70,
      series: 10,
      parallel: 1,
      isc: 11,
      imp: 10.5,
      currentFactor: 1,
      maximumVoltage: 600,
      mpptMinimum: 250,
      mpptMaximum: 500,
      maximumCurrent: 13,
      maximumShortCircuit: 16,
    },
    calculate(v) {
      const cold = n(v, "coldTemperature"),
        hot = n(v, "hotTemperature"),
        ref = n(v, "referenceTemperature"),
        count = integer(v, "series"),
        parallel = integer(v, "parallel");
      if (cold > hot)
        throw new Error("Minimum design temperature must not exceed maximum.");
      const voc = positive(v, "voc"),
        vmp = positive(v, "vmp");
      if (vmp > voc)
        throw new Error(
          "Module Vmp must not exceed Voc at the same reference condition.",
        );
      const correct = (voltage: number, beta: number, temperature: number) =>
        voltage * (1 + (beta / 100) * (temperature - ref)) * count;
      const vocCold = correct(voc, n(v, "vocCoefficient"), cold),
        vocHot = correct(voc, n(v, "vocCoefficient"), hot),
        vmpCold = correct(vmp, n(v, "vmpCoefficient"), cold),
        vmpHot = correct(vmp, n(v, "vmpCoefficient"), hot);
      if (Math.min(vocCold, vocHot, vmpCold, vmpHot) <= 0)
        throw new Error(
          "Temperature coefficients produce a non-positive voltage outside this linear model.",
        );
      const mpptMin = positive(v, "mpptMinimum"),
        mpptMax = positive(v, "mpptMaximum");
      if (mpptMin > mpptMax)
        throw new Error("MPPT minimum must not exceed maximum.");
      const isc = n(v, "isc", 0) * parallel * positive(v, "currentFactor"),
        imp = n(v, "imp", 0) * parallel * n(v, "currentFactor");
      if (n(v, "imp") > n(v, "isc"))
        throw new Error(
          "Imp must not exceed Isc at the same stated reference condition.",
        );
      return evidence(
        result(
          [
            row("Cold string Voc", vocCold, "V"),
            row("Hot string Vmp", vmpHot, "V"),
            row("Cold string Vmp", vmpCold, "V"),
            row("Adjusted array short-circuit current", isc, "A"),
            row("Adjusted operating current", imp, "A"),
            row(
              "Absolute DC voltage condition",
              outcome(
                Math.max(vocCold, vocHot) <= positive(v, "maximumVoltage"),
              ),
            ),
            row(
              "MPPT voltage conditions",
              outcome(
                Math.min(vmpCold, vmpHot) >= mpptMin &&
                  Math.max(vmpCold, vmpHot) <= mpptMax,
              ),
            ),
            row(
              "Operating current condition",
              outcome(imp <= n(v, "maximumCurrent", 0)),
            ),
            row(
              "Short-circuit current condition",
              outcome(isc <= n(v, "maximumShortCircuit", 0)),
            ),
          ],
          "Vstring(T) = Nseries × Vref × [1 + β(%/°C)/100 × (T − Tref)]; Iarray = Nparallel × Imodule × entered adjustment",
          [
            "Temperature coefficients are distinct for Voc and Vmp; the power coefficient is never substituted.",
            "All limits, irradiance/current adjustments, tolerances and temperature bounds must be appropriate to the chosen equipment. Startup voltage, protection and overall installation compliance are separate.",
          ],
          [],
          [
            "https://files.sma.de/downloads/DC-PL-en-11.pdf",
            "https://manuals.sma.de/SBSExx-US-50/en-US/12406857099.html",
          ],
        ),
        v,
        ["moduleSource", "inverterSource"],
      );
    },
  }),
  defineTool({
    id: "T41",
    title: "Wind supplied-profile energy",
    category,
    description:
      "Integrate supplied output, or interpolate an entered manufacturer power curve with wind-speed samples.",
    inputs: [
      S("mode", "Input basis", [
        ["power", "Supplied output power"],
        ["curve", "Supplied wind speed + power curve"],
      ]),
      T(
        "profile",
        "Power (kW) or wind-speed (m/s) samples",
        "Comma-separated samples; basis follows the selected mode.",
      ),
      T(
        "curve",
        "Manufacturer curve, wind speed:power pairs",
        "For example, each entry is speed in m/s : output in kW. No extrapolation.",
        false,
      ),
      N("hours", "Actual elapsed time per sample", "h", 0),
      N("loss", "Additional loss fraction not already in data", "", 0, 1),
      sourceInput(
        "source",
        "Profile / power-curve source, conditions and period",
      ),
    ],
    exampleInputs: {
      mode: "power",
      profile: "0, 1, 2, 1",
      hours: 1,
      loss: 0.1,
    },
    calculate(v) {
      const samples = list(v, "profile", 0),
        dt = positive(v, "hours"),
        loss = n(v, "loss", 0, 1);
      let powers = samples;
      if (v.mode === "curve") {
        const raw = String(v.curve ?? "").trim();
        if (!raw) throw new Error("Enter a manufacturer power curve.");
        const curve = raw.split(/[,;\n]+/).map((pair, index) => {
          const pieces = pair.trim().split(":");
          const values = pieces.map(Number);
          if (
            pieces.some((piece) => !piece.trim()) ||
            values.length !== 2 ||
            values.some((x) => !Number.isFinite(x) || x < 0)
          )
            throw new Error(
              `Curve point ${index + 1} must be a non-negative speed:power pair.`,
            );
          return { speed: values[0], power: values[1] };
        });
        if (
          curve.length < 2 ||
          curve.length > 1024 ||
          curve.some(
            (p, index) => index > 0 && p.speed <= curve[index - 1].speed,
          )
        )
          throw new Error(
            "Enter 2–1,024 curve points with strictly increasing wind speed.",
          );
        powers = samples.map((speed) => {
          if (speed < curve[0].speed || speed > curve[curve.length - 1].speed)
            throw new Error(
              "Every wind-speed sample must fall within the supplied curve; no extrapolation is performed.",
            );
          let index = curve.findIndex((point) => point.speed >= speed);
          if (index === 0) return curve[0].power;
          const lo = curve[index - 1],
            hi = curve[index];
          return (
            lo.power +
            ((hi.power - lo.power) * (speed - lo.speed)) / (hi.speed - lo.speed)
          );
        });
      }
      const out = evidence(
        result(
          [
            row("Delivered wind energy", sum(powers) * (1 - loss) * dt, "kWh"),
            row(
              "Peak delivered output",
              Math.max(...powers) * (1 - loss),
              "kW",
            ),
          ],
          v.mode === "power"
            ? "E = ΣPsupplied × (1 − additional losses) × Δt"
            : "Linear interpolation between supplied curve points; E = ΣP(v) × (1 − losses) × Δt",
          [
            "No live wind measurement, air-density correction or invented turbine curve.",
            "Do not count losses already included in the supplied output/curve a second time.",
          ],
        ),
        v,
      );
      out.series = powers.map((power, i) => ({
        interval: i + 1,
        sourceValue: samples[i],
        deliveredKW: power * (1 - loss),
      }));
      return out;
    },
  }),
];
