export interface FlightPlan {
  id: string;
  lastModified: string;

  // Header
  date: string;

  // Field 7 - Aircraft Identification
  aircraftIdentification: string;

  // Field 8 - Flight Rules
  flightRules: string;

  // Type of Flight
  typeOfFlight: string;

  // Field 9 - Number
  number: string;

  // Type of Aircraft
  typeOfAircraft: string;

  // Wake Turbulence Category
  wakeTurbulenceCategory: string;

  // Field 10 - Equipment
  equipment: string;

  // Field 13 - Departure Aerodrome
  departureAerodrome: string;

  // Time
  time: string;

  // Field 15 - Cruising Speed
  cruisingSpeed: string;

  // Level
  level: string;

  // Route
  route: string;
  route2: string;
  route3: string;
  route4: string;
  route5: string;

  // Field 16 - Destination Aerodrome
  destinationAerodrome: string;

  // Total EET
  eetHr: string;
  eetMin: string;

  // ALTN Aerodrome
  altnAerodrome: string;

  // 2nd ALTN Aerodrome
  secondAltnAerodrome: string;

  // Field 18 - Other Information
  otherInformation: string;
  otherInfo2: string;
  otherInfo3: string;
  otherInfo4: string;

  // Field 19 - Supplementary Information
  enduranceHr: string;
  enduranceMin: string;
  personsOnBoard: string;

  // Emergency Radio
  emergRadioUHF: boolean;
  emergRadioVHF: boolean;
  emergRadioELT: boolean;

  // Survival Equipment
  survival: boolean;
  survivalPolar: boolean;
  survivalDesert: boolean;
  survivalMaritime: boolean;
  survivalJungle: boolean;

  // Jackets
  jacket: boolean;
  jacketLight: boolean;
  jacketFluorescent: boolean;
  jacketUHF: boolean;
  jacketVHF: boolean;

  // Dinghies
  numDinghies: string;
  dinghiesCapacity: string;
  dinghiesCover: boolean;
  numDinghiesBool: boolean;
  tireCoverColor: string;

  // Aircraft Color and Markings
  aircraftColor: string;

  // Remarks
  remarks: string;
  observations: boolean;

  // Pilot-in-Command
  pilotInCommand: string;

  // Filed By
  filedBy: string;
  filedByLicNum: string;
}

export function createEmptyFlightPlan(): FlightPlan {
  return {
    id: crypto.randomUUID(),
    lastModified: new Date().toISOString(),
    date: '',
    aircraftIdentification: '',
    flightRules: 'V',
    typeOfFlight: 'G',
    number: '',
    typeOfAircraft: '',
    wakeTurbulenceCategory: 'L',
    equipment: 'S/C',
    departureAerodrome: '',
    time: '',
    cruisingSpeed: '',
    level: '',
    route: '',
    route2: '',
    route3: '',
    route4: '',
    route5: '',
    destinationAerodrome: '',
    eetHr: '',
    eetMin: '',
    altnAerodrome: '',
    secondAltnAerodrome: '',
    otherInformation: '',
    otherInfo2: '',
    otherInfo3: '',
    otherInfo4: '',
    enduranceHr: '',
    enduranceMin: '',
    personsOnBoard: '',
    emergRadioUHF: false,
    emergRadioVHF: false,
    emergRadioELT: false,
    survival: false,
    survivalPolar: false,
    survivalDesert: false,
    survivalMaritime: false,
    survivalJungle: false,

    jacket: false,
    jacketLight: false,
    jacketFluorescent: false,
    jacketUHF: false,
    jacketVHF: false,
    numDinghies: '',
    dinghiesCapacity: '',
    dinghiesCover: false,
    numDinghiesBool: false,
    tireCoverColor: '',
    aircraftColor: '',
    remarks: '',
    observations: false,
    pilotInCommand: '',
    filedBy: '',
    filedByLicNum: '',
  };
}
