import { useCallback, useEffect, useState } from 'react';
import type { FlightPlan } from './types';
import { createEmptyFlightPlan } from './types';
import { savePlan, loadAllPlans, deletePlan, loadPlan } from './storage';
import type { TemplateSection } from './templateTypes';
import TemplateModal from './TemplateModal';
import { useTheme } from './ThemeContext';
import './FlightPlanForm.css';

type F = keyof FlightPlan;

// [field, x, y, w, h] — all in PDF points (612x792 page)
type FieldPos = [F, number, number, number, number];

// Exact positions from PDF rectangle extraction
const FIELDS: FieldPos[] = [
  // ── HEADER ──
  ['date',                  426,   45,  120,  13],

  // ── ROW: aircraft id / flight rules / type ──
  ['aircraftIdentification', 181,  201,  105,  14],
  ['flightRules',            384,  200,   16,  15],
  ['typeOfFlight',           504,  200,   16,  15],

  // ── ROW: number / type / wake / equipment ──
  ['number',                  50,  231,   29,  13],
  ['typeOfAircraft',         152,  231,   59,  13],
  ['wakeTurbulenceCategory', 324,  230,   16,  15],
  ['equipment',              440,  230,   78,  13],

  // ── ROW: departure / time ──
  ['departureAerodrome',      92,  261,   59,  13],
  ['time',                   225,  261,   65,  13],

  // ── ROW: speed / level / route ──
  ['cruisingSpeed',           50,  291,   71,  13],
  ['level',                  137,  291,   75,  13],
  ['route',                  226,  291,  357,  13],
  ['route2',                  37,  305,  545,  14],
  ['route3',                  37,  320,  545,  14],
  ['route4',                  37,  335,  545,  14],
  ['route5',                  37,  350,  500,  14],

  // ── ROW: destination / eet / altn / 2nd altn ──
  ['destinationAerodrome',    92,  396,   59,  13],
  ['eetHr',                  226,  396,   30,  13],
  ['eetMin',                 257,  396,   29,  13],
  ['altnAerodrome',          343,  396,   59,  13],
  ['secondAltnAerodrome',    460,  396,   59,  13],

  // ── FIELD 18: other information ──
  ['otherInformation',        52,  426,  531,  13],
  ['otherInfo2',              37,  441,  545,  13],
  ['otherInfo3',              37,  456,  545,  13],
  ['otherInfo4',              37,  471,  500,  13],

  // ── ROUTE CONTINUED (below field 18) ──
  // These rows are part of route, handled by the textarea above

  // ── FIELD 19: supplementary ──
  ['enduranceHr',             79,  522,   31,  13],
  ['enduranceMin',           111,  522,   29,  13],
  ['personsOnBoard',         212,  524,   44,  13],

  // ── DINGHIES ──
  ['numDinghies',            81,  613,   29,  13],
  ['dinghiesCapacity',      123,  614,   43,  13],
  ['tireCoverColor',        212,  613,  134,  13],

  // ── BOTTOM FIELDS ──
  ['aircraftColor',           84,  642,  500,  13],
  ['remarks',                 81,  672,  454,  13],
  ['pilotInCommand',          84,  702,  262,  13],

  // ── FOOTER ──
  ['filedBy',                34,  731,  150,  12],
  ['filedByLicNum',          34,  743,  100,  12],
];

// Checkbox definitions: [field, x, y, w, h]
type CheckDef = [F, number, number, number, number];

const CHECKBOXES: CheckDef[] = [
  // Emergency Radio (boxes at Y=523-538)
  ['emergRadioUHF',         420,  523,  15,  15],
  ['emergRadioVHF',         462,  523,  16,  15],
  ['emergRadioELT',         507,  523,  16,  15],

  // Survival Equipment (boxes at Y=568-583)
  ['survival',               80,  568,  16,  15],
  ['survivalPolar',         125,  568,  16,  15],
  ['survivalDesert',        167,  568,  16,  15],
  ['survivalMaritime',      212,  568,  16,  15],
  ['survivalJungle',        254,  568,  16,  15],

  // Jackets (boxes at Y=568-583)
  ['jacket',                 328,  568,  16,  15],
  ['jacketLight',            373,  568,  16,  15],
  ['jacketFluorescent',     418,  568,  16,  15],
  ['jacketUHF',             463,  568,  16,  15],
  ['jacketVHF',             508,  568,  16,  15],

  // Num Neumaticos
  ['numDinghiesBool',        50,  614,  16,  14],
  ['dinghiesCover',         180,  613,  16,  14],
  ['observations',           50,  672,  16,  14],
];

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatDateForPrint(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${parseInt(d,10)}/${MONTHS[parseInt(m,10)-1]}/${y}`;
}

const GRID_FIELDS: Partial<Record<F, number>> = {
  aircraftIdentification: 7,
  flightRules: 1,
  typeOfFlight: 1,
  number: 2,
  typeOfAircraft: 4,
  wakeTurbulenceCategory: 1,
  departureAerodrome: 4,
  time: 4,
  destinationAerodrome: 4,
  eetHr: 2,
  eetMin: 2,
  altnAerodrome: 4,
  secondAltnAerodrome: 4,
  enduranceHr: 2,
  enduranceMin: 2,
  personsOnBoard: 3,
  cruisingSpeed: 5,
  level: 5,
  numDinghies: 2,
  dinghiesCapacity: 3,
};

function formatGridForPrint(value: string, length: number): React.ReactNode {
  const padded = value.padEnd(length);
  return (
    <span className="fp-print-grid">
      {padded.split('').map((ch, i) => (
        <span key={i} className="fp-print-grid-cell">{ch}</span>
      ))}
    </span>
  );
}

function CharGridInput({ value, onChange, length, style }: { value: string; onChange: (val: string) => void; length: number; style?: React.CSSProperties }) {
  const chars = value.split('');
  const refs: { current: HTMLInputElement | null }[] = Array.from({ length }, () => ({ current: null }));

  const handleInput = (index: number, val: string) => {
    const char = val.toUpperCase().slice(-1);
    const newChars = [...chars];
    newChars[index] = char;
    onChange(newChars.join('').slice(0, length));
    if (char && index < length - 1) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !chars[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <div className="fp-char-grid" style={style}>
      {Array.from({ length }, (_, i) => (
        <div key={i} className="fp-char-grid-cell">
          <input
            ref={el => { refs[i].current = el; }}
            type="text"
            maxLength={1}
            value={chars[i] ?? ''}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
          />
        </div>
      ))}
    </div>
  );
}

export default function FlightPlanForm() {
  const [plan, setPlan] = useState<FlightPlan>(createEmptyFlightPlan);
  const [saved, setSaved] = useState<FlightPlan[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeModal, setActiveModal] = useState<TemplateSection | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => { setSaved(loadAllPlans()); }, []);

  useEffect(() => {
    const el = document.querySelector('.fp-page');
    if (el) {
      (el as HTMLElement).style.setProperty('--zoom', String(zoom));
    }
  }, [zoom]);

  useEffect(() => {
    const el = document.querySelector('.fp-page');
    if (!el) return;
    const onWheel = (e: Event) => {
      const wheel = e as WheelEvent;
      if (!wheel.ctrlKey && !wheel.metaKey) return;
      wheel.preventDefault();
      setZoom(z => Math.min(2, Math.max(0.5, z + (wheel.deltaY > 0 ? -0.05 : 0.05))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const wrapper = document.querySelector('.fp-form-wrapper') as HTMLElement | null;
    if (!wrapper) return;
    const onBeforePrint = () => { wrapper.style.transform = 'scale(1.2)'; };
    const onAfterPrint = () => { wrapper.style.transform = ''; };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const handleChange = useCallback((field: F, value: string | boolean) => {
    setPlan(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    savePlan(plan);
    setSaved(loadAllPlans());
    setDirty(false);
  }, [plan]);

  const handleNew = useCallback(() => {
    if (dirty && !window.confirm('Unsaved changes. Discard?')) return;
    setPlan(createEmptyFlightPlan());
    setDirty(false);
  }, [dirty]);

  const handleLoad = useCallback((id: string) => {
    if (dirty && !window.confirm('Unsaved changes. Discard?')) return;
    const p = loadPlan(id);
    if (p) { setPlan(p); setDirty(false); setShowSavedList(false); }
  }, [dirty]);

  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('Delete this flight plan?')) return;
    deletePlan(id);
    setSaved(loadAllPlans());
    if (plan.id === id) { setPlan(createEmptyFlightPlan()); setDirty(false); }
  }, [plan.id]);

  const handleDuplicate = useCallback(() => {
    setPlan({ ...plan, id: crypto.randomUUID(), lastModified: new Date().toISOString() });
    setDirty(true);
  }, [plan]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  const handleTemplateSelect = useCallback((updates: Partial<FlightPlan>) => {
    setPlan(prev => ({ ...prev, ...updates }));
    setDirty(true);
    setActiveModal(null);
  }, []);

  return (
    <>
      <div className={`fp-toolbar screen-only${menuOpen ? ' fp-toolbar--open' : ''}`}>
        <div className="fp-toolbar-header">
          <h1>Flight Plan - Bolivia</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="fp-menu-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button className="fp-menu-toggle" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? '✕' : '☰'}</button>
          </div>
        </div>
        <div className="fp-toolbar-btns">
          <button onClick={handleNew}>+ New</button>
          <button onClick={handleSave} disabled={!dirty}>Save</button>
          <button onClick={handleDuplicate}>Duplicate</button>
          <button onClick={handlePrint}>Print</button>
          <button onClick={() => setShowSavedList(!showSavedList)}>Saved ({saved.length})</button>
          <span className="fp-template-btns">
            <button onClick={() => setActiveModal('aircraft')}>Aircraft</button>
            <button onClick={() => setActiveModal('departure')}>Departure</button>
            <button onClick={() => setActiveModal('route')}>Route</button>
            <button onClick={() => setActiveModal('pilot')}>Pilot</button>
            <button onClick={() => setActiveModal('company')}>Company</button>
            <button onClick={() => setActiveModal('supplementary')}>Supplementary</button>
            <button onClick={() => setActiveModal('filedBy')}>Filed By</button>
          </span>
          <span className="fp-zoom-controls">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
          </span>
        </div>
        {dirty && <span className="fp-dirty">Unsaved changes</span>}
        {showSavedList && (
          <div className="fp-saved-list">
            <h3>Saved Flight Plans</h3>
            {saved.length === 0 && <p>No saved plans.</p>}
            {saved.map(s => (
              <div key={s.id} className="fp-saved-item">
                <span>
                  <strong>{s.aircraftIdentification || '—'}</strong>{' '}
                  {s.departureAerodrome || '?'} → {s.destinationAerodrome || '?'} {formatDateForPrint(s.date)}
                </span>
                <span>
                  <button onClick={() => handleLoad(s.id)}>Load</button>
                  <button onClick={() => handleDelete(s.id)} className="fp-del">Delete</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fp-page">
        <div className="fp-form-wrapper" style={{ transform: `scale(${zoom})` }}>
          <div className="fp-form" id="fp-form">
            <img src={`${import.meta.env.BASE_URL}flight-plan-bg.png`} alt="" className="fp-bg" draggable={false} />

            {/* ── SCREEN: editable input fields ── */}
            {FIELDS.map(([field, x, y, w, h]) => {
              if (field === 'flightRules') {
                return (
                  <div
                    key={field}
                    className="fp-select-wrap"
                    style={{ left: x, top: y, width: w * 2, height: h }}
                  >
                    <select
                      className="fp-overlay-select"
                      value={String(plan[field] ?? 'V')}
                      onChange={e => handleChange(field, e.target.value)}
                    >
                      <option value="V">V</option>
                      <option value="I">I</option>
                      <option value="Y">Y</option>
                      <option value="Z">Z</option>
                    </select>
                  </div>
                );
              }
              if (field === 'typeOfFlight') {
                return (
                  <div
                    key={field}
                    className="fp-select-wrap"
                    style={{ left: x, top: y, width: w * 2, height: h }}
                  >
                    <select
                      className="fp-overlay-select"
                      value={String(plan[field] ?? 'G')}
                      onChange={e => handleChange(field, e.target.value)}
                    >
                      <option value="G">G</option>
                      <option value="S">S</option>
                      <option value="N">N</option>
                      <option value="M">M</option>
                      <option value="X">X</option>
                    </select>
                  </div>
                );
              }
              if (field === 'wakeTurbulenceCategory') {
                return (
                  <div
                    key={field}
                    className="fp-select-wrap"
                    style={{ left: x, top: y, width: w * 2, height: h }}
                  >
                    <select
                      className="fp-overlay-select"
                      value={String(plan[field] ?? 'L')}
                      onChange={e => handleChange(field, e.target.value)}
                    >
                      <option value="J">J</option>
                      <option value="H">H</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                    </select>
                  </div>
                );
              }
              if (field === 'equipment') {
                const raw = String(plan[field] ?? '');
                const [commNav = '', surv = ''] = raw.split('/');
                return (
                  <div
                    key={field}
                    className="fp-equip-wrap"
                    style={{ left: x, top: y, width: w, height: h }}
                  >
                    <select
                      className="fp-overlay-select fp-equip-comm"
                      value={commNav}
                      onChange={e => handleChange(field, `${e.target.value}/${surv}`)}
                    >
                      <option value="N">N</option>
                      <option value="S">S</option>
                      <option value="H">H</option>
                      <option value="U">U</option>
                      <option value="V">V</option>
                      <option value="Y">Y</option>
                      <option value="G">G</option>
                      <option value="D">D</option>
                      <option value="B">B</option>
                      <option value="A">A</option>
                      <option value="F">F</option>
                      <option value="O">O</option>
                      <option value="L">L</option>
                      <option value="I">I</option>
                      <option value="K">K</option>
                      <option value="W">W</option>
                      <option value="X">X</option>
                      <option value="Z">Z</option>
                    </select>
                    <select
                      className="fp-overlay-select fp-equip-surv"
                      value={surv}
                      onChange={e => handleChange(field, `${commNav}/${e.target.value}`)}
                    >
                      <option value="C">C</option>
                      <option value="E">E</option>
                      <option value="H">H</option>
                      <option value="L">L</option>
                      <option value="P">P</option>
                      <option value="S">S</option>
                      <option value="X">X</option>
                    </select>
                  </div>
                );
              }
              const gridLen = GRID_FIELDS[field];
              if (gridLen) {
                return (
                  <CharGridInput
                    key={field}
                    value={String(plan[field] ?? '')}
                    onChange={val => handleChange(field, val)}
                    length={gridLen}
                    style={{ left: x, top: y, width: w, height: h }}
                  />
                );
              }
              return (
                <input
                  key={field}
                  type={field === 'date' ? 'date' : 'text'}
                  lang="en-GB"
                  className={`fp-overlay-input${['filedBy', 'filedByLicNum'].includes(field) ? ' fp-input-sm' : ''}`}
                  style={{ left: x, top: y, width: w, height: h }}
                  value={String(plan[field] ?? '')}
                  onChange={e => handleChange(field, e.target.value.toUpperCase())}
                />
              );
            })}

            {/* ── SCREEN+PRINT: checkboxes ── */}
            {CHECKBOXES.map(([field, x, y, w, h]) => (
              <label
                key={field}
                className="fp-overlay-check"
                style={{ left: x, top: y, width: w, height: h }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(plan[field])}
                  onChange={e => handleChange(field, e.target.checked)}
                />
                <span className="fp-check-x">X</span>
              </label>
            ))}

            {/* ── PRINT ONLY: mirrored text layer (input values as divs) ── */}
            {FIELDS.map(([field, x, y, w, h]) => {
              const raw = String(plan[field] ?? '');
              const gridLen = GRID_FIELDS[field];
              let content: React.ReactNode = raw;
              if (field === 'date') {
                content = formatDateForPrint(raw);
              } else if (gridLen) {
                content = formatGridForPrint(raw, gridLen);
              }
              if (!raw) return null;
              return (
                <div
                  key={`print-${field}`}
                  className="fp-print-value"
                  style={{ left: x, top: y, width: w, height: h, ...(field === 'equipment' ? { justifyContent: 'flex-end', wordSpacing: '1ch' } : {}) }}
                >
                  {field === 'equipment'
                    ? raw.replace('/', ' ')
                    : content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {activeModal && (
        <TemplateModal
          section={activeModal}
          onClose={() => setActiveModal(null)}
          onSelect={handleTemplateSelect}
          currentPlan={plan}
        />
      )}
    </>
  );
}
