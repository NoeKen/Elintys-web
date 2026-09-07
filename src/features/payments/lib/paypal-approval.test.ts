import { describe, expect, it } from 'vitest';
import {
  isPayPalEnvironment,
  isTrustedApprovalUrl,
  resolvePayPalEnvironment,
} from './paypal-approval';

describe('resolvePayPalEnvironment', () => {
  it.each([
    ['sandbox', 'sandbox'],
    ['live', 'live'],
    ['LIVE', 'live'],
    [' sandbox ', 'sandbox'],
  ])('devrait normaliser %p en %p', (raw, expected) => {
    expect(resolvePayPalEnvironment(raw)).toBe(expected);
  });

  it.each([undefined, ''])(
    'devrait utiliser sandbox par défaut pour %p',
    (raw) => {
      // Le défaut penche vers l'environnement inoffensif : une variable
      // oubliée fait échouer une redirection Live, jamais l'inverse.
      expect(resolvePayPalEnvironment(raw)).toBe('sandbox');
    },
  );

  it.each(['staging', 'production', 'prod'])('devrait refuser l’environnement invalide %p', (raw) => {
    expect(() => resolvePayPalEnvironment(raw)).toThrow('NEXT_PUBLIC_PAYPAL_ENV');
  });

  it('devrait exposer un garde de type', () => {
    expect(isPayPalEnvironment('live')).toBe(true);
    expect(isPayPalEnvironment('staging')).toBe(false);
  });
});

describe('isTrustedApprovalUrl — protection contre la redirection ouverte', () => {
  it('devrait accepter l’hôte Sandbox en configuration sandbox', () => {
    expect(
      isTrustedApprovalUrl('https://www.sandbox.paypal.com/checkoutnow?token=5O1', 'sandbox'),
    ).toBe(true);
  });

  it('devrait accepter l’hôte Live en configuration live', () => {
    // Régression F-06 : l'ancienne garde n'acceptait QUE sandbox.paypal.com.
    // En production, la commande était créée et le stock réservé, puis la
    // redirection rejetée — l'acheteur restait bloqué.
    expect(isTrustedApprovalUrl('https://www.paypal.com/checkoutnow?token=5O1', 'live')).toBe(true);
    expect(isTrustedApprovalUrl('https://paypal.com/checkoutnow', 'live')).toBe(true);
  });

  it('devrait cloisonner les deux environnements', () => {
    expect(isTrustedApprovalUrl('https://www.paypal.com/checkoutnow', 'sandbox')).toBe(false);
    expect(isTrustedApprovalUrl('https://www.sandbox.paypal.com/checkoutnow', 'live')).toBe(false);
  });

  it.each([
    ['http', 'http://www.paypal.com/checkoutnow'],
    ['javascript', 'javascript:alert(1)'],
    ['data', 'data:text/html,<script>alert(1)</script>'],
    ['relatif protocole', '//evil.example'],
    ['vide', ''],
    ['url invalide', 'pas-une-url'],
  ])('devrait refuser un schéma %s', (_name, url) => {
    expect(isTrustedApprovalUrl(url, 'live')).toBe(false);
  });

  it.each([
    'https://paypal.com.evil.example/checkoutnow',
    'https://www.sandbox.paypal.com.attacker.tld/checkoutnow',
    'https://notpaypal.com/checkoutnow',
    'https://fakepaypal.com/checkoutnow',
    'https://evil.example/checkoutnow',
    'https://evil.paypal.com.attacker.tld/checkoutnow',
  ])('devrait refuser le domaine sosie %p', (url) => {
    expect(isTrustedApprovalUrl(url, 'live')).toBe(false);
    expect(isTrustedApprovalUrl(url, 'sandbox')).toBe(false);
  });

  it('devrait refuser un sous-domaine PayPal non listé', () => {
    expect(isTrustedApprovalUrl('https://evil.paypal.com/checkoutnow', 'live')).toBe(false);
  });

  it('devrait ignorer la casse et le point final absolu', () => {
    expect(isTrustedApprovalUrl('https://WWW.PayPal.COM./checkoutnow', 'live')).toBe(true);
  });
});
