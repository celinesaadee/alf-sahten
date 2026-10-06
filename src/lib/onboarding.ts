export const ONBOARDING_KEY = "alf-sahten-welcome-v1";
export type CookingGoal = "pantry" | "quick" | "explore" | "save";
const goals: CookingGoal[] = ["pantry", "quick", "explore", "save"];

export function hasFinishedWelcome(storage: Pick<Storage, "getItem">): boolean {
  try {
    const value = JSON.parse(storage.getItem(ONBOARDING_KEY) ?? "null");
    return value?.version === 1 && value?.completed === true;
  } catch { return false; }
}

export function finishWelcome(storage: Pick<Storage, "setItem">, goal: CookingGoal | null): void {
  try {
    storage.setItem(ONBOARDING_KEY, JSON.stringify({ version: 1, completed: true, goal: goal && goals.includes(goal) ? goal : null }));
  } catch { /* The current visit can still continue when browser storage is unavailable. */ }
}

export function welcomeDestination(goal: CookingGoal | null): string {
  return goal === "pantry" ? "/kitchen" : goal === "save" ? "/saved" : "/discover";
}
