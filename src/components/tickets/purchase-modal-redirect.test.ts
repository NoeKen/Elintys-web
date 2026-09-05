import { describe, expect, it } from 'vitest';
import { isTrustedApprovalUrl } from './PurchaseModal';

describe('isTrustedApprovalUrl — protection contre la redirection ouverte', () => {
  it.each([
    'https://www.sandbox.paypal.com/checkoutnow?token=5O1',
  ])('devrait accepter %s', (url) => {
    expect(isTrustedApprovalUrl(url)).toBe(true);
  });

  it.each([
    'http://www.paypal.com/checkoutnow',
    'https://www.paypal.com/checkoutnow?token=5O1',
    'https://paypal.com/checkoutnow',
    'https://paypal.com.evil.example/checkoutnow',
    'https://evil.example/checkoutnow',
    'https://notpaypal.com/checkoutnow',
    'javascript:alert(1)',
    '//evil.example',
    '',
  ])('devrait refuser %p', (url) => {
    expect(isTrustedApprovalUrl(url)).toBe(false);
  });
});
