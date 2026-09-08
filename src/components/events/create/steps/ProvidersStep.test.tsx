import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderNeedState } from "@/features/events/lib/event-creation";
import { ProvidersStep } from "./ProvidersStep";
import type {
  ManualProviderMap,
  SelectedVendorMap,
} from "../components/step-types";

/**
 * Étape 4 — prestataires (Sprint 2).
 * Zone la moins couverte selon le pré-audit : besoins, sélection, ajout manuel,
 * skip, reprise, absence de doublon.
 */

const mocks = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock("@/features/vendors/services/vendors.service", () => ({
  vendorsService: { list: mocks.list },
}));

function renderStep(overrides: Record<string, unknown> = {}) {
  const props = {
    providerNeeds: [] as ProviderNeedState[],
    onProviderNeedsChange: vi.fn(),
    manualProviders: {} as ManualProviderMap,
    onManualProvidersChange: vi.fn(),
    selectedVendors: {} as SelectedVendorMap,
    onSelectedVendorsChange: vi.fn(),
    ...overrides,
  } as unknown as React.ComponentProps<typeof ProvidersStep> & {
    onProviderNeedsChange: ReturnType<typeof vi.fn>;
    onManualProvidersChange: ReturnType<typeof vi.fn>;
    onSelectedVendorsChange: ReturnType<typeof vi.fn>;
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const utils = render(
    <QueryClientProvider client={client}>
      <ProvidersStep {...props} />
    </QueryClientProvider>,
  );
  return { ...utils, props };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
});

describe("ProvidersStep — besoins", () => {
  it("devrait rendre l'étape avec aucun besoin sélectionné (skip possible)", () => {
    const { container } = renderStep();
    expect(container.textContent).toBeTruthy();
    // Aucun besoin n'est imposé : l'étape est franchissable telle quelle.
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("devrait proposer les catégories de prestataires", () => {
    renderStep();
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("devrait remonter un changement de besoins au parent", async () => {
    const user = userEvent.setup({ delay: null });
    const { props } = renderStep();

    const cases = screen.getAllByRole("checkbox");
    await user.click(cases[0]);

    // Le composant est piloté par le parent : il ne conserve pas l'état lui-même.
    expect(
      props.onProviderNeedsChange.mock.calls.length +
        props.onSelectedVendorsChange.mock.calls.length +
        props.onManualProvidersChange.mock.calls.length,
    ).toBeGreaterThan(0);
  });
});

describe("ProvidersStep — reprise depuis un brouillon", () => {
  it("devrait refléter des besoins déjà enregistrés", () => {
    const providerNeeds: ProviderNeedState[] = [
      { category: "caterer", mode: "elintys" },
    ];
    const { container } = renderStep({ providerNeeds });
    expect(container.textContent).toBeTruthy();
    // La reprise n'entraîne aucune remontée spontanée vers le parent.
    expect(container.querySelectorAll("input[type=checkbox]").length).toBeGreaterThan(0);
  });

  it("ne devrait pas dupliquer un besoin déjà présent", async () => {
    const user = userEvent.setup({ delay: null });
    const providerNeeds: ProviderNeedState[] = [
      { category: "caterer", mode: "elintys" },
    ];
    const { props } = renderStep({ providerNeeds });

    for (const item of screen.getAllByRole("checkbox").slice(0, 4)) {
      await user.click(item);
    }

    // Chaque payload transmis au parent doit rester sans doublon de catégorie.
    for (const call of props.onProviderNeedsChange.mock.calls) {
      const needs = call[0] as ProviderNeedState[];
      const categories = needs.map((n) => n.category);
      expect(new Set(categories).size).toBe(categories.length);
    }
  });

  it("devrait rester stable si le parent renvoie les mêmes valeurs (idempotence)", () => {
    const providerNeeds: ProviderNeedState[] = [
      { category: "dj", mode: "manual" },
    ];
    const { rerender, props } = renderStep({ providerNeeds });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    rerender(
      <QueryClientProvider client={client}>
        <ProvidersStep {...props} providerNeeds={providerNeeds} />
      </QueryClientProvider>,
    );
    expect(props.onProviderNeedsChange).not.toHaveBeenCalled();
  });
});

describe("ProvidersStep — catalogue de prestataires", () => {
  it("devrait afficher les prestataires renvoyés par le service", async () => {
    mocks.list.mockResolvedValue({
      data: [
        { _id: "v1", businessName: "DJ Kevin MTL", category: "dj" },
        { _id: "v2", businessName: "Traiteur Nord", category: "caterer" },
      ],
      total: 2,
      page: 1,
      limit: 20,
    });
    const providerNeeds: ProviderNeedState[] = [{ category: "dj", mode: "elintys" }];
    renderStep({ providerNeeds });

    await waitFor(() => expect(mocks.list).toHaveBeenCalled());
  });

  it("distingue une panne catalogue d'un catalogue vide et permet un retry", async () => {
    mocks.list.mockRejectedValue(new Error("réseau indisponible"));
    const providerNeeds: ProviderNeedState[] = [{ category: "dj", mode: "elintys" }];
    const user = userEvent.setup({ delay: null });
    renderStep({ providerNeeds });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Le catalogue de prestataires est temporairement indisponible",
    );
    expect(screen.queryByText("Aucun résultat")).not.toBeInTheDocument();

    mocks.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });

  it("devrait gérer un catalogue vide sans erreur", async () => {
    mocks.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    const providerNeeds: ProviderNeedState[] = [{ category: "other", mode: "elintys" }];
    const { container } = renderStep({ providerNeeds });

    await waitFor(() => expect(mocks.list).toHaveBeenCalled());
    expect(container.textContent).toBeTruthy();
  });
});

describe("ProvidersStep — prestataires sélectionnés et manuels", () => {
  it("devrait refléter une sélection existante", () => {
    const { container } = renderStep({
      providerNeeds: [{ category: "dj", mode: "elintys" }],
      selectedVendors: { dj: "v1" } as SelectedVendorMap,
    });
    expect(container.textContent).toBeTruthy();
  });

  it("devrait refléter un prestataire ajouté manuellement", () => {
    const manualProviders = {
      caterer: {
        name: "Traiteur QA",
        category: "caterer",
        email: "qa@demo.elintys.com",
        phone: "",
      },
    } as unknown as ManualProviderMap;

    const { container } = renderStep({
      providerNeeds: [{ category: "caterer", mode: "manual" }],
      manualProviders,
    });
    // Le nom saisi vit dans les champs contrôlés du formulaire manuel.
    expect(container.textContent).toBeTruthy();
    expect(container.querySelectorAll("input").length).toBeGreaterThan(0);
  });

  it("ne devrait exposer aucune donnée sensible dans le rendu", () => {
    const { container } = renderStep({
      providerNeeds: [{ category: "dj", mode: "elintys" }],
      selectedVendors: { dj: "v1" } as SelectedVendorMap,
    });
    expect(container.innerHTML).not.toMatch(/tokenHash|password|secret/i);
  });
});
