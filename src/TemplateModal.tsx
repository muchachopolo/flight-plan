import { useState } from 'react';
import { Link } from 'react-router-dom';
import { loadTemplates } from './templateStorage';
import type { AircraftTemplate, RouteTemplate, PilotTemplate, CompanyTemplate, SupplementaryTemplate, FiledByTemplate, DepartureTemplate, TemplateSection } from './templateTypes';
import type { FlightPlan } from './types';
import { applyAircraftTemplate, applyRouteTemplate, applySupplementaryTemplate, applyFiledByTemplate, applyDepartureTemplate, buildOtherInformation, buildOtherInfo2, buildOtherInfo3, buildPilotInCommand } from './templateStorage';
import './TemplateModal.css';

interface TemplateModalProps {
  section: TemplateSection;
  onClose: () => void;
  onSelect: (updates: Partial<FlightPlan>) => void;
  currentPlan: FlightPlan;
}

export default function TemplateModal({ section, onClose, onSelect, currentPlan }: TemplateModalProps) {
  const templates = loadTemplates(section);
  const [selectedPilot1, setSelectedPilot1] = useState<PilotTemplate | null>(null);

  const handleSelect = (template: AircraftTemplate | RouteTemplate | PilotTemplate | CompanyTemplate | SupplementaryTemplate | FiledByTemplate | DepartureTemplate) => {
    let updates: Partial<FlightPlan> = {};

    if (section === 'aircraft') {
      updates = applyAircraftTemplate(currentPlan, template as AircraftTemplate);
    } else if (section === 'departure') {
      updates = applyDepartureTemplate(template as DepartureTemplate);
    } else if (section === 'route') {
      const r = template as RouteTemplate;
      updates = applyRouteTemplate(currentPlan, r);
      const companyMatch = currentPlan.otherInformation?.match(/OPR\/(\S+)/);
      const companyName = companyMatch?.[1] ?? '';
      updates.otherInformation = buildOtherInformation(
        companyName ? { id: '', name: '', companyName } : null,
        r.remarks
      );
    } else if (section === 'pilot') {
      const p = template as PilotTemplate;
      if (!selectedPilot1) {
        setSelectedPilot1(p);
        return;
      }
      updates = {
        pilotInCommand: buildPilotInCommand(selectedPilot1),
        otherInfo2: buildOtherInfo2(selectedPilot1),
        otherInfo3: buildOtherInfo3(p),
      };
      setSelectedPilot1(null);
    } else if (section === 'company') {
      const c = template as CompanyTemplate;
      const remarkMatch = currentPlan.otherInformation?.match(/RMK\/(.+)/);
      const remarks = remarkMatch?.[1] ?? '';
      updates = {
        otherInformation: buildOtherInformation(c, remarks),
      };
    } else if (section === 'supplementary') {
      updates = applySupplementaryTemplate(template as SupplementaryTemplate);
    } else if (section === 'filedBy') {
      updates = applyFiledByTemplate(template as FiledByTemplate);
    }

    onSelect(updates);
  };

  return (
    <div className="tm-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={e => e.stopPropagation()}>
        <div className="tm-modal-header">
          <h2>Load {section.charAt(0).toUpperCase() + section.slice(1)} Template</h2>
          <button className="tm-close" onClick={onClose}>&times;</button>
        </div>
        <div className="tm-modal-body">
          {section === 'pilot' && selectedPilot1 && (
            <div className="tm-pilot-step">
              <span>PIC: {selectedPilot1.name}</span>
              <span>Now select co-pilot for otherInfo3</span>
            </div>
          )}
          {templates.length === 0 ? (
            <p className="tm-empty">No templates. <Link to={`/templates/${section}`} onClick={onClose}>Create one</Link></p>
          ) : (
            templates.map(t => (
              <button key={t.id} className="tm-modal-item" onClick={() => handleSelect(t)}>
                {t.name || '(unnamed)'}
              </button>
            ))
          )}
        </div>
        <div className="tm-modal-footer">
          <Link to={`/templates/${section}`} className="tm-manage-link" onClick={onClose}>Manage Templates</Link>
        </div>
      </div>
    </div>
  );
}
