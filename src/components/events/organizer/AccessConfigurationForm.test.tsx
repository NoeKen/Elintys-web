import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  AccessConfigurationForm,
  parseDomains,
  toAccessConfigurationPayload,
  type AccessConfigurationFormValues,
} from './AccessConfigurationForm';

function values(overrides: Partial<AccessConfigurationFormValues> = {}): AccessConfigurationFormValues {
  return {
    discoverability: 'public',
    policyType: 'open',
    requiresAuthentication: false,
    accessCode: '',
    hasExistingCode: false,
    allowedDomains: '',
    admissionModes: ['registration_only'],
    ...overrides,
  };
}

describe('parseDomains', () => {
  it('devrait normaliser, dédupliquer et retirer le @ initial', () => {
    expect(parseDomains(' @Entreprise.CA, universite.qc.ca ; entreprise.ca ')).toEqual([
      'entreprise.ca',
      'universite.qc.ca',
    ]);
  });

  it('devrait retourner un tableau vide pour une saisie vide', () => {
    expect(parseDomains('   ,  ; ')).toEqual([]);
  });
});

describe('toAccessConfigurationPayload', () => {
  it('devrait omettre requiresAuthentication pour une politique qui ne le supporte pas', () => {
    const payload = toAccessConfigurationPayload(values({ policyType: 'open', requiresAuthentication: true }));
    expect(payload.accessPolicy).toEqual({ type: 'open' });
  });

  it('devrait conserver requiresAuthentication pour une politique qui le supporte', () => {
    const payload = toAccessConfigurationPayload(
      values({ policyType: 'manual_approval', requiresAuthentication: true }),
    );
    expect(payload.accessPolicy).toEqual({ type: 'manual_approval', requiresAuthentication: true });
  });

  it('devrait omettre le code quand aucun nouveau code n’est saisi, pour conserver le hash serveur', () => {
    const payload = toAccessConfigurationPayload(
      values({ policyType: 'access_code', hasExistingCode: true, accessCode: '   ' }),
    );
    expect(payload.accessPolicy).toEqual({ type: 'access_code' });
  });

  it('devrait envoyer le code saisi en clair pour hachage côté serveur', () => {
    const payload = toAccessConfigurationPayload(
      values({ policyType: 'access_code', accessCode: ' secret42 ' }),
    );
    expect(payload.accessPolicy).toEqual({ type: 'access_code', code: 'secret42' });
  });

  it('devrait normaliser les domaines autorisés', () => {
    const payload = toAccessConfigurationPayload(
      values({ policyType: 'email_domain', allowedDomains: '@Elintys.ca, partenaire.qc.ca' }),
    );
    expect(payload.accessPolicy).toEqual({
      type: 'email_domain',
      allowedDomains: ['elintys.ca', 'partenaire.qc.ca'],
      requiresAuthentication: false,
    });
  });

  it('devrait transmettre la découvrabilité et les modes d’admission tels quels', () => {
    const payload = toAccessConfigurationPayload(
      values({
        discoverability: 'private',
        policyType: 'invitation_token',
        admissionModes: ['invitation', 'free'],
      }),
    );
    expect(payload).toEqual({
      discoverability: 'private',
      accessPolicy: { type: 'invitation_token' },
      admissionModes: ['invitation', 'free'],
    });
  });
});

describe('AccessConfigurationForm', () => {
  it('associe l’erreur au champ et bloque un nouveau code trop court', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AccessConfigurationForm
        discoverability="public"
        accessPolicy={{ type: 'open' }}
        admissionModes={['registration_only']}
        isSaving={false}
        isSaved={false}
        saveError={null}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Code d’accès' }));
    const codeInput = screen.getByRole('textbox', { name: 'Code d’accès' });
    await user.type(codeInput, 'court');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const error = await screen.findByText('Un code d’accès d’au moins 6 caractères est requis.');
    expect(codeInput).toHaveAttribute('aria-describedby', error.id);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
