import { useCallback, useEffect, useState } from 'react';
import type { FlightPlan } from './types';
import { createEmptyFlightPlan } from './types';
import { savePlan, loadAllPlans, deletePlan, loadPlan, exportAllData, importAllData } from './storage';
import type { TemplateSection } from './templateTypes';
import TemplateModal from './TemplateModal';
import { useTheme } from './ThemeContext';
import jsPDF from 'jspdf';
import './FlightPlanForm.css';

type F = keyof FlightPlan;

// Per-field render behavior. `kind` drives how the value is drawn in all
// three modes (screen inputs, print mirror layer, PDF text).
//   text   — free text; `date` swaps in a date picker + formatted output,
//            `small` uses the 7pt variant.
//   grid   — one boxed character per cell, `length` cells.
//   select — dropdown of `options`, `default` when empty.
//   split  — two dropdowns around a "/" pre-printed in the template at
//            `slashOffset` points from the field's left edge.
type Render =
  | { kind: 'text'; date?: boolean; small?: boolean }
  | { kind: 'grid'; length: number }
  | { kind: 'select'; options: readonly string[]; default: string }
  | {
      kind: 'split';
      sep: string;
      slashOffset: number;
      options: readonly string[];
      default: string;
      options2: readonly string[];
      default2: string;
    };

// [field, x, y, w, h] — all in PDF points (612x792 page). The same numbers
// double as CSS px over the on-screen background image (1pt maps to 1px).
interface FieldDef {
  field: F;
  x: number;
  y: number;
  w: number;
  h: number;
  render: Render;
}

// How far the second value sits from the pre-printed "/" separator, shared
// by the print layer and the PDF so they can never drift apart.
const SPLIT_LEFT_GAP = 3;  // first value's right edge, this far left of the slash
const SPLIT_RIGHT_GAP = 4; // second value's left edge, this far right of the slash

// Downward optical seat (points/px) so values rest toward the bottom cell line
// instead of dead-center — the classic hand-filled look. Shared by print + PDF.
const SEAT = 1.5;

const EQUIP_COMM_OPTS = ['N','S','H','U','V','Y','G','D','B','A','F','O','L','I','K','W','X','Z'] as const;
const EQUIP_SURV_OPTS = ['C','E','H','L','P','S','X'] as const;

// Exact positions from PDF rectangle extraction
const FIELDS: readonly FieldDef[] = [
  // ── HEADER ──
  { field: 'date', x: 426, y: 45, w: 120, h: 13, render: { kind: 'text', date: true } },

  // ── ROW: aircraft id / flight rules / type ──
  { field: 'aircraftIdentification', x: 181, y: 201, w: 105, h: 14, render: { kind: 'grid', length: 7 } },
  { field: 'flightRules', x: 384, y: 200, w: 16, h: 15, render: { kind: 'select', options: ['V','I','Y','Z'], default: 'V' } },
  { field: 'typeOfFlight', x: 504, y: 200, w: 16, h: 15, render: { kind: 'select', options: ['G','S','N','M','X'], default: 'G' } },

  // ── ROW: number / type / wake / equipment ──
  { field: 'number', x: 50, y: 231, w: 29, h: 13, render: { kind: 'grid', length: 2 } },
  { field: 'typeOfAircraft', x: 152, y: 231, w: 59, h: 13, render: { kind: 'grid', length: 4 } },
  { field: 'wakeTurbulenceCategory', x: 324, y: 230, w: 16, h: 15, render: { kind: 'select', options: ['J','H','M','L'], default: 'L' } },
  { field: 'equipment', x: 440, y: 230, w: 78, h: 13, render: { kind: 'split', sep: '/', slashOffset: 62, options: EQUIP_COMM_OPTS, default: '', options2: EQUIP_SURV_OPTS, default2: '' } },

  // ── ROW: departure / time ──
  { field: 'departureAerodrome', x: 92, y: 261, w: 59, h: 13, render: { kind: 'grid', length: 4 } },
  { field: 'time', x: 225, y: 261, w: 65, h: 13, render: { kind: 'grid', length: 4 } },

  // ── ROW: speed / level / route ──
  { field: 'cruisingSpeed', x: 50, y: 291, w: 71, h: 13, render: { kind: 'grid', length: 5 } },
  { field: 'level', x: 137, y: 291, w: 75, h: 13, render: { kind: 'grid', length: 5 } },
  { field: 'route', x: 226, y: 291, w: 357, h: 13, render: { kind: 'text' } },
  { field: 'route2', x: 37, y: 305, w: 545, h: 14, render: { kind: 'text' } },
  { field: 'route3', x: 37, y: 320, w: 545, h: 14, render: { kind: 'text' } },
  { field: 'route4', x: 37, y: 335, w: 545, h: 14, render: { kind: 'text' } },
  { field: 'route5', x: 37, y: 350, w: 500, h: 14, render: { kind: 'text' } },

  // ── ROW: destination / eet / altn / 2nd altn ──
  { field: 'destinationAerodrome', x: 92, y: 396, w: 59, h: 13, render: { kind: 'grid', length: 4 } },
  { field: 'eetHr', x: 226, y: 396, w: 30, h: 13, render: { kind: 'grid', length: 2 } },
  { field: 'eetMin', x: 257, y: 396, w: 29, h: 13, render: { kind: 'grid', length: 2 } },
  { field: 'altnAerodrome', x: 343, y: 396, w: 59, h: 13, render: { kind: 'grid', length: 4 } },
  { field: 'secondAltnAerodrome', x: 460, y: 396, w: 59, h: 13, render: { kind: 'grid', length: 4 } },

  // ── FIELD 18: other information ──
  { field: 'otherInformation', x: 52, y: 426, w: 531, h: 13, render: { kind: 'text' } },
  { field: 'otherInfo2', x: 37, y: 441, w: 545, h: 13, render: { kind: 'text' } },
  { field: 'otherInfo3', x: 37, y: 456, w: 545, h: 13, render: { kind: 'text' } },
  { field: 'otherInfo4', x: 37, y: 471, w: 500, h: 13, render: { kind: 'text' } },

  // ── FIELD 19: supplementary ──
  { field: 'enduranceHr', x: 79, y: 522, w: 31, h: 13, render: { kind: 'grid', length: 2 } },
  { field: 'enduranceMin', x: 111, y: 522, w: 29, h: 13, render: { kind: 'grid', length: 2 } },
  { field: 'personsOnBoard', x: 212, y: 524, w: 44, h: 13, render: { kind: 'grid', length: 3 } },

  // ── DINGHIES ──
  { field: 'numDinghies', x: 81, y: 613, w: 29, h: 13, render: { kind: 'grid', length: 2 } },
  { field: 'dinghiesCapacity', x: 123, y: 614, w: 43, h: 13, render: { kind: 'grid', length: 3 } },
  { field: 'tireCoverColor', x: 212, y: 613, w: 134, h: 13, render: { kind: 'text' } },

  // ── BOTTOM FIELDS ──
  { field: 'aircraftColor', x: 84, y: 642, w: 500, h: 13, render: { kind: 'text' } },
  { field: 'remarks', x: 81, y: 672, w: 454, h: 13, render: { kind: 'text' } },
  { field: 'pilotInCommand', x: 84, y: 702, w: 262, h: 13, render: { kind: 'text' } },

  // ── FOOTER ──
  { field: 'filedBy', x: 34, y: 731, w: 150, h: 12, render: { kind: 'text', small: true } },
  { field: 'filedByLicNum', x: 34, y: 743, w: 100, h: 12, render: { kind: 'text', small: true } },
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

// One padded character per grid cell — shared by the print layer and PDF.
function gridChars(value: string, length: number): string[] {
  return value.padEnd(length).split('');
}

// The plain string a text/select field renders in print and PDF (dates get
// reformatted; everything else is passed through).
function displayValue(render: Render, raw: string): string {
  if (render.kind === 'text' && render.date && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return formatDateForPrint(raw);
  }
  return raw;
}

function formatGridForPrint(value: string, length: number): React.ReactNode {
  return (
    <span className="fp-print-grid">
      {gridChars(value, length).map((ch, i) => (
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

  const handleSavePdf = useCallback(async () => {
    const bgImg = document.querySelector<HTMLImageElement>('.fp-bg');
    if (!bgImg) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = bgImg.src;
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    pdf.addImage(img, 'PNG', 0, 0, 612, 792);
    pdf.setFontSize(11);
    FIELDS.forEach(({ field, x, y, w, h, render }) => {
      const raw = String(plan[field] ?? '');
      if (!raw) return;
      // box center plus the shared downward seat — matches the print layer
      const midY = y + h / 2 + SEAT;
      if (render.kind === 'grid') {
        const cw = w / render.length;
        gridChars(raw, render.length).forEach((ch, i) => {
          pdf.text(ch, x + cw * i + cw / 2, midY, { align: 'center', baseline: 'middle' });
        });
      } else if (render.kind === 'split') {
        const [comm = '', surv = ''] = raw.split(render.sep);
        const slashX = x + render.slashOffset;
        if (comm) pdf.text(comm, slashX - SPLIT_LEFT_GAP, midY, { align: 'right', baseline: 'middle' });
        if (surv) pdf.text(surv, slashX + SPLIT_RIGHT_GAP, midY, { align: 'left', baseline: 'middle' });
      } else if (render.kind === 'select') {
        pdf.text(raw, x + w / 2, midY, { align: 'center', baseline: 'middle' });
      } else {
        pdf.text(displayValue(render, raw), x + 1, midY, { align: 'left', baseline: 'middle' });
      }
    });
    CHECKBOXES.filter(([k]) => plan[k]).forEach(([, x, y, cw, ch]) => {
      pdf.setFontSize(13);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('X', x + cw / 2, y + ch / 2 + 1, { align: 'center', baseline: 'middle' });
      pdf.setFontSize(8);
      pdf.setFont('Helvetica', 'normal');
    });
    const c = document.getElementById('fp-form');
    c?.querySelectorAll('.fp-overlay-input, .fp-overlay-select, .fp-select-wrap, .fp-equip-wrap, .fp-char-grid').forEach(e => (e as HTMLElement).style.setProperty('display', 'none', 'important'));
    c?.querySelectorAll('.fp-print-value').forEach(e => { const ev = e as HTMLElement; ev.style.setProperty('display', 'flex', 'important'); ev.style.setProperty('align-items', 'center', 'important'); });
    c?.querySelectorAll('.fp-print-grid').forEach(e => (e as HTMLElement).style.setProperty('display', 'flex', 'important'));
    c?.querySelectorAll('.fp-check-x').forEach(e => (e as HTMLElement).style.setProperty('opacity', '0', 'important'));
    const name = (plan.aircraftIdentification || 'flight-plan').replace(/\s+/g, '_');
    pdf.save(`${name}.pdf`);
    c?.querySelectorAll('.fp-overlay-input, .fp-overlay-select, .fp-select-wrap, .fp-equip-wrap, .fp-char-grid').forEach(e => (e as HTMLElement).style.removeProperty('display'));
    c?.querySelectorAll('.fp-print-value').forEach(e => { const ev = e as HTMLElement; ev.style.removeProperty('display'); ev.style.removeProperty('align-items'); });
    c?.querySelectorAll('.fp-print-grid').forEach(e => (e as HTMLElement).style.removeProperty('display'));
    c?.querySelectorAll('.fp-check-x').forEach(e => (e as HTMLElement).style.removeProperty('opacity'));
  }, [plan]);

  const handleExport = useCallback(() => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-plan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = importAllData(reader.result as string);
          setSaved(loadAllPlans());
          alert(`Imported ${result.plans} flight plans${result.templates ? ' and templates' : ''}.`);
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

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
          <button onClick={handleSavePdf}>Save PDF</button>
          <button onClick={handleExport}>Export</button>
          <button onClick={handleImport}>Import</button>
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
        <div className="fp-form-wrapper" style={{ zoom: zoom }}>
          <div className="fp-form" id="fp-form">
            <img src={`${import.meta.env.BASE_URL}flight-plan-bg.png`} alt="" className="fp-bg" draggable={false} />

            {/* ── SCREEN: editable input fields ── */}
            {FIELDS.map(({ field, x, y, w, h, render }) => {
              if (render.kind === 'select') {
                return (
                  <div
                    key={field}
                    className="fp-select-wrap"
                    style={{ left: x, top: y, width: w * 2, height: h }}
                  >
                    <select
                      className="fp-overlay-select"
                      value={String(plan[field] ?? render.default)}
                      onChange={e => handleChange(field, e.target.value)}
                    >
                      {render.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                );
              }
              if (render.kind === 'split') {
                const [comm = render.default, surv = render.default2] = String(plan[field] ?? '').split(render.sep);
                return (
                  <div
                    key={field}
                    className="fp-equip-wrap"
                    style={{ left: x, top: y, width: w, height: h }}
                  >
                    <select
                      className="fp-overlay-select fp-equip-comm"
                      value={comm}
                      onChange={e => handleChange(field, `${e.target.value}${render.sep}${surv}`)}
                    >
                      {render.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select
                      className="fp-overlay-select fp-equip-surv"
                      value={surv}
                      onChange={e => handleChange(field, `${comm}${render.sep}${e.target.value}`)}
                    >
                      {render.options2.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                );
              }
              if (render.kind === 'grid') {
                return (
                  <CharGridInput
                    key={field}
                    value={String(plan[field] ?? '')}
                    onChange={val => handleChange(field, val)}
                    length={render.length}
                    style={{ left: x, top: y, width: w, height: h }}
                  />
                );
              }
              return (
                <input
                  key={field}
                  type={render.date ? 'date' : 'text'}
                  lang="en-GB"
                  className={`fp-overlay-input${render.small ? ' fp-input-sm' : ''}`}
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
            {FIELDS.map(({ field, x, y, w, h, render }) => {
              const raw = String(plan[field] ?? '');
              if (!raw) return null;
              let content: React.ReactNode;
              if (render.kind === 'grid') {
                content = formatGridForPrint(raw, render.length);
              } else if (render.kind === 'split') {
                const [comm, surv] = raw.split(render.sep);
                content = (
                  <span style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {comm && <span style={{ position: 'absolute', right: w - (render.slashOffset - SPLIT_LEFT_GAP), top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>{comm}</span>}
                    {surv && <span style={{ position: 'absolute', left: render.slashOffset + SPLIT_RIGHT_GAP, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>{surv}</span>}
                  </span>
                );
              } else {
                content = displayValue(render, raw);
              }
              return (
                <div
                  key={`print-${field}`}
                  className="fp-print-value"
                  style={{ left: x, top: y, width: w, height: h, transform: `translateY(${SEAT}px)`, ...(render.kind === 'select' ? { justifyContent: 'center' } : {}) }}
                >
                  {content}
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
