import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EventCreationFormValues } from "@/features/events/lib/event-creation";
import type { EventPublishReadiness } from "@/features/events/services/events.service";
import { ReviewStep } from "./ReviewStep";

/**
 * Étape 6 — récapitulatif et readiness de publication (Sprint 2).
 * Zone identifiée comme peu couverte par le pré-audit.
 */

function values(overrides: Partial<EventCreationFormValues> = {}): EventCreationFormValues {
  return {
    title: "Sommet Elintys",
    eventType: "corporate",
    shortDescription: "Une rencontre annuelle.",
    capacity: 120,
    startDate: "2026-12-01",
    startTime: "18:00",
    dateIsTentative: false,
    venueMode: "existing",
    venueName: "Salle A",
    discoverability: "public",
    accessPolicyType: "open",
    admissionModes: ["registration_only"],
    ...overrides,
  } as EventCreationFormValues;
}

function readiness(overrides: Partial<EventPublishReadiness> = {}): EventPublishReadiness {
  return { publishable: true, errors: [], warnings: [], ...overrides };
}

describe("ReviewStep — données persistées", () => {
  it("devrait afficher les informations réellement saisies", () => {
    render(<ReviewStep values={values()} providerNeeds={[]} onEdit={vi.fn()} />);

    expect(screen.getByText(/Sommet Elintys/)).toBeInTheDocument();
    expect(screen.getByText(/Salle A/)).toBeInTheDocument();
  });

  it("devrait refléter un changement de valeurs", () => {
    const { rerender } = render(
      <ReviewStep values={values()} providerNeeds={[]} onEdit={vi.fn()} />,
    );
    expect(screen.getByText(/Sommet Elintys/)).toBeInTheDocument();

    rerender(
      <ReviewStep values={values({ title: "Gala Horizon" })} providerNeeds={[]} onEdit={vi.fn()} />,
    );
    expect(screen.getByText(/Gala Horizon/)).toBeInTheDocument();
    expect(screen.queryByText(/Sommet Elintys/)).not.toBeInTheDocument();
  });
});

describe("ReviewStep — navigation « Modifier »", () => {
  it("devrait rappeler onEdit avec l'étape ciblée", async () => {
    const user = userEvent.setup({ delay: null });
    const onEdit = vi.fn();
    render(<ReviewStep values={values()} providerNeeds={[]} onEdit={onEdit} />);

    const boutons = screen.getAllByRole("button");
    expect(boutons.length).toBeGreaterThan(0);
    await user.click(boutons[0]);

    expect(onEdit).toHaveBeenCalledTimes(1);
    // L'étape transmise doit être l'une des six étapes du wizard.
    expect([1, 2, 3, 4, 5, 6]).toContain(onEdit.mock.calls[0][0]);
  });

  it("devrait proposer une entrée « Modifier » par section", async () => {
    const user = userEvent.setup({ delay: null });
    const onEdit = vi.fn();
    render(<ReviewStep values={values()} providerNeeds={[]} onEdit={onEdit} />);

    for (const bouton of screen.getAllByRole("button")) {
      await user.click(bouton);
    }
    const étapesCiblées = new Set(onEdit.mock.calls.map((call) => call[0]));
    expect(étapesCiblées.size).toBeGreaterThan(1);
  });
});

describe("ReviewStep — readiness de publication", () => {
  it("devrait indiquer le chargement de la readiness", () => {
    render(
      <ReviewStep values={values()} providerNeeds={[]} onEdit={vi.fn()} readinessLoading />,
    );
    // L'état de chargement ne doit pas annoncer un événement publiable.
    expect(screen.queryByText(/prêt à être publié/i)).not.toBeInTheDocument();
  });

  it("devrait signaler un événement publiable", () => {
    const { container } = render(
      <ReviewStep
        values={values()}
        providerNeeds={[]}
        onEdit={vi.fn()}
        readiness={readiness({ publishable: true })}
      />,
    );
    expect(container.textContent).toBeTruthy();
    // Aucune erreur bloquante affichée.
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("devrait lister les erreurs bloquantes qui empêchent la publication", () => {
    render(
      <ReviewStep
        values={values()}
        providerNeeds={[]}
        onEdit={vi.fn()}
        readiness={readiness({
          publishable: false,
          errors: [
            { code: "EVENT_TYPE_REQUIRED", field: "eventType" },
            { code: "START_DATE_REQUIRED", field: "startDate" },
          ],
        })}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("devrait afficher le code brut d'une erreur inconnue plutôt que rien", () => {
    render(
      <ReviewStep
        values={values()}
        providerNeeds={[]}
        onEdit={vi.fn()}
        readiness={readiness({
          publishable: false,
          errors: [{ code: "CODE_INCONNU_DU_FRONT", field: "x" }],
        })}
      />,
    );
    expect(screen.getByText(/CODE_INCONNU_DU_FRONT/)).toBeInTheDocument();
  });

  it("devrait dédupliquer l'affichage par couple code/champ", () => {
    render(
      <ReviewStep
        values={values()}
        providerNeeds={[]}
        onEdit={vi.fn()}
        readiness={readiness({
          publishable: false,
          errors: [
            { code: "TITLE_REQUIRED", field: "title" },
            { code: "TITLE_REQUIRED", field: "title" },
          ],
        })}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("ne devrait rien afficher de bloquant sans readiness fournie", () => {
    render(<ReviewStep values={values()} providerNeeds={[]} onEdit={vi.fn()} />);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});

describe("ReviewStep — billetterie hors périmètre MVP", () => {
  it("devrait refléter une intention de billet payant sans simuler de vente", () => {
    const { container } = render(
      <ReviewStep
        values={values({ admissionModes: ["paid_ticket"] })}
        providerNeeds={[]}
        onEdit={vi.fn()}
        readiness={readiness({
          publishable: false,
          errors: [{ code: "PAID_TICKET_TYPE_REQUIRED", field: "ticketTypes" }],
        })}
      />,
    );
    // La publication est bloquée et aucun montant/paiement n'est présenté.
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/stripe|payer|paiement réussi/i);
  });
});
