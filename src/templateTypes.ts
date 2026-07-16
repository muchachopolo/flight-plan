export interface AircraftTemplate {
  id: string;
  name: string;
  aircraftIdentification: string;
  flightRules: string;
  typeOfFlight: string;
  number: string;
  typeOfAircraft: string;
  wakeTurbulenceCategory: string;
  equipment: string;
  aircraftColor: string;
}

export interface RouteTemplate {
  id: string;
  name: string;
  route: string;
  route2: string;
  route3: string;
  route4: string;
  route5: string;
  remarks: string;
}

export interface PilotTemplate {
  id: string;
  name: string;
  licence: string;
  phone: string;
  pilotType: string;
}

export interface CompanyTemplate {
  id: string;
  name: string;
  companyName: string;
}

export interface SupplementaryTemplate {
  id: string;
  name: string;
  emergRadioUHF: boolean;
  emergRadioVHF: boolean;
  emergRadioELT: boolean;
  survival: boolean;
  survivalPolar: boolean;
  survivalDesert: boolean;
  survivalMaritime: boolean;
  survivalJungle: boolean;
  jacket: boolean;
  jacketLight: boolean;
  jacketFluorescent: boolean;
  jacketUHF: boolean;
  jacketVHF: boolean;
  numDinghies: string;
  dinghiesCapacity: string;
  dinghiesCover: boolean;
  numDinghiesBool: boolean;
  tireCoverColor: string;
  remarks: string;
  observations: boolean;
}

export interface FiledByTemplate {
  id: string;
  name: string;
  filedBy: string;
  filedByLicNum: string;
}

export interface DepartureTemplate {
  id: string;
  name: string;
  departureAerodrome: string;
  destinationAerodrome: string;
  time: string;
  cruisingSpeed: string;
  level: string;
  enduranceHr: string;
  enduranceMin: string;
  personsOnBoard: string;
  altnAerodrome: string;
  secondAltnAerodrome: string;
  eetHr: string;
  eetMin: string;
}

export interface TemplateStore {
  aircraft: AircraftTemplate[];
  route: RouteTemplate[];
  pilot: PilotTemplate[];
  company: CompanyTemplate[];
  supplementary: SupplementaryTemplate[];
  filedBy: FiledByTemplate[];
  departure: DepartureTemplate[];
}

export type TemplateSection = keyof TemplateStore;
