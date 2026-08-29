import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvitationsPage from "./page";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@/shared/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib/api")>();
  return { ...actual, default: { get: mocks.get } };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <InvitationsPage />
    </QueryClientProvider>,
  );
}

const sampleInvitations = [
  {
    _id: "inv-1",
    email: "alice@example.com",
    name: "Invitation — Gala Elintys",
    type: "participant",
    status: "accepted" as const,
    maxUses: 1,
    useCount: 1,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-08-01T10:00:00.000Z",
    event: {
      _id: "event-abc",
      title: "Gala Elintys",
      slug: "gala-elintys",
    },
  },
  {
    _id: "inv-2",
    email: "alice@example.com",
    name: "Invitation — Conférence",
    type: "participant",
    status: "pending" as const,
    maxUses: 1,
    useCount: 0,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-08-10T10:00:00.000Z",
  },
  {
    _id: "inv-3",
    email: "alice@example.com",
    name: "Invitation — Festival passé",
    type: "participant",
    status: "expired" as const,
    maxUses: 1,
    useCount: 0,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: "2026-07-01T10:00:00.000Z",
  },
];

describe("InvitationsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devrait afficher le titre de la page", async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], total: 0, page: 1, limit: 25 },
    });
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Mes invitations" }),
    ).toBeInTheDocument();
  });

  it("devrait afficher l'état vide si aucune invitation", async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], total: 0, page: 1, limit: 25 },
    });
    renderPage();
    expect(await screen.findByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/Aucune invitation reçue/)).toBeInTheDocument();
  });

  it("devrait afficher les cartes d'invitation avec noms et statuts", async () => {
    mocks.get.mockResolvedValue({
      data: { data: sampleInvitations, total: 3, page: 1, limit: 25 },
    });
    renderPage();

    const names = await screen.findAllByTestId("invitation-name");
    expect(names).toHaveLength(3);
    expect(names[0]).toHaveTextContent("Gala Elintys");
    expect(names[1]).toHaveTextContent("Invitation — Conférence");
  });

  it("devrait afficher le badge de statut correct", async () => {
    mocks.get.mockResolvedValue({
      data: { data: sampleInvitations, total: 3, page: 1, limit: 25 },
    });
    renderPage();

    const statuses = await screen.findAllByTestId("invitation-status");
    expect(statuses[0]).toHaveTextContent("Acceptée");
    expect(statuses[1]).toHaveTextContent("En attente");
    expect(statuses[2]).toHaveTextContent("Expirée");
  });

  it("devrait afficher la note pour les invitations en attente", async () => {
    const pendingOnly = [sampleInvitations[1]];
    mocks.get.mockResolvedValue({
      data: { data: pendingOnly, total: 1, page: 1, limit: 25 },
    });
    renderPage();

    expect(await screen.findByRole("note")).toHaveTextContent(
      "Vérifiez votre courriel",
    );
  });

  it("devrait afficher le lien vers l'événement pour une invitation acceptée", async () => {
    const acceptedOnly = [sampleInvitations[0]];
    mocks.get.mockResolvedValue({
      data: { data: acceptedOnly, total: 1, page: 1, limit: 25 },
    });
    renderPage();

    expect(await screen.findByRole("link", { name: /Voir l/ })).toHaveAttribute(
      "href",
      "/evenements/gala-elintys",
    );
  });

  it("devrait appeler GET /invitations/received", async () => {
    mocks.get.mockResolvedValue({
      data: { data: [], total: 0, page: 1, limit: 25 },
    });
    renderPage();

    await screen.findByRole("heading", { name: "Mes invitations" });
    expect(mocks.get).toHaveBeenCalledWith(
      "/invitations/received?page=1&limit=25",
    );
  });

  it("devrait afficher une erreur réseau", async () => {
    mocks.get.mockRejectedValue(new Error("Network error"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de charger vos invitations",
    );
  });
});
