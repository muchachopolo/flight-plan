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
