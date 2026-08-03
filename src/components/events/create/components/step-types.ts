import type {
  ManualProviderDraft,
  ProviderCategory,
} from '@/features/events/lib/event-creation';

export type ManualProviderMap = Partial<
  Record<ProviderCategory, ManualProviderDraft>
>;
export type SelectedVendorMap = Partial<Record<ProviderCategory, string>>;
