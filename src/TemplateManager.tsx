import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { AircraftTemplate, RouteTemplate, PilotTemplate, CompanyTemplate, SupplementaryTemplate, FiledByTemplate, DepartureTemplate, TemplateSection } from './templateTypes';
import { loadTemplates, saveTemplate, deleteTemplate } from './templateStorage';
import './TemplateManager.css';

const SECTIONS: { key: TemplateSection; label: string }[] = [
  { key: 'aircraft', label: 'Aircraft' },
  { key: 'departure', label: 'Departure' },
  { key: 'route', label: 'Route' },
  { key: 'pilot', label: 'Pilot' },
  { key: 'company', label: 'Company' },
  { key: 'supplementary', label: 'Supplementary' },
  { key: 'filedBy', label: 'Filed By' },
];

function newId(): string {
  return crypto.randomUUID();
}

function AircraftForm({ initial, onSave, onCancel }: { initial?: AircraftTemplate; onSave: (t: AircraftTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [aircraftIdentification, setAircraftIdentification] = useState(initial?.aircraftIdentification ?? '');
  const [flightRules, setFlightRules] = useState(initial?.flightRules ?? 'V');
  const [typeOfFlight, setTypeOfFlight] = useState(initial?.typeOfFlight ?? 'G');
  const [number, setNumber] = useState(initial?.number ?? '');
  const [typeOfAircraft, setTypeOfAircraft] = useState(initial?.typeOfAircraft ?? '');
  const [wakeTurbulenceCategory, setWakeTurbulenceCategory] = useState(initial?.wakeTurbulenceCategory ?? 'L');
  const initEquip = initial?.equipment ?? 'S/C';
  const [commNav, setCommNav] = useState(initEquip.split('/')[0] ?? 'S');
  const [surv, setSurv] = useState(initEquip.split('/')[1] ?? 'C');
  const [aircraftColor, setAircraftColor] = useState(initial?.aircraftColor ?? '');

  return (
    <div className="tm-form">
      <label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Aircraft ID <input value={aircraftIdentification} onChange={e => setAircraftIdentification(e.target.value.toUpperCase())} maxLength={7} /></label>
      <label>Flight Rules
        <select value={flightRules} onChange={e => setFlightRules(e.target.value)}>
          <option value="V">V</option><option value="I">I</option><option value="Y">Y</option><option value="Z">Z</option>
        </select>
      </label>
      <label>Type of Flight
        <select value={typeOfFlight} onChange={e => setTypeOfFlight(e.target.value)}>
          <option value="G">G</option><option value="S">S</option><option value="N">N</option><option value="M">M</option><option value="X">X</option>
        </select>
      </label>
      <label>Number <input value={number} onChange={e => setNumber(e.target.value.toUpperCase())} maxLength={2} /></label>
      <label>Type of Aircraft <input value={typeOfAircraft} onChange={e => setTypeOfAircraft(e.target.value.toUpperCase())} maxLength={4} /></label>
      <label>Wake Turbulence
        <select value={wakeTurbulenceCategory} onChange={e => setWakeTurbulenceCategory(e.target.value)}>
          <option value="J">J</option><option value="H">H</option><option value="M">M</option><option value="L">L</option>
        </select>
      </label>
      <div className="tm-equip-row">
        <label>COM/NAV
          <select value={commNav} onChange={e => setCommNav(e.target.value)}>
            <option value="N">N</option><option value="S">S</option><option value="H">H</option><option value="U">U</option><option value="V">V</option><option value="Y">Y</option><option value="G">G</option><option value="D">D</option><option value="B">B</option><option value="A">A</option><option value="F">F</option><option value="O">O</option><option value="L">L</option><option value="I">I</option><option value="K">K</option><option value="W">W</option><option value="X">X</option><option value="Z">Z</option>
          </select>
        </label>
        <label>COM/NAV MODE
          <select value={surv} onChange={e => setSurv(e.target.value)}>
            <option value="C">C</option><option value="E">E</option><option value="H">H</option><option value="L">L</option><option value="P">P</option><option value="S">S</option><option value="X">X</option>
          </select>
        </label>
      </div>
      <label>Aircraft Color &amp; Markings <input value={aircraftColor} onChange={e => setAircraftColor(e.target.value.toUpperCase())} maxLength={50} /></label>
      <div className="tm-form-btns">
        <button onClick={() => onSave({ id: initial?.id ?? newId(), name, aircraftIdentification, flightRules, typeOfFlight, number, typeOfAircraft, wakeTurbulenceCategory, equipment: `${commNav}/${surv}`, aircraftColor })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function RouteForm({ initial, onSave, onCancel }: { initial?: RouteTemplate; onSave: (t: RouteTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [route, setRoute] = useState(initial?.route ?? '');
  const [route2, setRoute2] = useState(initial?.route2 ?? '');
  const [route3, setRoute3] = useState(initial?.route3 ?? '');
  const [route4, setRoute4] = useState(initial?.route4 ?? '');
  const [route5, setRoute5] = useState(initial?.route5 ?? '');
  const [remarks, setRemarks] = useState(initial?.remarks ?? '');

  return (
    <div className="tm-form">
      <label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Route Line 1 <input value={route} onChange={e => setRoute(e.target.value.toUpperCase())} /></label>
      <label>Route Line 2 <input value={route2} onChange={e => setRoute2(e.target.value.toUpperCase())} /></label>
      <label>Route Line 3 <input value={route3} onChange={e => setRoute3(e.target.value.toUpperCase())} /></label>
      <label>Route Line 4 <input value={route4} onChange={e => setRoute4(e.target.value.toUpperCase())} /></label>
      <label>Route Line 5 <input value={route5} onChange={e => setRoute5(e.target.value.toUpperCase())} /></label>
      <label>Remarks <input value={remarks} onChange={e => setRemarks(e.target.value.toUpperCase())} /></label>
      <div className="tm-form-btns">
        <button onClick={() => onSave({ id: initial?.id ?? newId(), name, route, route2, route3, route4, route5, remarks })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function DepartureForm({ initial, onSave, onCancel }: { initial?: DepartureTemplate; onSave: (t: DepartureTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [departureAerodrome, setDepartureAerodrome] = useState(initial?.departureAerodrome ?? '');
  const [destinationAerodrome, setDestinationAerodrome] = useState(initial?.destinationAerodrome ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [cruisingSpeed, setCruisingSpeed] = useState(initial?.cruisingSpeed ?? '');
  const [level, setLevel] = useState(initial?.level ?? '');
  const [enduranceHr, setEnduranceHr] = useState(initial?.enduranceHr ?? '');
  const [enduranceMin, setEnduranceMin] = useState(initial?.enduranceMin ?? '');
  const [personsOnBoard, setPersonsOnBoard] = useState(initial?.personsOnBoard ?? '');
  const [altnAerodrome, setAltnAerodrome] = useState(initial?.altnAerodrome ?? '');
  const [secondAltnAerodrome, setSecondAltnAerodrome] = useState(initial?.secondAltnAerodrome ?? '');
  const [eetHr, setEetHr] = useState(initial?.eetHr ?? '');
  const [eetMin, setEetMin] = useState(initial?.eetMin ?? '');

  return (
    <div className="tm-form">
      <label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Departure Aerodrome <input value={departureAerodrome} onChange={e => setDepartureAerodrome(e.target.value.toUpperCase())} maxLength={4} /></label>
      <label>Destination Aerodrome <input value={destinationAerodrome} onChange={e => setDestinationAerodrome(e.target.value.toUpperCase())} maxLength={4} /></label>
      <label>Departure Time <input value={time} onChange={e => setTime(e.target.value)} maxLength={4} /></label>
      <div className="tm-form-row">
        <label>Cruising Speed <input value={cruisingSpeed} onChange={e => setCruisingSpeed(e.target.value.toUpperCase())} maxLength={5} /></label>
        <label>Level <input value={level} onChange={e => setLevel(e.target.value.toUpperCase())} maxLength={5} /></label>
      </div>
      <div className="tm-form-row">
        <label>Endurance Hr <input value={enduranceHr} onChange={e => setEnduranceHr(e.target.value)} maxLength={2} /></label>
        <label>Endurance Min <input value={enduranceMin} onChange={e => setEnduranceMin(e.target.value)} maxLength={2} /></label>
        <label>Persons on Board <input value={personsOnBoard} onChange={e => setPersonsOnBoard(e.target.value)} maxLength={3} /></label>
      </div>
      <label>ALTN Aerodrome <input value={altnAerodrome} onChange={e => setAltnAerodrome(e.target.value.toUpperCase())} maxLength={4} /></label>
      <label>2nd ALTN Aerodrome <input value={secondAltnAerodrome} onChange={e => setSecondAltnAerodrome(e.target.value.toUpperCase())} maxLength={4} /></label>
      <div className="tm-form-row">
        <label>EET Hr <input value={eetHr} onChange={e => setEetHr(e.target.value)} maxLength={2} /></label>
        <label>EET Min <input value={eetMin} onChange={e => setEetMin(e.target.value)} maxLength={2} /></label>
      </div>
      <div className="tm-form-btns">
        <button onClick={() => onSave({ id: initial?.id ?? newId(), name, departureAerodrome, destinationAerodrome, time, cruisingSpeed, level, enduranceHr, enduranceMin, personsOnBoard, altnAerodrome, secondAltnAerodrome, eetHr, eetMin })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function PilotForm({ initial, onSave, onCancel }: { initial?: PilotTemplate; onSave: (t: PilotTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [licence, setLicence] = useState(initial?.licence ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [pilotType, setPilotType] = useState(initial?.pilotType ?? 'PIC');

  return (
    <div className="tm-form">
      <label>Name <input value={name} onChange={e => setName(e.target.value.toUpperCase())} /></label>
      <label>Licence <input value={licence} onChange={e => setLicence(e.target.value.toUpperCase())} /></label>
      <label>Phone <input value={phone} onChange={e => setPhone(e.target.value)} /></label>
      <label>Pilot Type
        <select value={pilotType} onChange={e => setPilotType(e.target.value)}>
          <option value="PIC">PIC</option><option value="ALUMNO">ALUMNO</option><option value="SIC">SIC</option>
        </select>
      </label>
      <div className="tm-form-btns">
        <button onClick={() => onSave({ id: initial?.id ?? newId(), name, licence, phone, pilotType })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function CompanyForm({ initial, onSave, onCancel }: { initial?: CompanyTemplate; onSave: (t: CompanyTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [companyName, setCompanyName] = useState(initial?.companyName ?? '');

  return (
    <div className="tm-form">
      <label>Display Name <input value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Company Name <input value={companyName} onChange={e => setCompanyName(e.target.value.toUpperCase())} /></label>
      <div className="tm-form-btns">
        <button onClick={() => onSave({ id: initial?.id ?? newId(), name, companyName })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function SupplementaryForm({ initial, onSave, onCancel }: { initial?: SupplementaryTemplate; onSave: (t: SupplementaryTemplate) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emergRadioUHF, setEmergRadioUHF] = useState(initial?.emergRadioUHF ?? false);
  const [emergRadioVHF, setEmergRadioVHF] = useState(initial?.emergRadioVHF ?? false);
  const [emergRadioELT, setEmergRadioELT] = useState(initial?.emergRadioELT ?? false);
  const [survival, setSurvival] = useState(initial?.survival ?? false);
  const [survivalPolar, setSurvivalPolar] = useState(initial?.survivalPolar ?? false);
  const [survivalDesert, setSurvivalDesert] = useState(initial?.survivalDesert ?? false);
  const [survivalMaritime, setSurvivalMaritime] = useState(initial?.survivalMaritime ?? false);
  const [survivalJungle, setSurvivalJungle] = useState(initial?.survivalJungle ?? false);
  const [jacket, setJacket] = useState(initial?.jacket ?? false);
  const [jacketLight, setJacketLight] = useState(initial?.jacketLight ?? false);
  const [jacketFluorescent, setJacketFluorescent] = useState(initial?.jacketFluorescent ?? false);
  const [jacketUHF, setJacketUHF] = useState(initial?.jacketUHF ?? false);
  const [jacketVHF, setJacketVHF] = useState(initial?.jacketVHF ?? false);
  const [numDinghies, setNumDinghies] = useState(initial?.numDinghies ?? '');
  const [dinghiesCapacity, setDinghiesCapacity] = useState(initial?.dinghiesCapacity ?? '');
  const [dinghiesCover, setDinghiesCover] = useState(initial?.dinghiesCover ?? false);
  const [numDinghiesBool, setNumDinghiesBool] = useState(initial?.numDinghiesBool ?? false);
  const [tireCoverColor, setTireCoverColor] = useState(initial?.tireCoverColor ?? '');
  const [remarks, setRemarks] = useState(initial?.remarks ?? '');
  const [observations, setObservations] = useState(initial?.observations ?? false);

  const handleSave = () => {
    onSave({
      id: initial?.id ?? newId(), name,
      emergRadioUHF, emergRadioVHF, emergRadioELT,
      survival, survivalPolar, survivalDesert, survivalMaritime, survivalJungle,
      jacket, jacketLight, jacketFluorescent, jacketUHF, jacketVHF,
      numDinghies, dinghiesCapacity, dinghiesCover, numDinghiesBool, tireCoverColor,
      remarks, observations,
    });
  };

  return (
    <div className="tm-form">
      <label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
      <fieldset className="tm-fieldset">
        <legend>Emergency Radio</legend>
        <label className="tm-checkbox"><input type="checkbox" checked={emergRadioUHF} onChange={e => setEmergRadioUHF(e.target.checked)} /> UHF</label>
        <label className="tm-checkbox"><input type="checkbox" checked={emergRadioVHF} onChange={e => setEmergRadioVHF(e.target.checked)} /> VHF</label>
        <label className="tm-checkbox"><input type="checkbox" checked={emergRadioELT} onChange={e => setEmergRadioELT(e.target.checked)} /> ELT</label>
      </fieldset>
      <fieldset className="tm-fieldset">
        <legend>Survival Equipment</legend>
        <label className="tm-checkbox"><input type="checkbox" checked={survival} onChange={e => setSurvival(e.target.checked)} /> S</label>
        <label className="tm-checkbox"><input type="checkbox" checked={survivalPolar} onChange={e => setSurvivalPolar(e.target.checked)} /> Polar</label>
        <label className="tm-checkbox"><input type="checkbox" checked={survivalDesert} onChange={e => setSurvivalDesert(e.target.checked)} /> Desert</label>
        <label className="tm-checkbox"><input type="checkbox" checked={survivalMaritime} onChange={e => setSurvivalMaritime(e.target.checked)} /> Maritime</label>
        <label className="tm-checkbox"><input type="checkbox" checked={survivalJungle} onChange={e => setSurvivalJungle(e.target.checked)} /> Jungle</label>
      </fieldset>
      <fieldset className="tm-fieldset">
        <legend>Jackets</legend>
        <label className="tm-checkbox"><input type="checkbox" checked={jacket} onChange={e => setJacket(e.target.checked)} /> J</label>
        <label className="tm-checkbox"><input type="checkbox" checked={jacketLight} onChange={e => setJacketLight(e.target.checked)} /> Light</label>
        <label className="tm-checkbox"><input type="checkbox" checked={jacketFluorescent} onChange={e => setJacketFluorescent(e.target.checked)} /> Fluorescent</label>
        <label className="tm-checkbox"><input type="checkbox" checked={jacketUHF} onChange={e => setJacketUHF(e.target.checked)} /> UHF</label>
        <label className="tm-checkbox"><input type="checkbox" checked={jacketVHF} onChange={e => setJacketVHF(e.target.checked)} /> VHF</label>
      </fieldset>
      <fieldset className="tm-fieldset">
        <legend>Dinghies</legend>
        <label className="tm-checkbox"><input type="checkbox" checked={numDinghiesBool} onChange={e => setNumDinghiesBool(e.target.checked)} /> Check if NOT carried</label>
        <label>Number <input value={numDinghies} onChange={e => setNumDinghies(e.target.value)} maxLength={2} /></label>
        <label>Capacity <input value={dinghiesCapacity} onChange={e => setDinghiesCapacity(e.target.value)} maxLength={3} /></label>
        <label className="tm-checkbox"><input type="checkbox" checked={dinghiesCover} onChange={e => setDinghiesCover(e.target.checked)} /> Check if NOT Cover</label>
        <label>Cover Color <input value={tireCoverColor} onChange={e => setTireCoverColor(e.target.value.toUpperCase())} /></label>
      </fieldset>
      <fieldset className="tm-fieldset">
        <legend>Remarks</legend>
        <label className="tm-checkbox"><input type="checkbox" checked={observations} onChange={e => setObservations(e.target.checked)} /> Check if NOT remarks</label>
        <label>Remarks <input value={remarks} onChange={e => setRemarks(e.target.value.toUpperCase())} /></label>
      </fieldset>
      <div className="tm-form-btns">
        <button onClick={handleSave}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function FiledByForm({ initial, onSave, onCancel }: { initial?: FiledByTemplate; onSave: (t: FiledByTemplate) => void; onCancel: () => void }) {
  const [filedBy, setFiledBy] = useState(initial?.filedBy ?? '');
  const [filedByLicNum, setFiledByLicNum] = useState(initial?.filedByLicNum ?? '');

  return (
    <div className="tm-form">
      <label>Filed By <input value={filedBy} onChange={e => setFiledBy(e.target.value.toUpperCase())} /></label>
      <label>Licence Number <input value={filedByLicNum} onChange={e => setFiledByLicNum(e.target.value.toUpperCase())} /></label>
      <div className="tm-form-btns">
        <button onClick={() => onSave({ id: initial?.id ?? newId(), name: filedBy, filedBy, filedByLicNum })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function TemplateManager() {
  const { section: urlSection } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const activeSection: TemplateSection = (urlSection as TemplateSection) || 'aircraft';

  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(() => {
    setTemplates(loadTemplates(activeSection));
  }, [activeSection]);

  useEffect(() => { reload(); setEditing(null); setCreating(false); }, [reload]);

  const handleSave = (template: any) => {
    saveTemplate(activeSection, template);
    setEditing(null);
    setCreating(false);
    reload();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    deleteTemplate(activeSection, id);
    reload();
  };

  const renderForm = () => {
    if (creating) {
      switch (activeSection) {
        case 'aircraft': return <AircraftForm onSave={handleSave} onCancel={() => setCreating(false)} />;
        case 'departure': return <DepartureForm onSave={handleSave} onCancel={() => setCreating(false)} />;
        case 'route': return <RouteForm onSave={handleSave} onCancel={() => setCreating(false)} />;
        case 'pilot': return <PilotForm onSave={handleSave} onCancel={() => setCreating(false)} />;
        case 'company': return <CompanyForm onSave={handleSave} onCancel={() => setCreating(false)} />;
        case 'supplementary': return <SupplementaryForm onSave={handleSave} onCancel={() => setCreating(false)} />;
        case 'filedBy': return <FiledByForm onSave={handleSave} onCancel={() => setCreating(false)} />;
      }
    }
    if (editing) {
      switch (activeSection) {
        case 'aircraft': return <AircraftForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
        case 'departure': return <DepartureForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
        case 'route': return <RouteForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
        case 'pilot': return <PilotForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
        case 'company': return <CompanyForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
        case 'supplementary': return <SupplementaryForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
        case 'filedBy': return <FiledByForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
      }
    }
    return null;
  };

  return (
    <div className="tm-container">
      <div className="tm-header">
        <Link to="/" className="tm-back">&larr; Back to Form</Link>
        <h1>Template Manager</h1>
      </div>

      <div className="tm-tabs">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            className={`tm-tab${activeSection === s.key ? ' tm-tab-active' : ''}`}
            onClick={() => navigate(`/templates/${s.key}`)}
          >{s.label}</button>
        ))}
      </div>

      {(creating || editing) ? (
        renderForm()
      ) : (
        <>
          <button className="tm-create-btn" onClick={() => setCreating(true)}>+ New {SECTIONS.find(s => s.key === activeSection)?.label} Template</button>
          <div className="tm-list">
            {templates.length === 0 && <p>No templates yet.</p>}
            {templates.map(t => (
              <div key={t.id} className="tm-item">
                <span className="tm-item-name">{t.name || '(unnamed)'}</span>
                <span className="tm-item-btns">
                  <button onClick={() => setEditing(t)}>Edit</button>
                  <button className="tm-del" onClick={() => handleDelete(t.id)}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
