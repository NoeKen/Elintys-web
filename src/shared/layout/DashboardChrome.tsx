'use client';

import { useRef, useState } from 'react';
import { Topbar } from '@/shared/layout/Topbar';
import { MobileMenu } from '@/shared/layout/MobileMenu';

/**
 * Porte l'état d'ouverture du menu mobile.
 *
 * Isolé ici pour que le layout du tableau de bord reste un Server Component :
 * seul ce fragment a besoin d'être interactif.
 */
export function DashboardChrome() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Le dialogue est CONTRÔLÉ : le bouton n'est pas un `Dialog.Trigger`, donc
  // Radix n'a aucune référence vers lui et ne peut pas rendre le focus à la
  // fermeture. On la lui fournit explicitement.
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Topbar onMenuClick={() => setMenuOpen(true)} menuButtonRef={menuButtonRef} />
      <MobileMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        returnFocusTo={menuButtonRef}
      />
    </>
  );
}
