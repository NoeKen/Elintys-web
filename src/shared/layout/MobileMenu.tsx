'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';
import { buildNavSections } from '@/shared/layout/sidebar-nav';
import { NavIcon } from '@/shared/layout/nav-icons';

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Élément qui reprend le focus à la fermeture. */
  returnFocusTo?: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Tiroir de navigation ouvert par le bouton menu de la barre supérieure.
 *
 * Ce bouton existait déjà mais recevait un `onMenuClick` jamais fourni par le
 * layout : il était donc inerte. Sous 768 px la barre latérale est masquée,
 * l'utilisateur cliquait sur un menu qui ne s'ouvrait jamais.
 *
 * Le contenu vient de `buildNavSections`, la même source que la barre latérale
 * et que la barre inférieure : aucune information de navigation n'est
 * redéfinie ici, et les placeholders restent affichés comme sur desktop.
 */
export function MobileMenu({ open, onOpenChange, returnFocusTo }: MobileMenuProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const sections = buildNavSections(user?.roles ?? []);

  // Refermer à la navigation : sinon le tiroir masque l'écran atteint.
  useEffect(() => onOpenChange(false), [pathname, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/25 backdrop-blur-[2px] md:hidden" />
        <Dialog.Content
          id="mobile-dashboard-menu"
          onCloseAutoFocus={(event) => {
            // Sans cela le focus retombe sur <body> : l'utilisateur au clavier
            // perd sa position et doit re-tabuler depuis le début du document.
            const trigger = returnFocusTo?.current;
            if (!trigger) return;
            event.preventDefault();
            trigger.focus();
          }}
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col overflow-y-auto',
            'border-r border-white/50 bg-white p-4 shadow-nav focus:outline-none md:hidden',
          )}
          data-testid="mobile-menu"
        >
          <Dialog.Title className="mb-6 font-serif text-2xl text-primary">Elintys</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigation principale du tableau de bord
          </Dialog.Description>

          <nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
            {sections.map((section, sectionIndex) => (
              <div key={`${section.label}-${sectionIndex}`} className="mb-2">
                {section.label && (
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {section.label}
                  </p>
                )}
                {section.items.map((item) => {
                  const active =
                    item.href === '/tableau-de-bord'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
                        active
                          ? 'bg-teal/10 text-teal-dark'
                          : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface',
                      )}
                    >
                      <NavIcon name={item.icon} size={18} />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="ml-auto rounded-full bg-teal px-2 py-0.5 text-xs font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <Dialog.Close asChild>
            <button
              type="button"
              className="mt-4 min-h-11 rounded-2xl border border-border px-3 py-2 text-sm font-semibold text-on-surface-variant"
            >
              Fermer
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
