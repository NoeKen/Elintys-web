import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, { ApiClientError, apiErrorFromResponse, isEmailNotVerifiedError } from './api';
import {
  EMAIL_NOT_VERIFIED_CODE,
  isEmailNotVerifiedPayload,
  notifyEmailNotVerified,
  onEmailNotVerified,
} from './email-verification-signal';
import { getUserFacingError } from './user-facing-error';
import messages from '../../../messages/fr.json';

const refusal = {
  statusCode: 403,
  message: 'Vérifiez votre adresse courriel.',
  code: EMAIL_NOT_VERIFIED_CODE,
  requestId: 'req-1',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('isEmailNotVerifiedPayload', () => {
  it('devrait reconnaître uniquement un 403 portant le code EMAIL_NOT_VERIFIED', () => {
    expect(isEmailNotVerifiedPayload(403, refusal)).toBe(true);
    expect(isEmailNotVerifiedPayload(403, { code: 'EVENT_NOT_OWNER' })).toBe(false);
    expect(isEmailNotVerifiedPayload(401, refusal)).toBe(false);
    expect(isEmailNotVerifiedPayload(403, 'EMAIL_NOT_VERIFIED')).toBe(false);
    expect(isEmailNotVerifiedPayload(403, undefined)).toBe(false);
  });
});

describe('onEmailNotVerified', () => {
  it('devrait notifier chaque abonné et permettre le désabonnement', () => {
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = onEmailNotVerified(first);
    const offSecond = onEmailNotVerified(second);

    notifyEmailNotVerified();
    offFirst();
    notifyEmailNotVerified();
    offSecond();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('devrait isoler un abonné défaillant', () => {
    const healthy = vi.fn();
    const offBroken = onEmailNotVerified(() => {
      throw new Error('boom');
    });
    const offHealthy = onEmailNotVerified(healthy);

    expect(() => notifyEmailNotVerified()).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);
    offBroken();
    offHealthy();
  });
});

describe('client API — refus EMAIL_NOT_VERIFIED', () => {
  const listener = vi.fn();
  let off: () => void;

  beforeEach(() => {
    listener.mockReset();
    off = onEmailNotVerified(listener);
  });

  afterEach(() => {
    off();
    vi.unstubAllGlobals();
  });

  it('devrait émettre le signal global et lever une ApiClientError reconnaissable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(403, refusal)));

    const error = await api.post('/events', { title: 'Soirée' }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(isEmailNotVerifiedError(error)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ne devrait pas émettre le signal pour un autre refus 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(403, { statusCode: 403, code: 'EVENT_NOT_OWNER' })),
    );

    const error = await api.patch('/events/1', {}).catch((caught: unknown) => caught);

    expect(isEmailNotVerifiedError(error)).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('devrait émettre le signal pour les réponses construites hors client (apiErrorFromResponse)', async () => {
    const error = await apiErrorFromResponse(jsonResponse(403, refusal));

    expect(isEmailNotVerifiedError(error)).toBe(true);
    expect(error.requestId).toBe('req-1');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ne devrait jamais considérer une erreur non HTTP comme un refus de vérification', () => {
    expect(isEmailNotVerifiedError(new Error('network'))).toBe(false);
    expect(isEmailNotVerifiedError(refusal)).toBe(false);
  });
});

describe('getUserFacingError — EMAIL_NOT_VERIFIED', () => {
  it('devrait expliquer la vérification requise plutôt qu’un manque de droits', () => {
    const result = getUserFacingError(new ApiClientError(403, refusal, 'req-9'));

    expect(result).toEqual({
      message: messages.emailVerification.actionBlocked,
      details: [],
      requestId: 'req-9',
    });
  });

  it('devrait conserver le message 403 générique pour les autres refus', () => {
    const result = getUserFacingError(new ApiClientError(403, { code: 'EVENT_NOT_OWNER' }));

    expect(result.message).toBe(
      'Vous n’avez pas l’autorisation nécessaire pour effectuer cette action.',
    );
  });
});
