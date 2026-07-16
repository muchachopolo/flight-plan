import type { FlightPlan } from './types';

const STORAGE_KEY = 'bolivia-flight-plans';

export function loadAllPlans(): FlightPlan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePlan(plan: FlightPlan): void {
  const plans = loadAllPlans();
  plan.lastModified = new Date().toISOString();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function deletePlan(id: string): void {
  const plans = loadAllPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function loadPlan(id: string): FlightPlan | null {
  return loadAllPlans().find((p) => p.id === id) ?? null;
}

const ALL_KEYS = ['bolivia-flight-plans', 'flight-plan-templates', 'flight-plan-theme'];

export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  for (const key of ALL_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = JSON.parse(val);
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): { plans: number; templates: boolean } {
  const data: Record<string, unknown> = JSON.parse(json);
  let plans = 0;
  let templates = false;
  if (data['bolivia-flight-plans']) {
    const arr = data['bolivia-flight-plans'] as unknown[];
    plans = arr.length;
    localStorage.setItem('bolivia-flight-plans', JSON.stringify(arr));
  }
  if (data['flight-plan-templates']) {
    templates = true;
    localStorage.setItem('flight-plan-templates', JSON.stringify(data['flight-plan-templates']));
  }
  if (data['flight-plan-theme']) {
    localStorage.setItem('flight-plan-theme', JSON.stringify(data['flight-plan-theme']));
  }
  return { plans, templates };
}
