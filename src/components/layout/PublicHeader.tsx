"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { cn } from "@/shared/lib/utils";

const NAV_LINKS = [
  { label: "Événements", href: "/evenements" },
  { label: "Prestataires", href: "/prestataires" },
  { label: "Lieux", href: "/lieux" },
  { label: "Comment ça marche", href: "/comment-ca-marche" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 h-16",
        "border-b border-outline-variant bg-surface/95 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-2"
          aria-label="Elintys - Accueil"
          data-testid="public-header-logo"
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md bg-accent",
              "text-sm font-bold text-white"
            )}
          >
            E
          </div>
          <span className="font-serif text-xl font-bold text-primary">Elintys</span>
        </Link>

        <nav
          className="hidden flex-1 items-center gap-6 md:flex"
          aria-label="Navigation principale"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "border-b-2 border-transparent pb-0.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-accent text-primary"
                    : "text-on-surface-variant hover:text-primary"
                )}
                aria-current={isActive ? "page" : undefined}
                data-testid={`public-nav-${link.href.slice(1)}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              href="/tableau-de-bord"
              className={cn(
                "rounded-md bg-accent px-3 py-2 text-sm font-medium text-white",
                "transition-opacity hover:opacity-90 sm:px-4"
              )}
              data-testid="public-header-dashboard"
            >
              Mon tableau de bord
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className={cn(
                  "rounded-md border border-outline-variant px-3 py-2 text-sm font-medium text-primary",
                  "transition-colors hover:bg-surface-low sm:px-4"
                )}
                data-testid="public-header-login"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className={cn(
                  "hidden rounded-md bg-accent px-4 py-2 text-sm font-medium text-white",
                  "transition-opacity hover:opacity-90 sm:inline-flex"
                )}
                data-testid="public-header-register"
              >
                S&apos;inscrire gratuitement
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
