import type { Step1Data } from "@/features/auth/components/RegisterStep1Form";

const REGISTRATION_DRAFT_KEY = "elintys.registration.step1";

export function saveRegistrationDraft(data: Step1Data): void {
  sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(data));
}

export function readRegistrationDraft(): Step1Data | null {
  const rawDraft = sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
  if (!rawDraft) return null;

  try {
    const draft = JSON.parse(rawDraft) as Partial<Step1Data>;
    if (!draft.email || !draft.password) return null;
    return { email: draft.email, password: draft.password };
  } catch {
    return null;
  }
}

export function clearRegistrationDraft(): void {
  sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
}
