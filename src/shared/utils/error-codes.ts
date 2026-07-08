/**
 * Maps backend EN error codes to i18n translation keys.
 * Backend always sends codes like 'EMAIL_TAKEN', 'QR_NOT_FOUND'.
 * This maps them to frontend translation keys.
 */
export const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  EMAIL_TAKEN: 'errors.emailTaken',
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  REFRESH_TOKEN_INVALID: 'errors.sessionExpired',
  ACCOUNT_NOT_FOUND: 'errors.accountNotFound',
  EVENT_NOT_FOUND: 'errors.notFound',
  TICKET_SOLD_OUT: 'errors.ticketSoldOut',
  QR_NOT_FOUND: 'errors.qrNotFound',
  QR_ALREADY_USED: 'errors.qrAlreadyUsed',
  BUYER_OR_GUEST_REQUIRED: 'errors.buyerOrGuestRequired',
  INVITATION_ALREADY_SENT: 'errors.invitationAlreadySent',
  INVITATION_NOT_FOUND: 'errors.notFound',
  INVITATION_EXPIRED: 'errors.invitationExpired',
  VENDOR_PROFILE_EXISTS: 'errors.profileExists',
  VENUE_PROFILE_EXISTS: 'errors.profileExists',
  FORBIDDEN: 'errors.forbidden',
  VALIDATION_FAILED: 'errors.validationFailed',
};

export function getI18nKeyForError(code: string): string {
  return ERROR_CODE_TO_I18N_KEY[code] ?? 'errors.generic';
}
