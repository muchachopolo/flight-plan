import type { AircraftTemplate, RouteTemplate, PilotTemplate, CompanyTemplate, SupplementaryTemplate, FiledByTemplate, DepartureTemplate, TemplateStore, TemplateSection } from './templateTypes';
import type { FlightPlan } from './types';

const STORAGE_KEY = 'flight-plan-templates';

function loadAll(): TemplateStore {
  const defaults: TemplateStore = { aircraft: [], route: [], pilot: [], company: [], supplementary: [], filedBy: [], departure: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}

function saveAll(store: TemplateStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function loadTemplates(section: TemplateSection) {
  return loadAll()[section];
}

export function saveTemplate(section: TemplateSection, template: AircraftTemplate | RouteTemplate | PilotTemplate | CompanyTemplate | SupplementaryTemplate | FiledByTemplate | DepartureTemplate) {
  const store = loadAll();
  const idx = store[section].findIndex(t => t.id === template.id);
  if (idx >= 0) {
    store[section][idx] = template as any;
  } else {
    store[section].push(template as any);
  }
  saveAll(store);
}

export function deleteTemplate(section: TemplateSection, id: string) {
  const store = loadAll();
  store[section] = store[section].filter(t => t.id !== id) as any;
  saveAll(store);
}

export function buildOtherInformation(company: CompanyTemplate | null, routeRemarks: string): string {
  const parts: string[] = [];
  if (company) parts.push(`OPR/${company.companyName}`);
  if (routeRemarks) parts.push(`RMK/${routeRemarks}`);
  return parts.join(' ');
}

export function buildOtherInfo2(pilot: PilotTemplate): string {
  return `PIC/${pilot.name} LIC/${pilot.licence} CEL/${pilot.phone}`;
}

export function buildOtherInfo3(pilot: PilotTemplate): string {
  return `${pilot.pilotType}/${pilot.name} LIC/${pilot.licence} CEL/${pilot.phone}`;
}

export function buildPilotInCommand(pilot: PilotTemplate): string {
  return `${pilot.name} LIC/${pilot.licence}`;
}

export function applyAircraftTemplate(_plan: FlightPlan, template: AircraftTemplate): Partial<FlightPlan> {
  return {
    aircraftIdentification: template.aircraftIdentification,
    flightRules: template.flightRules,
    typeOfFlight: template.typeOfFlight,
    number: template.number,
    typeOfAircraft: template.typeOfAircraft,
    wakeTurbulenceCategory: template.wakeTurbulenceCategory,
    equipment: template.equipment,
    aircraftColor: template.aircraftColor,
  };
}

export function applyRouteTemplate(_plan: FlightPlan, template: RouteTemplate): Partial<FlightPlan> {
  return {
    route: template.route,
    route2: template.route2,
    route3: template.route3,
    route4: template.route4,
    route5: template.route5,
  };
}

export function applySupplementaryTemplate(template: SupplementaryTemplate): Partial<FlightPlan> {
  return {
    emergRadioUHF: template.emergRadioUHF,
    emergRadioVHF: template.emergRadioVHF,
    emergRadioELT: template.emergRadioELT,
    survival: template.survival,
    survivalPolar: template.survivalPolar,
    survivalDesert: template.survivalDesert,
    survivalMaritime: template.survivalMaritime,
    survivalJungle: template.survivalJungle,
    jacket: template.jacket,
    jacketLight: template.jacketLight,
    jacketFluorescent: template.jacketFluorescent,
    jacketUHF: template.jacketUHF,
    jacketVHF: template.jacketVHF,
    numDinghies: template.numDinghies,
    dinghiesCapacity: template.dinghiesCapacity,
    dinghiesCover: template.dinghiesCover,
    numDinghiesBool: template.numDinghiesBool,
    tireCoverColor: template.tireCoverColor,
    remarks: template.remarks,
    observations: template.observations,
  };
}

export function applyFiledByTemplate(template: FiledByTemplate): Partial<FlightPlan> {
  return {
    filedBy: template.filedBy,
    filedByLicNum: template.filedByLicNum ? `LIC/${template.filedByLicNum}` : '',
  };
}

export function applyDepartureTemplate(template: DepartureTemplate): Partial<FlightPlan> {
  return {
    departureAerodrome: template.departureAerodrome,
    destinationAerodrome: template.destinationAerodrome,
    time: template.time,
    cruisingSpeed: template.cruisingSpeed,
    level: template.level,
    enduranceHr: template.enduranceHr,
    enduranceMin: template.enduranceMin,
    personsOnBoard: template.personsOnBoard,
    altnAerodrome: template.altnAerodrome,
    secondAltnAerodrome: template.secondAltnAerodrome,
    eetHr: template.eetHr,
    eetMin: template.eetMin,
  };
}
