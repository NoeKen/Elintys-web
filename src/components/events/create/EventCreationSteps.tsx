// Baril de ré-export : `EventCreationSteps.tsx` était un fichier monolithique de
// 1513 lignes. Les six étapes et leurs sous-composants ont été déplacés tels
// quels dans `steps/` et `components/` (décomposition mécanique, comportement
// inchangé). Ce baril préserve les imports existants.
export { InformationStep } from './steps/InformationStep';
export { ScheduleStep } from './steps/ScheduleStep';
export { VenueStep } from './steps/VenueStep';
export { ProvidersStep } from './steps/ProvidersStep';
export { IdentityAccessStep } from './steps/IdentityAccessStep';
export { ReviewStep } from './steps/ReviewStep';
export type {
  ManualProviderMap,
  SelectedVendorMap,
} from './components/step-types';
