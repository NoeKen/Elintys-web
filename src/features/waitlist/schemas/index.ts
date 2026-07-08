import { z } from 'zod';

export const waitlistSchema = z.object({
  firstName: z.string().min(1, 'Veuillez entrer votre prénom.').max(50),
  email: z.string().min(1, 'Veuillez entrer votre adresse email.').email('Veuillez entrer une adresse email valide.'),
  role: z.enum(['organisateur', 'prestataire', 'gestionnaire', 'visiteur'], {
    message: 'Veuillez sélectionner votre rôle.',
  }),
  consentTerms: z.literal(true, {
    message: 'Veuillez accepter la politique de confidentialité et les conditions d’utilisation pour continuer.',
  }),
  consentMarketing: z.boolean(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
