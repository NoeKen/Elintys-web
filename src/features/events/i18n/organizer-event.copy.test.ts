import { describe, expect, it } from 'vitest';
import { organizerCopy, organizerEventCopyByLocale } from './organizer-event.copy';

describe('organizer event copy', () => {
  it('maintient la parité structurelle FR et EN', () => {
    expect(Object.keys(organizerEventCopyByLocale.fr)).toEqual(Object.keys(organizerEventCopyByLocale.en));
    for (const section of Object.keys(organizerEventCopyByLocale.fr) as Array<keyof typeof organizerEventCopyByLocale.fr>) {
      expect(Object.keys(organizerEventCopyByLocale.fr[section])).toEqual(Object.keys(organizerEventCopyByLocale.en[section]));
    }
  });

  it('remplace toutes les valeurs nommées', () => {
    expect(organizerCopy('{from}–{to} / {total}', { from: 1, to: 6, total: 12 })).toBe('1–6 / 12');
  });
});
