import { createCircuit, createLoad, createProject } from '../domain/project';
import { type Load, type Project } from '../domain/types';

export interface ReferenceCase {
  id: string;
  name: string;
  description: string;
  assumptions: string[];
  expected: { installedKW: number; dailyKWh: number };
}

export const REFERENCE_CASES: ReferenceCase[] = [
  { id: 'home', name: 'Home · three-phase household', description: 'Lighting, kitchen equipment and cycling refrigeration.', assumptions: ['Analytical entered ratings, not surveyed equipment.', '24-hour repeated day; fridge uses 35% energy duty while its on-state current stays unchanged.'], expected: { installedKW: 2.57, dailyKWh: 6.46 } },
  { id: 'workshop', name: 'Workshop · motor and lighting', description: 'A 7.5 kW shaft-output motor with explicit running and starting assumptions.', assumptions: ['Motor efficiency 90%; displacement PF 0.85.', 'Entered starting multiplier 6, starting PF 0.30 and duration 3 s are an instructional scenario, not manufacturer data.'], expected: { installedKW: 8.633333333333333, dailyKWh: 35.733333333333334 } },
  { id: 'office', name: 'Office · IT and workstations', description: 'Round-the-clock IT, twelve workstations and lighting.', assumptions: ['All ratings and hours are analytical inputs.', 'The deliberately grouped workstation phase can be balanced by circuit reassignment.'], expected: { installedKW: 2.85, dailyKWh: 36.1 } },
  { id: 'industrial', name: 'Industrial · heater and drive', description: 'Balanced process heating and an 11 kW shaft-output motor.', assumptions: ['Motor efficiency 92%; displacement PF 0.88.', 'No claim of source capacity, cable size or protective coordination.'], expected: { installedKW: 23.956521739130434, dailyKWh: 131.7826086956522 } },
  { id: 'agricultural', name: 'Agriculture · pump system', description: 'A three-phase 5.5 kW shaft-output irrigation pump with lighting.', assumptions: ['Pump efficiency 88%; displacement PF 0.84; six hours per day.', 'Pumping hydraulic duty and source conditions require project-specific data.'], expected: { installedKW: 6.35, dailyKWh: 38 } },
  { id: 'pv-backup', name: 'Solar · storage and backup', description: 'Evening load with an explicitly supplied illustrative PV profile and battery.', assumptions: ['The solar profile is an analytical reference, not weather or live measurements.', '4 kWp × 5.2 equivalent sun-hours × 0.8 performance ratio = 16.64 kWh.', 'Island-capable operation is an entered reference assumption requiring real equipment verification.'], expected: { installedKW: 1, dailyKWh: 8 } },
  { id: 'ev', name: 'EV · deadline-aware charging', description: 'An existing household load and one constrained charging session.', assumptions: ['Base load 2 kW for six hours.', 'EV requires 12 kWh delivered, 90% charging efficiency, 7.4 kW charger and 9 kW site limit.', 'EV planning is separate from the base schedule until its proposal is applied.'], expected: { installedKW: 2, dailyKWh: 12 } },
];

const definitions: Record<string, Partial<Load>[]> = {
  home: [
    { name: 'Lighting (analytical)', category: 'Lighting', rating: 0.12, phase: 'L1', hoursPerDay: 5, startHour: 18 },
    { name: 'Kitchen appliance (analytical)', category: 'Appliances', rating: 2.3, phase: 'L2', hoursPerDay: 2, startHour: 18 },
    { name: 'Refrigeration (analytical)', category: 'Refrigeration', rating: 0.15, phase: 'L3', hoursPerDay: 24, startHour: 0, duty: 0.35, pf: 0.85 },
  ],
  workshop: [
    { name: '7.5 kW shaft motor (analytical)', category: 'Motors', entryMode: 'motor', rating: 7.5, connection: 'three', voltage: 400, pf: 0.85, efficiency: 0.9, hoursPerDay: 4, startHour: 9, startingMultiplier: 6, startingPF: 0.3, startingSeconds: 3 },
    { name: 'Workshop lighting (analytical)', category: 'Lighting', rating: 0.3, hoursPerDay: 8, startHour: 8 },
  ],
  office: [
    { name: 'IT rack (analytical)', category: 'IT', rating: 0.8, pf: 0.95, phase: 'L1', hoursPerDay: 24, startHour: 0, critical: true },
    { name: 'Workstations (analytical)', category: 'IT', rating: 0.15, quantity: 12, pf: 0.95, phase: 'L2', hoursPerDay: 8, startHour: 9 },
    { name: 'Office lighting (analytical)', category: 'Lighting', rating: 0.25, phase: 'L3', hoursPerDay: 10, startHour: 8 },
  ],
  industrial: [
    { name: 'Process heater (analytical)', category: 'Heating', rating: 12, connection: 'three', voltage: 400, hoursPerDay: 6, startHour: 8 },
    { name: '11 kW shaft motor (analytical)', category: 'Motors', entryMode: 'motor', rating: 11, connection: 'three', voltage: 400, pf: 0.88, efficiency: 0.92, hoursPerDay: 5, startHour: 9 },
  ],
  agricultural: [
    { name: 'Irrigation pump (analytical)', category: 'Pumps', entryMode: 'motor', rating: 5.5, connection: 'three', voltage: 400, efficiency: 0.88, pf: 0.84, hoursPerDay: 6, startHour: 5 },
    { name: 'Farm lighting (analytical)', category: 'Lighting', rating: 0.1, hoursPerDay: 5, startHour: 18 },
  ],
  'pv-backup': [{ name: 'Evening critical load (analytical)', rating: 1, hoursPerDay: 8, startHour: 18, critical: true }],
  ev: [{ name: 'Evening base load (analytical)', rating: 2, hoursPerDay: 6, startHour: 17 }],
};

export function createReferenceProject(id: string): Project {
  const reference = REFERENCE_CASES.find((item) => item.id === id);
  if (!reference) throw new Error('Unknown reference case.');
  const project = createProject(`Reference — ${reference.name}`);
  project.referenceCase = id;
  project.notes = `INSTRUCTIONAL REFERENCE CASE. ${reference.assumptions.join(' ')} Expected electrical installed input ${reference.expected.installedKW} kW; repeated-day energy ${reference.expected.dailyKWh} kWh. Not a surveyed or certified installation.`;
  const boardId = project.boards[0].id;
  project.loads = definitions[id].map((definition, index) => {
    const circuit = createCircuit(boardId, { name: `C${index + 1} · ${definition.category ?? 'General'}`, phase: definition.phase ?? 'L1' });
    project.circuits.push(circuit);
    return createLoad({ ...definition, boardId, circuitId: circuit.id, source: { kind: 'estimate', reference: 'AdigunPowerLab analytical reference fixture; intentionally entered assumptions, not manufacturer or measured data.' } });
  });
  if (id === 'pv-backup') {
    project.energy.pvKW = 4; project.energy.peakSunHours = 5.2;
    project.energy.pvHourlyProfile = [0, 0, 0, 0, 0, 0, 0, 0.1, 0.2, 0.4, 0.6, 0.8, 1, 0.8, 0.6, 0.4, 0.2, 0.1, 0, 0, 0, 0, 0, 0];
    project.energy.source = 'Explicit illustrative hourly profile for this opt-in reference case; normalized shape sum 5.2 hours.';
    project.energy.battery = { capacityKWh: 10, initialSoc: 0.5, minSoc: 0.2, maxSoc: 0.95, chargeKW: 3, dischargeKW: 3, chargeEfficiency: 0.9, dischargeEfficiency: 0.9, islandCapable: true };
  }
  if (id === 'ev') project.evSessions = [{ id: 'ev-reference-session', name: 'Analytical overnight charge', arrivalHour: 18, departureHour: 7, requiredKWh: 12, chargerKW: 7.4, vehicleKW: 7.4, efficiency: 0.9, siteLimitKW: 9, phase: 'L1' }];
  return project;
}

export const referenceProjects = REFERENCE_CASES;
