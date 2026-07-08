export type WaitlistRole = 'organisateur' | 'prestataire' | 'gestionnaire' | 'visiteur';
export type WaitlistSource = 'hero' | 'cta';

export interface JoinWaitlistInput {
  firstName: string;
  email: string;
  role: WaitlistRole;
  source: WaitlistSource;
  consentMarketing: boolean;
}

export interface JoinWaitlistResult {
  success: boolean;
  alreadyExists: boolean;
}
