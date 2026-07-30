import frMessages from '../../../../messages/fr.json';

export const eventCreationCopy = frMessages.eventCreation;

export function formatEventCreationCopy(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
